import type { BoardModel } from '../board/boardTypes';
import type { PlacedComponent } from '../components/componentDefs';
import type { Wire } from '../interaction/jumperSnap';
import { resolvePinHoles } from '../interaction/snapLogic';

class UnionFind {
  private parent = new Map<string, string>();

  constructor(ids: string[]) {
    for (const id of ids) this.parent.set(id, id);
  }

  find(id: string): string {
    let root = id;
    while (this.parent.get(root) !== root) {
      root = this.parent.get(root)!;
    }
    let cur = id;
    while (this.parent.get(cur) !== root) {
      const next = this.parent.get(cur)!;
      this.parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  union(a: string, b: string) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) this.parent.set(rootA, rootB);
  }
}

export interface NetlistPinRef {
  component_id: string;
  pin_index: number;
}

export interface NetlistNode {
  id: string;
  connected_pins: NetlistPinRef[];
}

export interface Netlist {
  nodes: NetlistNode[];
}

export function buildNetlist(boards: BoardModel[], components: PlacedComponent[], wires: Wire[]): Netlist {
  const boardsById = new Map(boards.map((b) => [b.id, b]));
  const uf = new UnionFind(boards.flatMap((b) => b.nodeGroupIds));

  for (const wire of wires) {
    const board = boardsById.get(wire.boardId);
    const fromGroup = board?.holesById.get(wire.fromHoleId)?.nodeGroupId;
    const toGroup = board?.holesById.get(wire.toHoleId)?.nodeGroupId;
    if (fromGroup && toGroup) uf.union(fromGroup, toGroup);
  }

  const rootToPins = new Map<string, NetlistPinRef[]>();
  for (const comp of components) {
    const board = boardsById.get(comp.boardId);
    if (!board) continue;
    const pinHoles = resolvePinHoles(board, comp.type, comp.anchorHoleId, comp.rotation);
    if (!pinHoles) continue;
    pinHoles.forEach((hole, pinIndex) => {
      const root = uf.find(hole.nodeGroupId);
      const list = rootToPins.get(root) ?? [];
      list.push({ component_id: comp.id, pin_index: pinIndex });
      rootToPins.set(root, list);
    });
  }

  const nodes: NetlistNode[] = Array.from(rootToPins.entries()).map(([root, pins], i) => ({
    id: `N${i}_${root}`,
    connected_pins: pins,
  }));

  return { nodes };
}
