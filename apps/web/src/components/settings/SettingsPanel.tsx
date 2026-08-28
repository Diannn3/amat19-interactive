import { useEffect, useState } from 'react';
import { DexiePersistence } from '@amat19/persistence';
import { Feedback } from '../ui/Feedback';

type Settings = { reducedMotion: boolean };

const defaults: Settings = { reducedMotion: false };
const motionStorageKey = 'amat19-motion';

function applyMotionPreference(reduced: boolean) {
  document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  try {
    window.localStorage.setItem(motionStorageKey, reduced ? 'reduced' : 'full');
  } catch {
    // The preference still applies for this page when local storage is blocked.
  }
}

export default function SettingsPanel() {
  const [value, setValue] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    const db = new DexiePersistence();

    db.getSetting<boolean>('reducedMotion').then((stored) => {
      if (!active) return;
      const next = { reducedMotion: stored === true };
      setValue(next);
      applyMotionPreference(next.reducedMotion);
      setReady(true);
    }).catch(() => {
      if (!active) return;
      applyMotionPreference(defaults.reducedMotion);
      setReady(true);
    });

    return () => { active = false; };
  }, []);

  async function update(next: boolean) {
    setValue({ reducedMotion: next });
    setSaved(false);
    applyMotionPreference(next);
    try {
      await new DexiePersistence().setSetting('reducedMotion', next, new Date().toISOString());
      setSaved(true);
    } catch {
      // Keep the current-page preference even if persistence is unavailable.
    }
  }

  if (!ready) return <p role="status">Loading local preferences…</p>;

  return (
    <div className="settings-grid" data-testid="settings-panel">
      <label className="setting-row">
        <span>
          <strong>Reduce interface motion</strong>
          <small>Use fewer transitions and animations while you study.</small>
        </span>
        <input type="checkbox" checked={value.reducedMotion} onChange={(event) => void update(event.target.checked)} />
      </label>
      {saved && <Feedback tone="success">Saved locally.</Feedback>}
    </div>
  );
}
