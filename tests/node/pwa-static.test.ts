import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('service worker precaches canonical workbenches and local-first workspace routes',async()=>{
 const source=await readFile(new URL('../../apps/web/public/sw.js',import.meta.url),'utf8');
 for(const route of ['/study','/saved','/settings','/workbenches/logic','/workbenches/probability','/workbenches/finance','/workbenches/linear','/workbenches/applications'])assert.match(source,new RegExp(`['\"]${route.replace('/','\\/')}['\"]`));
});

test('navigation fallback ignores query strings and uses a bounded network wait',async()=>{
 const source=await readFile(new URL('../../apps/web/public/sw.js',import.meta.url),'utf8');
 assert.match(source,/ignoreSearch:\s*true/);
 assert.match(source,/AbortController/);
 assert.match(source,/NAVIGATION_TIMEOUT_MS\s*=\s*4000/);
});


test('service worker cache namespace is bumped for the focused workbench release',async()=>{
 const source=await readFile(new URL('../../apps/web/public/sw.js',import.meta.url),'utf8');
 assert.match(source,/VERSION\s*=\s*['"]amat19-workbenches-v1['"]/);
 assert.doesNotMatch(source,/amat19-v13-audited-backend/);
});
