import assert from 'node:assert/strict';
import test from 'node:test';
import { currentCourseProfile, legacyLabAliases } from '../../packages/course-content/src/index.ts';

type WorkbenchRecord = {
  id: string;
  href: string;
  absorbedLabIds: string[];
};

test('four canonical workbenches retain all five course modules', () => {
  const profile = currentCourseProfile as typeof currentCourseProfile & {
    workbenches?: WorkbenchRecord[];
  };
  const workbenches = profile.workbenches;

  assert.ok(workbenches, 'course profile should declare canonical workbenches');
  assert.deepEqual(
    workbenches.map((workbench) => workbench.id),
    ['logic', 'probability', 'finance', 'linear'],
  );
  assert.equal(new Set(workbenches.map((workbench) => workbench.href)).size, 4);
  assert.equal(currentCourseProfile.modules.length, 5);
  assert.ok(currentCourseProfile.modules.some((module) => module.id === 'applications'));

  const registeredLabIds = currentCourseProfile.labs.map((lab) => lab.id).sort();
  assert.equal(registeredLabIds.length, 18);
  assert.ok(registeredLabIds.includes('cashflow-timeline'));

  const absorbedLabIds = workbenches.flatMap((workbench) => workbench.absorbedLabIds).sort();
  assert.ok(absorbedLabIds.every((id) => registeredLabIds.includes(id)));
  assert.ok(!workbenches.some((workbench) => workbench.href === '/workbenches/applications'));
});

test('retired labs redirect to a functional workbench or relevant lesson', () => {
  const registeredLabIds = currentCourseProfile.labs.map((lab) => lab.id).sort();
  const aliasedLabIds = Object.keys(legacyLabAliases).sort();

  assert.deepEqual(aliasedLabIds, registeredLabIds);
  assert.equal(legacyLabAliases['equivalence']?.destination, '/lessons/logic/equivalence');
  assert.equal(legacyLabAliases['formal-proof']?.destination, '/lessons/logic/formal-proof');
  assert.equal(legacyLabAliases['counting']?.destination, '/lessons/probability/counting-models');
  assert.equal(legacyLabAliases['distribution']?.destination, '/workbenches/probability?view=distribution');
  assert.equal(legacyLabAliases['linear-programming']?.destination, '/lessons/applications/graphical-lp');
  assert.equal(legacyLabAliases['game-theory']?.destination, '/lessons/applications/game-theory');
  assert.equal(legacyLabAliases['markov']?.destination, '/lessons/applications/markov');

  for (const alias of Object.values(legacyLabAliases)) {
    assert.match(alias.destination, /^\/(workbenches|lessons)\//);
    assert.ok(!alias.destination.startsWith('/workbenches/applications'));
    assert.ok(!alias.destination.startsWith('/labs/'));
  }
});

test('skill routes never send learners to removed workbench modes', () => {
  for (const skill of currentCourseProfile.skills) {
    if (skill.relatedLab) {
      assert.ok(skill.relatedLab.startsWith('/workbenches/') || skill.relatedLab.startsWith('/lessons/'), `${skill.id} should link to instruction`);
      assert.ok(!skill.relatedLab.startsWith('/workbenches/applications'), `${skill.id} should not link to removed workbench`);
    }
  }
  assert.equal(currentCourseProfile.skills.find((skill) => skill.id === 'probability.distribution')?.relatedLab, '/workbenches/probability?view=distribution');
});
