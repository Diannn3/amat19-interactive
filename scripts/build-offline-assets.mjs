import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Generated only after Astro finishes: the worker must cache the same hashed
// chunks that its cached HTML imports, including workbenches not yet visited.
const output = resolve(process.argv[2] ?? 'apps/web/dist');
const files = (await readdir(output, { recursive: true, withFileTypes: true }))
  .filter(entry => entry.isFile())
  .map(entry => resolve(entry.parentPath, entry.name).slice(output.length + 1).replaceAll('\\', '/'))
  .filter(name => !['sw.js', 'sw-assets.json', 'release.json'].includes(name))
  .sort();
const assets = files.filter(name => name.startsWith('_astro/') && /\.(?:js|css|woff2?)$/.test(name)).map(name => `/${name}`);
if (!assets.length) throw new Error('No built Astro assets found; run the production build first.');

const worker = await readFile(new URL('../apps/web/public/sw.js', import.meta.url), 'utf8');
const digest = createHash('sha256').update(worker);
const pagePlaceholder = '__AMAT19_PAGE_VERSION__';
const normalizePage = (text) => text.replace(/(<meta name="amat-release" content=")[^"]+("\s*\/?>)/g, `$1${pagePlaceholder}$2`);
for (const name of files) {
  const contents = await readFile(resolve(output, name));
  digest.update(name).update(name.endsWith('.html') ? normalizePage(contents.toString()) : contents);
}
const revision = digest.digest('hex').slice(0, 16);
const revisionDeclaration = "const BUILD_REVISION = '__AMAT19_BUILD_REVISION__';";
if (!worker.includes(revisionDeclaration)) throw new Error('Service worker build revision placeholder is missing.');
const versionedWorker = worker.replace(
  revisionDeclaration,
  `const BUILD_REVISION = '${revision}';`,
);
if (versionedWorker.includes('__AMAT19_BUILD_REVISION__')) throw new Error('Service worker build revision was not fully stamped.');
const release = worker.match(/const RELEASE = '([^']+)'/)?.[1];
if (!release) throw new Error('Worker release name is missing.');
const version = `${release}-${revision}`;
for (const name of files.filter(name => name.endsWith('.html'))) {
  const page = normalizePage(await readFile(resolve(output, name), 'utf8'));
  await writeFile(resolve(output, name), page.replaceAll(pagePlaceholder, version));
}
const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null;
await writeFile(resolve(output, 'release.json'), JSON.stringify({ release, revision, version, commit }));
await writeFile(resolve(output, 'sw-assets.json'), JSON.stringify({ version, assets }));
await writeFile(resolve(output, 'sw.js'), versionedWorker);
console.log(`Offline assets: ${assets.length} chunks, revision ${revision}`);
