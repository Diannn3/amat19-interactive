import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve, extname, sep } from 'node:path';
const root = join(tmpdir(), `amat19-release-${createHash('sha256').update(process.cwd()).digest('hex').slice(0, 8)}`);
let phase = 'a';
let failManifest = false;
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
  if (req.method === 'POST' && /^\/__release\/[ab]$/.test(pathname)) { phase = pathname.at(-1); res.writeHead(200); res.end(phase); return; }
  if (req.method === 'POST' && /^\/__manifest\/(fail|ok)$/.test(pathname)) { failManifest = pathname.endsWith('/fail'); res.writeHead(200); res.end(); return; }
  if (failManifest && pathname === '/sw-assets.json') { res.writeHead(503); res.end(); return; }
  const base = resolve(root, phase);
  let file = resolve(base, '.' + pathname);
  if (file !== base && !file.startsWith(base + sep)) { res.writeHead(403); res.end(); return; }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(4367, '127.0.0.1', () => console.log('Release fixtures ready on 4367'));
