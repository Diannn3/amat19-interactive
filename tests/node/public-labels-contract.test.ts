import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  learnerActivityLabel,
  learnerAttemptStateLabel,
  learnerModuleLabel,
  learnerSavedItemLabel,
  learnerScopeLabel,
  learnerSkillLabel,
} from '../../apps/web/src/lib/learner-labels.ts';

test('internal course taxonomy maps to learner-facing labels', () => {
  assert.equal(learnerModuleLabel('logic'), 'Logic');
  assert.equal(learnerModuleLabel('finance'), 'Financial Mathematics');
  assert.equal(learnerModuleLabel('unknown'), 'Course');
  assert.equal(learnerScopeLabel('live'), 'Core');
  assert.equal(learnerScopeLabel('implemented'), 'Core');
  assert.equal(learnerScopeLabel('supplemental'), 'Supplemental');
  assert.equal(learnerScopeLabel('planned'), 'Coming soon');
  assert.equal(learnerSkillLabel('logic.truth-values'), 'Truth values & truth tables');
  assert.equal(learnerSkillLabel('missing.skill'), undefined);
  assert.equal(
    learnerActivityLabel({ exerciseId: 'logic.truth-table.build', skillIds: ['logic.truth-values'] }),
    'Truth values & truth tables',
  );
  assert.equal(learnerActivityLabel({ exerciseId: 'unknown.exercise', skillIds: [] }), 'Study activity');
  assert.equal(learnerAttemptStateLabel('incomplete'), 'Needs another pass');
  assert.equal(learnerAttemptStateLabel('correct'), 'Correct');
  assert.equal(learnerSavedItemLabel('lesson'), 'Lesson');
  assert.equal(learnerSavedItemLabel('custom-problem'), 'Custom problem');
  assert.equal(learnerSavedItemLabel('unknown'), 'Saved item');
});

test('public surfaces do not interpolate implementation identifiers into visible copy', async () => {
  const files = [
    '../../apps/web/src/components/course/ModuleJourney.astro',
    '../../apps/web/src/components/navigation/CommandPalette.tsx',
    '../../apps/web/src/components/progress/ProgressDashboard.tsx',
    '../../apps/web/src/components/study/StudyDashboard.tsx',
    '../../apps/web/src/components/saved/SavedLibrary.tsx',
    '../../apps/web/src/pages/course.astro',
    '../../apps/web/src/pages/lessons/[...id].astro',
  ];
  const sources = await Promise.all(files.map((file) => readFile(new URL(file, import.meta.url), 'utf8')));
  const source = sources.join('\n');

  assert.doesNotMatch(source, /\{lab\.skillIds\.join/);
  assert.doesNotMatch(source, /\{lab\.status\}/);
  assert.doesNotMatch(source, /subtitle:\s*`\$\{lab\.module\}/);
  assert.doesNotMatch(source, /\{skill\.status\}/);
  assert.doesNotMatch(source, /Original study note|>\{entry\.data\.status\}<\/p>/);
  assert.doesNotMatch(source, />\{entry\.data\.module\}</);
  assert.doesNotMatch(source, /\{attempt\.exerciseId\}|\{attempt\.module\}/);
  assert.doesNotMatch(source, /\{session\.exerciseId\}/);
  assert.doesNotMatch(source, /\{item\.kind\}|\{item\.module\}/);
  assert.doesNotMatch(source, /Start with any live module|Choose a live workspace/);
});
