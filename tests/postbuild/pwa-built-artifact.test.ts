import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
test('page, worker and manifests share the stamped build revision', async () => {
  const base = new URL('../../apps/web/dist/', import.meta.url);
  const [worker, page, releaseText, assetText] = await Promise.all(['sw.js', 'progress/index.html', 'release.json', 'sw-assets.json'].map(name => readFile(new URL(name, base), 'utf8')));
  const release = JSON.parse(releaseText); const assets = JSON.parse(assetText);
  assert.match(release.revision, /^[a-f0-9]{16}$/);
  assert.ok(worker.includes(`const BUILD_REVISION = '${release.revision}'`));
  assert.ok(page.includes(`name="amat-release" content="${release.version}"`));
  assert.equal(assets.version, release.version);
  assert.doesNotMatch(worker, /__AMAT19_/); assert.doesNotMatch(page, /__AMAT19_PAGE_VERSION__/);
  assert.doesNotMatch(worker, /client\.navigate|FORCE_ACTIVATE/);
});
