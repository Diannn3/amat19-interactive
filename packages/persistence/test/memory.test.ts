import assert from 'node:assert/strict';
import test from 'node:test';
import { MemoryPersistence } from '../src/memory.ts';

test('memory adapter honors the persistence port for lab drafts', async () => {
  const db = new MemoryPersistence();
  await db.saveLabDraft({
    labId: 'logic.truth-table',
    contentVersion: '1',
    updatedAt: '2026-08-26T00:00:00Z',
    state: { expression: 'P -> Q' }
  });
  assert.deepEqual((await db.getLabDraft<{ expression: string }>('logic.truth-table'))?.state, {
    expression: 'P -> Q'
  });
  await db.deleteLabDraft('logic.truth-table');
  assert.equal(await db.getLabDraft('logic.truth-table'), undefined);
});

test('memory adapter stores attempts, mastery, settings, and content metadata', async () => {
  const db = new MemoryPersistence();
  await db.saveAttempt({
    attemptId: 'attempt-1',
    exerciseId: 'logic.truth-table',
    module: 'logic',
    startedAt: '2026-08-26T00:00:00Z',
    updatedAt: '2026-08-26T00:02:00Z',
    finalState: 'correct',
    payload: { checks: 4 }
  });
  assert.equal((await db.listAttempts('logic.truth-table')).length, 1);

  await db.saveMastery({
    skillId: 'logic.truth-values',
    evidenceScore: 0.8,
    attempts: 2,
    lastPracticed: '2026-08-26T00:02:00Z'
  });
  assert.equal((await db.getMastery('logic.truth-values'))?.attempts, 2);

  await db.setSetting('notation', 'unicode', '2026-08-26T00:02:00Z');
  assert.equal(await db.getSetting('notation'), 'unicode');

  await db.setContentMeta({
    id: 'current',
    courseVersion: 'amat19-2026-pass1',
    schemaVersion: 1,
    updatedAt: '2026-08-26T00:02:00Z'
  });
  assert.equal((await db.getContentMeta())?.schemaVersion, 1);
});
