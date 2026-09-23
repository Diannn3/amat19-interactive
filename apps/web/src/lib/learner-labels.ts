import { currentCourseProfile, getSkillNode } from '@amat19/course-content';

const moduleLabels = new Map<string, string>(currentCourseProfile.modules.map((module) => [module.id, module.title]));
const courseSkills = new Map(currentCourseProfile.skills.map((skill) => [skill.id, skill.title]));

const activityLabels: Array<[string, string]> = [
  ['logic.truth-table', 'Truth-table builder'],
  ['logic.equivalence', 'Logical equivalence'],
  ['probability.counting', 'Counting method'],
  ['probability.conditional', 'Conditional probability'],
  ['probability.independence', 'Independence check'],
  ['finance.annuity', 'Annuity timing'],
  ['finance.bonds', 'Bond pricing'],
  ['finance.interest', 'Interest model'],
  ['linear.matrix', 'Matrix operations'],
  ['linear.system', 'Linear-system classification'],
  ['applications.lp', 'Linear-programming model'],
  ['applications.game', 'Game-theory solution'],
];

const activityLabelByPrefix = new Map(activityLabels);

const savedItemLabels = new Map<string, string>([
  ['lesson', 'Lesson'],
  ['exercise', 'Exercise'],
  ['custom-problem', 'Custom problem'],
  ['bookmark', 'Saved item'],
]);

export function learnerModuleLabel(moduleId?: string): string {
  return (moduleId && moduleLabels.get(moduleId)) ?? 'Course';
}

export function learnerScopeLabel(status?: string): string {
  if (status === 'supplemental') return 'Supplemental';
  if (status === 'planned') return 'Coming soon';
  if (status === 'experimental') return 'Experimental';
  return 'Core';
}

export function learnerSkillLabel(skillId?: string): string | undefined {
  if (!skillId) return undefined;
  return getSkillNode(skillId)?.title ?? courseSkills.get(skillId);
}

export function learnerActivityLabel(input: { exerciseId?: string; skillIds?: string[] }): string {
  const skillTitle = input.skillIds?.map(learnerSkillLabel).find((title): title is string => Boolean(title));
  if (skillTitle) return skillTitle;

  const exerciseId = input.exerciseId ?? '';
  const matchingPrefix = [...activityLabelByPrefix.keys()]
    .sort((left, right) => right.length - left.length)
    .find((prefix) => exerciseId.startsWith(prefix));
  return (matchingPrefix && activityLabelByPrefix.get(matchingPrefix)) ?? 'Study activity';
}

export function learnerAttemptStateLabel(state?: string): string {
  if (state === 'correct') return 'Correct';
  if (state === 'incomplete') return 'Needs another pass';
  if (state === 'abandoned') return 'Set aside';
  if (state === 'revealed') return 'Reviewed with answer';
  return 'Recorded';
}

export function learnerSavedItemLabel(kind?: string): string {
  return (kind && savedItemLabels.get(kind)) ?? 'Saved item';
}
