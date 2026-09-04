import assert from 'node:assert/strict';
import test from 'node:test';
import { currentCourseProfile, legacyLabAliases } from '../../packages/course-content/src/index.ts';

type WorkbenchRecord = {
  id: string;
  href: string;
  absorbedLabIds: string[];
};

test('five canonical workbenches cover every registered lab exactly once', () => {
  const profile = currentCourseProfile as typeof currentCourseProfile & {
    workbenches?: WorkbenchRecord[];
  };
  const workbenches = profile.workbenches;

  assert.ok(workbenches, 'course profile should declare canonical workbenches');
  assert.deepEqual(
    workbenches.map((workbench) => workbench.id),
    ['logic', 'probability', 'finance', 'linear', 'applications'],
  );
  assert.equal(new Set(workbenches.map((workbench) => workbench.href)).size, 5);

  const registeredLabIds = currentCourseProfile.labs.map((lab) => lab.id).sort();
  assert.equal(registeredLabIds.length, 18);
  assert.ok(registeredLabIds.includes('cashflow-timeline'));

  const absorbedLabIds = workbenches.flatMap((workbench) => workbench.absorbedLabIds).sort();
  assert.deepEqual(absorbedLabIds, registeredLabIds);
});

test('every retired lab has one canonical workbench alias', () => {
  const registeredLabIds = currentCourseProfile.labs.map((lab) => lab.id).sort();
  const aliasedLabIds = Object.keys(legacyLabAliases).sort();

  assert.deepEqual(aliasedLabIds, registeredLabIds);
  assert.deepEqual(new Set(Object.values(legacyLabAliases).map((alias) => alias.workbenchId)), new Set([
    'logic',
    'probability',
    'finance',
    'linear',
    'applications',
  ]));

  for (const alias of Object.values(legacyLabAliases)) {
    assert.match(alias.destination, /^\/workbenches\/(logic|probability|finance|linear|applications)\?(mode|scenario|goal)=/);
    assert.ok(!alias.destination.startsWith('/labs/'));
  }
});

test('learner-facing skill routes point directly to focused workbenches', () => {
  for (const skill of currentCourseProfile.skills) {
    if (skill.relatedLab) {
      assert.ok(skill.relatedLab.startsWith('/workbenches/'), `${skill.id} should link to a workbench`);
    }
  }
  assert.equal(currentCourseProfile.skills.find((skill) => skill.id === 'probability.distribution')?.relatedLab, undefined);
});
