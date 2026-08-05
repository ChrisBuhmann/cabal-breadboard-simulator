import type { Netlist } from './netlistBuilder';
import { downloadText } from '../util/download';

export function netlistToJSON(netlist: Netlist): string {
  return JSON.stringify(netlist, null, 2);
}

export function downloadNetlist(netlist: Netlist, filename = 'netlist.json') {
  downloadText(netlistToJSON(netlist), 'application/json', filename);
}

export function downloadKicadSchematic(schematic: string, filename = 'breadboard.kicad_sch') {
  downloadText(schematic, 'application/x-kicad-schematic', filename);
}
