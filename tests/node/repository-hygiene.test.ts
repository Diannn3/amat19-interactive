import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);

test('Vercel project metadata is ignored and not tracked', async () => {
  const gitignore = await readFile(new URL('../../.gitignore', import.meta.url), 'utf8');
  const [{ stdout: tracked }, { stdout: deleted }] = await Promise.all([
    execFileAsync('git', ['ls-files', '--', '.vercel']),
    execFileAsync('git', ['ls-files', '--deleted', '--', '.vercel']),
  ]);

  assert.match(gitignore, /^\.vercel\/$/m);
  assert.equal(tracked.trim(), deleted.trim());
});

test('retired dashboard and hero selectors are absent from the live stylesheet', async () => {
  const stylesheet = await readFile(new URL('../../apps/web/src/styles/pass4.css', import.meta.url), 'utf8');
  const retiredSelectors = [
    'hero-stage', 'hero-title', 'hero-subtitle', 'gradient-text',
    'home-bento', 'bento', 'bento-attention', 'bento-briefing', 'bento-context',
    'bento-footer', 'metric-card', 'home-route-card', 'home-loop', 'principle-strip',
    'module-loop', 'section-heading__note', 'site-header', 'site-header__inner', 'site-nav',
    'site-nav__command', 'mobile-nav__trigger', 'mobile-nav__icon', 'mobile-nav__dialog',
    'mobile-nav__sheet', 'mobile-nav__head', 'mobile-nav__context', 'mobile-nav__close',
    'mobile-nav__panel', 'mobile-nav__footer', 'mobile-nav__command', 'topbar-icon',
  ];

  for (const selector of retiredSelectors) {
    assert.doesNotMatch(stylesheet, new RegExp(`\\.${selector}(?![A-Za-z0-9_-])`), selector);
  }
});
