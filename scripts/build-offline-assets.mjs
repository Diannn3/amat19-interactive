import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Generated only after Astro finishes: the worker must cache the same hashed
// chunks that its cached HTML imports, including workbenches not yet visited.
const output = resolve(process.argv[2] ?? 'apps/web/dist');
const files = (await readdir(output, { recursive: true, withFileTypes: true }))
  .filter(entry => entry.isFile())
  .map(entry => resolve(entry.parentPath, entry.name).slice(output.length + 1).replaceAll('\\', '/'))
  .filter(name => !['sw.js', 'sw-assets.json'].includes(name))
  .sort();
const assets = files.filter(name => name.startsWith('_astro/') && /\.(?:js|css|woff2?)$/.test(name)).map(name => `/${name}`);
if (!assets.length) throw new Error('No built Astro assets found; run the production build first.');

const worker = await readFile(new URL('../apps/web/public/sw.js', import.meta.url), 'utf8');
const digest = createHash('sha256').update(worker);
for (const name of files) digest.update(name).update(await readFile(resolve(output, name)));
const revision = digest.digest('hex').slice(0, 16);
const versionedWorker = worker.replace(/const VERSION = '([^']+)';/, (_, version) => `const VERSION = '${version}-${revision}';`);
await writeFile(resolve(output, 'sw-assets.json'), JSON.stringify({ assets }));
await writeFile(resolve(output, 'sw.js'), versionedWorker);
console.log(`Offline assets: ${assets.length} chunks, revision ${revision}`);
