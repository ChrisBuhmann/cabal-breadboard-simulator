import type { Netlist } from './netlistBuilder';

export function netlistToJSON(netlist: Netlist): string {
  return JSON.stringify(netlist, null, 2);
}

export function downloadNetlist(netlist: Netlist, filename = 'netlist.json') {
  const blob = new Blob([netlistToJSON(netlist)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
