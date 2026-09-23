import { useEffect, useState } from 'react';
import { DexiePersistence } from '@amat19/persistence';
import { Feedback } from '../ui/Feedback';

type Settings = {
  reducedMotion: boolean;
  darkMode: boolean;
};

const defaults: Settings = {
  reducedMotion: false,
  darkMode: false,
};

const motionStorageKey = 'amat19-motion';

function applyMotionPreference(reduced: boolean) {
  document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  try {
    window.localStorage.setItem(motionStorageKey, reduced ? 'reduced' : 'full');
  } catch {
    // The preference still applies for this page when local storage is blocked.
  }
}

function requestTheme(darkMode: boolean) {
  window.dispatchEvent(new CustomEvent('amat:theme-request', {
    detail: { theme: darkMode ? 'dark' : 'light' },
  }));
}

export default function SettingsPanel() {
  const [value, setValue] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    const db = new DexiePersistence();
    const initialDarkMode = document.documentElement.dataset.theme === 'dark';

    db.getSetting<boolean>('reducedMotion').then((stored) => {
      if (!active) return;
      const next = {
        reducedMotion: stored === true,
        darkMode: initialDarkMode,
      };
      setValue(next);
      applyMotionPreference(next.reducedMotion);
      setReady(true);
    }).catch(() => {
      if (!active) return;
      setValue({
        reducedMotion: defaults.reducedMotion,
        darkMode: initialDarkMode,
      });
      applyMotionPreference(defaults.reducedMotion);
      setReady(true);
    });

    const syncTheme = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      const darkMode = event.detail?.theme === 'dark';
      setValue((current) => ({ ...current, darkMode }));
    };
    window.addEventListener('amat:theme-applied', syncTheme);

    return () => {
      active = false;
      window.removeEventListener('amat:theme-applied', syncTheme);
    };
  }, []);

  async function updateMotion(next: boolean) {
    setValue((current) => ({ ...current, reducedMotion: next }));
    setSaved(false);
    applyMotionPreference(next);
    try {
      await new DexiePersistence().setSetting('reducedMotion', next, new Date().toISOString());
      setSaved(true);
    } catch {
      // Keep the current-page preference even if persistence is unavailable.
    }
  }

  async function updateDarkMode(next: boolean) {
    setValue((current) => ({ ...current, darkMode: next }));
    setSaved(false);
    requestTheme(next);
    try {
      await new DexiePersistence().setSetting('darkMode', next, new Date().toISOString());
      setSaved(true);
    } catch {
      // AppLayout persists the appearance preference in localStorage.
    }
  }

  if (!ready) return <p role="status">Loading local preferences…</p>;

  return (
    <div className="settings-grid" data-testid="settings-panel">
      <label className="setting-row">
        <span>
          <strong>Dark mode</strong>
          <small>Use a darker interface across the study lab.</small>
        </span>
        <input
          className="setting-switch"
          type="checkbox"
          role="switch"
          aria-label="Dark mode"
          checked={value.darkMode}
          onChange={(event) => void updateDarkMode(event.target.checked)}
        />
      </label>

      <label className="setting-row">
        <span>
          <strong>Reduce interface motion</strong>
          <small>Use fewer transitions and animations while you study.</small>
        </span>
        <input
          className="setting-switch"
          type="checkbox"
          role="switch"
          aria-label="Reduce interface motion"
          checked={value.reducedMotion}
          onChange={(event) => void updateMotion(event.target.checked)}
        />
      </label>

      {saved && <Feedback tone="success">Saved locally.</Feedback>}
    </div>
  );
}
