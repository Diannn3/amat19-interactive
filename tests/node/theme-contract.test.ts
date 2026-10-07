import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const files = {
  layout: new URL('../../apps/web/src/layouts/AppLayout.astro', import.meta.url),
  settings: new URL('../../apps/web/src/components/settings/SettingsPanel.tsx', import.meta.url),
  theme: new URL('../../apps/web/src/styles/theme.css', import.meta.url),
  pass4: new URL('../../apps/web/src/styles/pass4.css', import.meta.url),
  editorial: new URL('../../apps/web/src/styles/editorial-grid.css', import.meta.url),
  shell: new URL('../../apps/web/src/styles/shell-v7.css', import.meta.url),
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

test('legacy Apple glass layer is no longer part of the live design system', async () => {
  const [layout, pass4, editorial, shell] = await Promise.all([
    readFile(files.layout, 'utf8'),
    readFile(files.pass4, 'utf8'),
    readFile(files.editorial, 'utf8'),
    readFile(files.shell, 'utf8'),
  ]);

  assert.doesNotMatch(layout, /apple-glass\.css/);
  assert.doesNotMatch(layout, /apple-glass-card/);
  assert.doesNotMatch(pass4, /#240509/i);
  assert.doesNotMatch(editorial, /\.mobile-nav/);
  assert.match(shell, /\.mobile-nav/);
  assert.match(shell, /var\(--editorial-paper-pure\)/);
});
