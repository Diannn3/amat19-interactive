import assert from 'node:assert/strict';
import test from 'node:test';
import { currentCourseProfile } from '../../packages/course-content/src/index.ts';

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
