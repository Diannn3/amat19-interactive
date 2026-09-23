import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const files = {
  layout: new URL('../../apps/web/src/layouts/AppLayout.astro', import.meta.url),
  settings: new URL('../../apps/web/src/components/settings/SettingsPanel.tsx', import.meta.url),
  theme: new URL('../../apps/web/src/styles/theme.css', import.meta.url),
  pass4: new URL('../../apps/web/src/styles/pass4.css', import.meta.url),
  glass: new URL('../../apps/web/src/styles/apple-glass.css', import.meta.url),
};

test('appearance contract is binary light or dark with a deterministic light fallback', async () => {
  const [layout, settings, theme] = await Promise.all([
    readFile(files.layout, 'utf8'),
    readFile(files.settings, 'utf8'),
    readFile(files.theme, 'utf8'),
  ]);

  assert.match(layout, /amat19-theme/);
  assert.match(layout, /dataset\.theme\s*=\s*theme/);
  assert.match(layout, /theme\s*===\s*['"]dark['"]\s*\?\s*['"]#09090b['"]\s*:\s*['"]#fbfbfd['"]/);
  assert.match(settings, /role=["']switch["']/);
  assert.match(settings, />Dark mode</);
  assert.match(theme, /html\[data-theme=['"]dark['"]\]/);

  assert.doesNotMatch(layout, /prefers-color-scheme/i);
  assert.doesNotMatch(layout, /amat19-theme[^\n]*system/i);
  assert.doesNotMatch(settings, /(?:value|theme)\s*[:=][^\n]*['"]system['"]/i);
});

test('mobile navigation no longer contains the legacy maroon dock treatment', async () => {
  const [pass4, glass] = await Promise.all([
    readFile(files.pass4, 'utf8'),
    readFile(files.glass, 'utf8'),
  ]);

  for (const source of [pass4, glass]) {
    assert.doesNotMatch(source, /#240509/i);
    assert.doesNotMatch(source, /rgb\(230\s+106\s+25\s*\/\s*\.22\)/i);
  }

  assert.match(pass4, /background:\s*var\(--nav-surface\)/);
  assert.match(glass, /background:\s*var\(--nav-surface\)\s*!important/);
  assert.match(glass, /color:\s*var\(--nav-text-active\)\s*!important/);
});
