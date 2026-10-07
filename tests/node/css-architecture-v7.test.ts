import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8');

test('Blueprint v7 gives module routes and mobile navigation exactly one CSS owner', async () => {
  const [layout, pass4, editorial, shell, modules] = await Promise.all([
    read('../../apps/web/src/layouts/AppLayout.astro'),
    read('../../apps/web/src/styles/pass4.css'),
    read('../../apps/web/src/styles/editorial-grid.css'),
    read('../../apps/web/src/styles/shell-v7.css'),
    read('../../apps/web/src/styles/module-v7.css'),
  ]);

  assert.match(layout, /shell-v7\.css/);
  assert.match(layout, /module-v7\.css/);
  assert.doesNotMatch(layout, /apple-glass\.css/);

  for (const legacy of [pass4, editorial]) {
    assert.doesNotMatch(legacy, /\.module-overview|\.module-journey__metrics|\.module-tabs|\.module-next-step|\.module-view-links|\.module-supplemental/);
    assert.doesNotMatch(legacy, /\.mobile-nav|\.mobile-more-menu/);
    assert.doesNotMatch(legacy, /\.apple-glass-card|\.strategy-workbench|\.app-graph-|\.app-layout-grid|\.app-side-card/);
  }

  assert.match(modules, /\[data-route\^="\/modules\/"\] \.module-overview/);
  assert.match(modules, /\[data-route\^="\/modules\/"\] \.module-tabs/);
  assert.match(shell, /\.mobile-nav/);
  assert.match(shell, /@media \(max-width: 900px\)/);
});

test('v7 route-owner styles stay intentionally small', async () => {
  const [shell, modules] = await Promise.all([
    read('../../apps/web/src/styles/shell-v7.css'),
    read('../../apps/web/src/styles/module-v7.css'),
  ]);

  assert.ok(shell.length < 10_000, `shell-v7.css grew to ${shell.length} bytes`);
  assert.ok(modules.length < 18_000, `module-v7.css grew to ${modules.length} bytes`);
  assert.ok((shell.match(/!important/g) ?? []).length < 40);
  assert.ok((modules.match(/!important/g) ?? []).length === 0);
});
