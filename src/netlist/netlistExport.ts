import type { Netlist } from './netlistBuilder';

export function netlistToJSON(netlist: Netlist): string {
  return JSON.stringify(netlist, null, 2);
}

function downloadText(text: string, mimeType: string, filename: string) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadNetlist(netlist: Netlist, filename = 'netlist.json') {
  downloadText(netlistToJSON(netlist), 'application/json', filename);
}

export function downloadKicadSchematic(schematic: string, filename = 'breadboard.kicad_sch') {
  downloadText(schematic, 'application/x-kicad-schematic', filename);
}
