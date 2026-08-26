import assert from 'node:assert/strict';
import test from 'node:test';
import { MemoryPersistence } from '../src/memory.ts';
import { CURRENT_SCHEMA_VERSION } from '../src/types.ts';
import { validateSnapshot } from '../src/validation.ts';

test('memory persistence supports snapshot roundtrip', async () => {
  const db = new MemoryPersistence();
  await db.saveLabDraft({ labId: 'logic.truth-table', contentVersion: '2', updatedAt: '2026', state: { expression: 'P' } });
  await db.saveAttempt({ attemptId: 'a', exerciseId: 'e', module: 'logic', startedAt: '2026', updatedAt: '2026', finalState: 'correct', payload: {} });
  await db.saveMastery({ skillId: 'logic.truth-values', evidenceScore: .8, attempts: 3, lastPracticed: '2026' });
  await db.setSetting('motion', 'reduced', '2026');
  const snap = await db.exportSnapshot('2026');
  assert.equal(snap.schemaVersion, CURRENT_SCHEMA_VERSION);
  const next = new MemoryPersistence();
  await next.importSnapshot(snap);
  assert.equal((await next.getLabDraft<{ expression: string }>('logic.truth-table'))?.state.expression, 'P');
  assert.equal(await next.getSetting('motion'), 'reduced');
  await next.clearAll();
  assert.equal((await next.listAttempts()).length, 0);
});

test('snapshot validator rejects incompatible schema', () => {
  assert.throws(() => validateSnapshot({ exportedAt: 'now', schemaVersion: 99, drafts: [], attempts: [], mastery: [], settings: [] }), /not supported/);
});
