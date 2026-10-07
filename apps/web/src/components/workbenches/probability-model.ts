import { analyzeDiscreteDistribution } from '@amat19/domain-probability';

export const PROBABILITY_VIEWS = ['conditional', 'distribution', 'random-variable', 'inference'] as const;
export type ProbabilityView = typeof PROBABILITY_VIEWS[number];

function isProbabilityView(value: string | null | undefined): value is ProbabilityView {
  return PROBABILITY_VIEWS.some((view) => view === value);
}

export function resolveProbabilityView(search: string, persisted?: string): ProbabilityView {
  const params = new URLSearchParams(search);
  const requested = params.get('view');
  if (isProbabilityView(requested)) return requested;
  if (params.get('mode') === 'conditioning' || params.get('mode') === 'bayes') return 'conditional';
  if (isProbabilityView(persisted)) return persisted;
  return 'conditional';
}

export function coinMappingDistribution(values: readonly string[]) {
  if (values.length !== 4) throw new RangeError('Map all four two-coin outcomes.');
  if (values.some((value) => !value.trim())) throw new RangeError('Enter an exact X value for every outcome.');
  return analyzeDiscreteDistribution(values.map((value) => ({ value, probability: '1/4' })));
}
