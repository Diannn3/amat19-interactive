import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('v1.3 Firefox compatibility layer is imported and uses integral touch-target floors', async()=>{
  const layout=await readFile(new URL('../../apps/web/src/layouts/AppLayout.astro',import.meta.url),'utf8');
  const auditCss=await readFile(new URL('../../apps/web/src/styles/audit-v13.css',import.meta.url),'utf8');
  const pass4Index=layout.indexOf("import '../styles/pass4.css';");
  const auditIndex=layout.indexOf("import '../styles/audit-v13.css';");
  assert.ok(pass4Index>=0&&auditIndex>pass4Index,'audit compatibility CSS must load after pass4.css');
  assert.match(auditCss,/\.course-policy details summary[\s\S]*min-height:\s*45px/);
  assert.match(auditCss,/\.lab-route__context-rail nav a[\s\S]*min-height:\s*45px/);
});

test('v1.3 LP compatibility layer constrains intrinsic widths without reducing the 44px input minimum', async()=>{
  const auditCss=await readFile(new URL('../../apps/web/src/styles/audit-v13.css',import.meta.url),'utf8');
  assert.match(auditCss,/\.lp-lab__controls[\s\S]*max-width:\s*100%/);
  assert.match(auditCss,/\.lab-route__canvas \.constraint-row > input[\s\S]*flex-basis:\s*0/);
  assert.doesNotMatch(auditCss,/min-height:\s*(?:4[0-3]|[0-3]?\d)px/);
});
