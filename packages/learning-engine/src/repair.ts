import type { CheckResult, RepairTarget } from './contracts.ts';

export type RepairPlan = {
  skillId: string;
  reason: string;
  explanation: string;
  lessonHref?: string;
  labHref?: string;
  practicePreset?: string;
  suggestedQuestionCount: number;
};

export function repairPlanFromCheck(check: CheckResult, fallback?: RepairTarget): RepairPlan | undefined {
  if (check.ok) return undefined;
  const target = check.repairTarget ?? fallback;
  if (!target) return undefined;
  const explanation = check.kind === 'wrong-model'
    ? 'Revisit how to choose the model before doing arithmetic.'
    : check.kind === 'invalid-rule' || check.kind === 'invalid-reference'
      ? 'Rebuild the legal step before continuing the derivation.'
      : check.kind === 'arithmetic-error'
        ? 'Keep the mathematical model and repair the numerical step.'
        : 'Review the governing concept, then answer a short focused set before returning.';
  return {
    skillId: target.skillId,
    reason: target.reason,
    explanation,
    lessonHref: target.lessonHref,
    labHref: target.labHref,
    practicePreset: target.practicePreset,
    suggestedQuestionCount: 3
  };
}
