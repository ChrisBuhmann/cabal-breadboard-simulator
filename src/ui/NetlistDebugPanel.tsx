import type { Netlist } from '../netlist/netlistBuilder';
import { downloadNetlist, netlistToJSON } from '../netlist/netlistExport';

interface NetlistDebugPanelProps {
  netlist: Netlist;
  open: boolean;
  onToggle: () => void;
}

export function NetlistDebugPanel({ netlist, open, onToggle }: NetlistDebugPanelProps) {
  return (
    <div className={`debug-panel${open ? ' open' : ''}`}>
      <div className="debug-panel-header">
        <button onClick={onToggle}>{open ? 'Hide' : 'Show'} Netlist Debug</button>
        {open && <button onClick={() => downloadNetlist(netlist)}>Export JSON</button>}
      </div>
      {open && (
        <pre className="debug-json">
          {netlist.nodes.length === 0 ? '// no connected nodes yet' : netlistToJSON(netlist)}
        </pre>
      )}
    </div>
  );
}
