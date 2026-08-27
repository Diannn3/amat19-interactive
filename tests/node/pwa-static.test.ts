import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('service worker precaches every lab and local-first workspace route',async()=>{
 const source=await readFile(new URL('../../apps/web/public/sw.js',import.meta.url),'utf8');
 for(const route of ['/study','/saved','/settings','/labs/bayes','/labs/distribution','/labs/cashflow-timeline','/labs/markov','/labs/logic-basics'])assert.match(source,new RegExp(`['\"]${route.replace('/','\\/')}['\"]`));
});

test('navigation fallback ignores query strings and uses a bounded network wait',async()=>{
 const source=await readFile(new URL('../../apps/web/public/sw.js',import.meta.url),'utf8');
 assert.match(source,/ignoreSearch:\s*true/);
 assert.match(source,/AbortController/);
 assert.match(source,/NAVIGATION_TIMEOUT_MS\s*=\s*4000/);
});
