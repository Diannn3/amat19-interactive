import { useEffect, useState } from 'react';
import { Database, Download, HardDriveDownload, Trash2, Upload } from 'lucide-react';
import { CURRENT_SCHEMA_VERSION, DexiePersistence, projectSnapshotForScope, validateSnapshot, type LocalSnapshot, type SnapshotScope } from '@amat19/persistence';
import { Button } from './ui/Button';
import { Feedback } from './ui/Feedback';
import { Badge } from './ui/Badge';

type SnapshotMode = SnapshotScope;
type Counts = { drafts: number; attempts: number; mastery: number; sessions: number; saved: number };

function downloadSnapshot(snapshot: LocalSnapshot, suffix: string) {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `amat19-${suffix}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function DataManager() {
  const [message, setMessage] = useState<{ tone: 'success' | 'error' | 'neutral'; text: string }>();
  const [counts, setCounts] = useState<Counts>();
  const [mode, setMode] = useState<SnapshotMode>('full');

  async function refreshCounts() {
    try {
      const db = new DexiePersistence();
      const [drafts, attempts, mastery, sessions, saved] = await Promise.all([
        db.listLabDrafts(), db.listAttempts(), db.listMastery(), db.listSessions(), db.listSavedItems()
      ]);
      setCounts({ drafts: drafts.length, attempts: attempts.length, mastery: mastery.length, sessions: sessions.length, saved: saved.length });
    } catch {
      setCounts(undefined);
    }
  }

  useEffect(() => { void refreshCounts(); }, []);

  async function exportData() {
    try {
      const db = new DexiePersistence();
      const snapshot = await db.exportSnapshot(new Date().toISOString());
      downloadSnapshot(projectSnapshotForScope(snapshot, mode), mode === 'full' ? 'local-backup' : mode === 'progress' ? 'progress' : 'saved-items');
      setMessage({ tone: 'success', text: `${mode === 'full' ? 'Full local backup' : mode === 'progress' ? 'Progress evidence' : 'Saved items'} exported.` });
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'Export failed.' });
    }
  }

  async function importData(file?: File) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setMessage({ tone: 'error', text: 'That backup is larger than the 8 MB local import limit.' });
      return;
    }
    try {
      const text = await file.text();
      const snapshot = validateSnapshot(JSON.parse(text));
      const db = new DexiePersistence();
      await db.importSnapshot(snapshot);
      await refreshCounts();
      setMessage({ tone: 'success', text: `${snapshot.snapshotScope === 'progress' ? 'Progress evidence' : snapshot.snapshotScope === 'saved' ? 'Saved items' : 'Local study data'} restored${snapshot.snapshotScope && snapshot.snapshotScope !== 'full' ? ' without replacing unrelated local data' : ''}.` });
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'The selected file could not be imported.' });
    }
  }

  async function clearData() {
    if (!window.confirm('Clear all AMAT 19 drafts, attempts, mastery, study sessions, saved items, and settings from this browser? Export a backup first if you may want them later.')) return;
    try {
      const db = new DexiePersistence();
      await db.clearAll();
      await refreshCounts();
      setMessage({ tone: 'success', text: 'All local AMAT 19 study data was cleared.' });
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
        : 'The browser kept default storage behavior. AMAT 19 still works locally; a backup remains the most portable copy.'
    });
  }

  return (
    <section className="data-manager" data-testid="data-manager">
      <div className="data-manager__head">
        <div>
          <h2>Your work stays in this browser.</h2>
          <p className="section-context">Local-first data</p>
          <p>AMAT 19 stores study history in local browser storage. Export a portable JSON copy whenever you want; no account is required.</p>
        </div>
        <Badge>v{CURRENT_SCHEMA_VERSION}</Badge>
      </div>

      {counts && (
        <div className="data-manager__counts" aria-label="Local data summary">
          <span><strong>{counts.drafts}</strong> drafts</span>
          <span><strong>{counts.attempts}</strong> attempts</span>
          <span><strong>{counts.mastery}</strong> skills</span>
          <span><strong>{counts.sessions}</strong> sessions</span>
          <span><strong>{counts.saved}</strong> saved</span>
        </div>
      )}

      <fieldset className="data-manager__export-mode">
        <legend>What should this export contain?</legend>
        <label><input type="radio" name="snapshot-mode" checked={mode === 'full'} onChange={() => setMode('full')} /> Full backup</label>
        <label><input type="radio" name="snapshot-mode" checked={mode === 'progress'} onChange={() => setMode('progress')} /> Progress only</label>
        <label><input type="radio" name="snapshot-mode" checked={mode === 'saved'} onChange={() => setMode('saved')} /> Saved items only</label>
      </fieldset>

      <div className="data-manager__actions">
        <Button variant="primary" type="button" onClick={exportData}><Download size={16} aria-hidden="true" /> Export JSON</Button>
        <label className="amat-button amat-button--secondary file-button">
          <Upload size={16} aria-hidden="true" /> Import JSON
          <input type="file" accept="application/json,.json" onChange={(event) => void importData(event.target.files?.[0])} />
        </label>
        <Button variant="secondary" type="button" onClick={requestPersistence}><HardDriveDownload size={16} aria-hidden="true" /> Protect local data</Button>
        <Button variant="ghost" type="button" onClick={refreshCounts}><Database size={16} aria-hidden="true" /> Refresh summary</Button>
        <Button variant="ghost" type="button" onClick={clearData}><Trash2 size={16} aria-hidden="true" /> Clear local data</Button>
      </div>
      {message && <Feedback tone={message.tone === 'neutral' ? 'neutral' : message.tone} role={message.tone === 'error' ? 'alert' : 'status'}>{message.text}</Feedback>}
    </section>
  );
}
