import type { CircuitSnapshot } from './circuitState';
import { downloadText } from '../util/download';

/** A saved-design file is just a CircuitSnapshot plus a name, so re-importing
 * it can suggest the design's original name back in the UI. */
export interface DesignFile {
  name: string;
  snapshot: CircuitSnapshot;
}

function sanitizeFilename(name: string): string {
  return (name.trim() || 'circuit').replace(/[^A-Za-z0-9_-]+/g, '_');
}

export function downloadDesignFile(name: string, snapshot: CircuitSnapshot) {
  const file: DesignFile = { name, snapshot };
  downloadText(JSON.stringify(file, null, 2), 'application/json', `${sanitizeFilename(name)}.json`);
}

/** Accepts either a full {name, snapshot} design file or a bare CircuitSnapshot
 * (e.g. a file saved by an older version of this tool), so re-importing an
 * export never depends on which shape produced it. */
export async function readDesignFile(file: File): Promise<DesignFile> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Partial<DesignFile> & Partial<CircuitSnapshot>;

  const snapshot: CircuitSnapshot = parsed.snapshot ?? {
    components: parsed.components ?? [],
    wires: parsed.wires ?? [],
    railLinks: parsed.railLinks ?? [],
  };
  if (!Array.isArray(snapshot.components) || !Array.isArray(snapshot.wires)) {
    throw new Error('Not a recognizable breadboard design file');
  }

  const fallbackName = file.name.replace(/\.json$/i, '');
  return { name: parsed.name ?? fallbackName, snapshot };
}
