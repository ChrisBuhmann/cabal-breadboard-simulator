import type { BoardModel } from '../board/boardTypes';
import type { PlacedComponent } from '../components/componentDefs';
import type { Netlist } from '../netlist/netlistBuilder';
import { buildKicadSchematic } from '../netlist/kicadExport';
import { downloadKicadSchematic, downloadNetlist, netlistToJSON } from '../netlist/netlistExport';

interface NetlistDebugPanelProps {
  netlist: Netlist;
  boards: BoardModel[];
  components: PlacedComponent[];
  open: boolean;
  onToggle: () => void;
}

export function NetlistDebugPanel({ netlist, boards, components, open, onToggle }: NetlistDebugPanelProps) {
  return (
    <div className={`debug-panel${open ? ' open' : ''}`}>
      <div className="debug-panel-header">
        <button onClick={onToggle}>{open ? 'Hide' : 'Show'} Netlist Debug</button>
        {open && <button onClick={() => downloadNetlist(netlist)}>Export JSON</button>}
        {open && (
          <button
            disabled={components.length === 0}
            onClick={() => downloadKicadSchematic(buildKicadSchematic(boards, components, netlist))}
            title="Generates a starter .kicad_sch with one symbol per component and net labels wiring them together. Open it in KiCad and tidy up the layout."
          >
            Export KiCad Schematic
          </button>
        )}
      </div>
      {open && (
        <pre className="debug-json">
          {netlist.nodes.length === 0 ? '// no connected nodes yet' : netlistToJSON(netlist)}
        </pre>
      )}
    </div>
  );
}
