import { useState } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import { DexiePersistence, validateSnapshot } from '@amat19/persistence';
import { Button } from './ui/Button';
import { Feedback } from './ui/Feedback';

export default function DataManager() {
  const [message, setMessage] = useState<{ tone: 'success' | 'error' | 'neutral'; text: string }>();

  async function exportData() {
    try {
      const db = new DexiePersistence();
      const snapshot = await db.exportSnapshot(new Date().toISOString());
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `amat19-local-data-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage({ tone: 'success', text: 'Local study data exported.' });
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'Export failed.' });
    }
  }

  async function importData(file?: File) {
    if (!file) return;
    try {
      const text = await file.text();
      const snapshot = validateSnapshot(JSON.parse(text));
      const db = new DexiePersistence();
      await db.importSnapshot(snapshot);
      setMessage({ tone: 'success', text: 'Local study data restored. Reload a lab to use restored drafts.' });
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'The selected file could not be imported.' });
    }
  }

  async function clearData() {
    if (!window.confirm('Clear all saved AMAT 19 drafts, attempts, mastery, and settings from this browser? This cannot be undone unless you exported a backup.')) return;
    try {
      const db = new DexiePersistence();
      await db.clearAll();
      setMessage({ tone: 'success', text: 'All local AMAT 19 data was cleared.' });
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'Could not clear local data.' });
    }
  }

  async function requestPersistence() {
    if (!navigator.storage?.persist) {
      setMessage({ tone: 'neutral', text: 'Persistent-storage requests are not supported in this browser.' });
      return;
    }
    const granted = await navigator.storage.persist();
    setMessage({
      tone: granted ? 'success' : 'neutral',
      text: granted
        ? 'The browser granted persistent storage for this site.'
        : 'The browser kept default storage behavior. The app still works; exporting a backup remains the strongest portable copy.'
    });
  }

  return (
    <section className="data-manager" data-testid="data-manager">
      <div>
        <h2>Export or restore local study data</h2>
        <p>
          AMAT 19 stores drafts and progress in this browser. No account or cloud sync is required. Export a JSON
          snapshot before clearing site data or moving to another browser.
        </p>
      </div>
      <div className="data-manager__actions">
        <Button variant="primary" type="button" onClick={exportData}><Download size={16} aria-hidden="true" /> Export JSON</Button>
        <label className="amat-button amat-button--secondary file-button">
          <Upload size={16} aria-hidden="true" /> Import JSON
          <input type="file" accept="application/json,.json" onChange={(event) => void importData(event.target.files?.[0])} />
        </label>
        <Button variant="secondary" type="button" onClick={requestPersistence}>Ask browser to protect local data</Button>
        <Button variant="ghost" type="button" onClick={clearData}><Trash2 size={16} aria-hidden="true" /> Clear local data</Button>
      </div>
      {message && <Feedback tone={message.tone === 'neutral' ? 'neutral' : message.tone} role={message.tone === 'error' ? 'alert' : 'status'}>{message.text}</Feedback>}
    </section>
  );
}
