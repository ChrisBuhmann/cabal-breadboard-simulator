import { useRef, useState } from 'react';
import type { CircuitSnapshot } from '../state/circuitState';
import { deleteNamedDesign, listSavedDesignNames, loadNamedDesign, saveNamedDesign } from '../state/circuitState';
import { downloadDesignFile, readDesignFile } from '../state/designFile';

interface DesignManagerPanelProps {
  snapshot: CircuitSnapshot;
  onLoad: (snapshot: CircuitSnapshot, name: string) => void;
  flash: (msg: string) => void;
}

export function DesignManagerPanel({ snapshot, onLoad, flash }: DesignManagerPanelProps) {
  const [name, setName] = useState('');
  const [savedNames, setSavedNames] = useState<string[]>(() => listSavedDesignNames());
  const [selected, setSelected] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshSavedNames = () => setSavedNames(listSavedDesignNames());

  const handleSaveAs = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      flash('Name the design before saving');
      return;
    }
    saveNamedDesign(trimmed, snapshot);
    refreshSavedNames();
    setSelected(trimmed);
    flash(`Saved "${trimmed}"`);
  };

  const handleLoad = () => {
    if (!selected) {
      flash('Pick a saved design to load');
      return;
    }
    const found = loadNamedDesign(selected);
    if (!found) {
      flash(`"${selected}" not found`);
      return;
    }
    onLoad(found, selected);
    setName(selected);
    flash(`Loaded "${selected}"`);
  };

  const handleDelete = () => {
    if (!selected) {
      flash('Pick a saved design to delete');
      return;
    }
    deleteNamedDesign(selected);
    refreshSavedNames();
    flash(`Deleted "${selected}"`);
    setSelected('');
  };

  const handleExport = () => {
    downloadDesignFile(name.trim() || 'circuit', snapshot);
    flash('Design file downloaded');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { name: fileName, snapshot: fileSnapshot } = await readDesignFile(file);
      onLoad(fileSnapshot, fileName);
      setName(fileName);
      flash(`Imported "${fileName}"`);
    } catch {
      flash('Could not read that file as a breadboard design');
    }
  };

  return (
    <div className="design-manager">
      <input
        className="design-name-input"
        placeholder="Design name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleSaveAs} title="Save the current board under this name, in this browser">
        Save As
      </button>

      <select
        className="design-select"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        aria-label="Saved designs"
      >
        <option value="">
          {savedNames.length === 0 ? 'No saved designs' : 'Choose a saved design...'}
        </option>
        {savedNames.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <button disabled={!selected} onClick={handleLoad}>
        Load
      </button>
      <button disabled={!selected} onClick={handleDelete}>
        Delete
      </button>

      <button onClick={handleExport} title="Download the current board as a .json file you can keep or share">
        Export File
      </button>
      <button onClick={() => fileInputRef.current?.click()} title="Load a design from a .json file">
        Import File
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />
    </div>
  );
}
