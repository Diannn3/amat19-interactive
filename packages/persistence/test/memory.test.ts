import assert from 'node:assert/strict';
import test from 'node:test';
import { MemoryPersistence } from '../src/memory.ts';
import { CURRENT_SCHEMA_VERSION } from '../src/types.ts';
import { validateSnapshot } from '../src/validation.ts';

test('memory persistence supports v3 snapshot roundtrip', async () => {
  const db = new MemoryPersistence();
  await db.saveLabDraft({ labId: 'logic.truth-table', contentVersion: '2', updatedAt: '2026', state: { expression: 'P' } });
  await db.saveAttempt({ attemptId: 'a', exerciseId: 'e', module: 'logic', startedAt: '2026', updatedAt: '2026', finalState: 'correct', payload: {}, skillIds:['logic.truth-table.evaluate'] });
  await db.saveMastery({ skillId: 'logic.truth-values', evidenceScore: .8, attempts: 3, independentSuccesses:2, lastPracticed: '2026' });
  await db.saveSession({sessionId:'s',exerciseId:'e',module:'logic',skillIds:['logic.truth-values'],startedAt:'2026',updatedAt:'2026',outcome:'active',payload:{row:2}});
  await db.saveItem({id:'saved-1',kind:'lesson',title:'Truth tables',href:'/lessons/logic/truth-tables',createdAt:'2026',updatedAt:'2026',payload:{}});
  await db.setSetting('motion', 'reduced', '2026');
  const snap = await db.exportSnapshot('2026');
  assert.equal(snap.schemaVersion, CURRENT_SCHEMA_VERSION);
  const next = new MemoryPersistence();
  await next.importSnapshot(snap);
  assert.equal((await next.getLabDraft<{ expression: string }>('logic.truth-table'))?.state.expression, 'P');
  assert.equal((await next.listSessions()).length,1);
  assert.equal((await next.listSavedItems()).length,1);
  assert.equal(await next.getSetting('motion'), 'reduced');
  await next.clearAll();
  assert.equal((await next.listAttempts()).length, 0);
});

test('snapshot validator migrates compatible v2 exports',()=>{
 const migrated=validateSnapshot({exportedAt:'2026',schemaVersion:2,drafts:[],attempts:[],mastery:[],settings:[]});
 assert.equal(migrated.schemaVersion,3);assert.deepEqual(migrated.sessions,[]);assert.deepEqual(migrated.savedItems,[]);
});

test('snapshot validator rejects incompatible schema', () => {
  assert.throws(() => validateSnapshot({ exportedAt: 'now', schemaVersion: 99, drafts: [], attempts: [], mastery: [], settings: [],sessions:[],savedItems:[] }), /not supported/);
});
