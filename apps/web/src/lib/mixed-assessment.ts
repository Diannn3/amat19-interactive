import { createSeededRandom } from '@amat19/math-core';
import { buildTruthTable } from '@amat19/domain-logic';
import { combinations, permutations, makeTwoWayTable, analyzeTwoWayTable } from '@amat19/domain-probability';
import { simpleAccumulation, compoundAccumulation, roundFinance } from '@amat19/domain-finance';
import { matrix, multiplyMatrices, solveLinearSystem, solveGraphicalLP } from '@amat19/domain-linear';
import { payoffMatrix, maximin, minimax } from '@amat19/domain-games';

export type AssessmentModule = 'logic' | 'probability' | 'finance' | 'linear' | 'applications';
export type AssessmentExercise = {
  id: string;
  module: AssessmentModule;
  skillId: string;
  title: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  labHref: string;
};

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]!;
}
function shuffled<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
function choiceExercise(input: Omit<AssessmentExercise, 'choices' | 'correctIndex'> & { answer: string; distractors: string[] }, random: () => number): AssessmentExercise {
  const choices = shuffled([input.answer, ...input.distractors.filter((d) => d !== input.answer)].slice(0, 4), random);
  return { ...input, choices, correctIndex: choices.indexOf(input.answer) };
}

function logicExercise(random: () => number, index: number): AssessmentExercise {
  const expression = pick(['P -> P', 'P & ~P', '(P -> Q) | (Q -> P)', 'P <-> ~P', '(P & Q) -> P'] as const, random);
  const classification = buildTruthTable(expression).classification;
  return choiceExercise({
    id: `logic-${index}`, module: 'logic', skillId: 'logic.truth-values', title: 'Truth-table classification',
    prompt: `Without relying on a single row, classify ${expression}.`,
    answer: classification, distractors: ['tautology', 'contradiction', 'contingent'],
    explanation: `Enumerating all valuations makes the final column ${classification}. Classification is a statement about the entire final column, not one convenient assignment.`,
    labHref: '/labs/truth-table'
  }, random);
}
function countingExercise(random: () => number, index: number): AssessmentExercise {
  const n = 6 + Math.floor(random() * 5), r = 2 + Math.floor(random() * Math.min(3, n - 1));
  const order = random() > 0.5;
  const answerValue = order ? permutations(n, r) : combinations(n, r);
  const other = order ? combinations(n, r) : permutations(n, r);
  return choiceExercise({
    id: `count-${index}`, module: 'probability', skillId: 'probability.counting', title: order ? 'Ordered selections' : 'Unordered selections',
    prompt: order ? `Choose and arrange ${r} distinct objects from ${n}. How many outcomes are possible?` : `Choose a group of ${r} distinct objects from ${n}; order does not matter. How many groups are possible?`,
    answer: answerValue.toString(), distractors: [other.toString(), BigInt(n * r).toString(), BigInt(n ** r).toString()],
    explanation: order ? `Order creates distinct outcomes, so use P(${n}, ${r}) = ${answerValue}.` : `Rearranging the same selected group does not create a new outcome, so use C(${n}, ${r}) = ${answerValue}.`,
    labHref: '/labs/counting'
  }, random);
}
function conditionalExercise(random: () => number, index: number): AssessmentExercise {
  const ab = 8 + Math.floor(random() * 7), aNotB = 9 + Math.floor(random() * 9), notAB = 7 + Math.floor(random() * 9), neither = 20 + Math.floor(random() * 20);
  const analysis = analyzeTwoWayTable(makeTwoWayTable({ aAndB: ab, aAndNotB: aNotB, notAAndB: notAB, notAAndNotB: neither }));
  const answer = analysis.pAGivenB!.toString();
  return choiceExercise({
    id: `conditional-${index}`, module: 'probability', skillId: 'probability.conditional', title: 'Conditioning changes the denominator',
    prompt: `A∩B=${ab}, A∩Bᶜ=${aNotB}, Aᶜ∩B=${notAB}, Aᶜ∩Bᶜ=${neither}. Find P(A|B).`,
    answer, distractors: [analysis.pBGivenA!.toString(), analysis.pIntersection.toString(), analysis.pA.toString()],
    explanation: `Once B is given, the active universe contains |B|=${analysis.countB}. The favorable part is |A∩B|=${ab}, so P(A|B)=${answer}.`,
    labHref: '/labs/conditional-probability'
  }, random);
}
function financeExercise(random: () => number, index: number): AssessmentExercise {
  const principal = pick([500, 800, 1000, 1500] as const, random);
  const rate = pick([0.03, 0.04, 0.05, 0.06] as const, random);
  const years = pick([2, 3, 4] as const, random);
  const compound = random() > 0.5;
  const result = compound ? compoundAccumulation(principal, rate, years).value : simpleAccumulation(principal, rate, years).value;
  const answer = roundFinance(result, 2).toFixed(2);
  const wrongModel = compound ? simpleAccumulation(principal, rate, years).value : compoundAccumulation(principal, rate, years).value;
  return choiceExercise({
    id: `finance-${index}`, module: 'finance', skillId: 'finance.interest', title: compound ? 'Compound accumulation' : 'Simple accumulation',
    prompt: `₱${principal} earns ${(rate * 100).toFixed(0)}% per year for ${years} years using ${compound ? 'annual compound' : 'simple'} interest. What is the accumulated value?`,
    answer, distractors: [roundFinance(wrongModel, 2).toFixed(2), roundFinance(principal * rate * years, 2).toFixed(2), roundFinance(principal * (1 + rate), 2).toFixed(2)],
    explanation: compound ? `Compound interest uses A=P(1+i)^t, giving ₱${answer}.` : `Simple interest uses A=P(1+it), giving ₱${answer}.`,
    labHref: '/labs/interest'
  }, random);
}
function matrixExercise(random: () => number, index: number): AssessmentExercise {
  const a = 1 + Math.floor(random() * 4), b = 1 + Math.floor(random() * 4), c = 1 + Math.floor(random() * 4), d = 1 + Math.floor(random() * 4);
  const A = matrix([[a, b], [c, d]]), B = matrix([[2, 1], [1, 3]]), product = multiplyMatrices(A, B);
  const answer = product[0]![0]!.toString();
  return choiceExercise({
    id: `matrix-${index}`, module: 'linear', skillId: 'linear.operations', title: 'Row-by-column multiplication',
    prompt: `For A=[[${a},${b}],[${c},${d}]] and B=[[2,1],[1,3]], what is entry (1,1) of AB?`,
    answer, distractors: [String(a + b), String(a * 2 + b * 3), String(a * b + 2)],
    explanation: `Entry (1,1) is row 1 of A dotted with column 1 of B: ${a}(2)+${b}(1)=${answer}.`,
    labHref: '/labs/matrix-operations'
  }, random);
}
function systemExercise(random: () => number, index: number): AssessmentExercise {
  const variant = Math.floor(random() * 3);
  const systems = [
    { rows: [[1, 1, 5], [2, -1, 1]], kind: 'unique' },
    { rows: [[1, 1, 3], [2, 2, 6]], kind: 'infinite' },
    { rows: [[1, 1, 3], [2, 2, 7]], kind: 'inconsistent' }
  ] as const;
  const selected = systems[variant]!;
  const actual = solveLinearSystem(matrix(selected.rows as unknown as number[][])).kind;
  return choiceExercise({
    id: `system-${index}`, module: 'linear', skillId: 'linear.systems', title: 'Classify a linear system',
    prompt: `Classify the system represented by augmented matrix [[${selected.rows[0].join(',')}],[${selected.rows[1].join(',')}]].`,
    answer: actual, distractors: ['unique', 'infinite', 'inconsistent'],
    explanation: `Exact Gauss–Jordan reduction classifies this system as ${actual}. A contradictory row means inconsistent; a missing pivot with no contradiction means infinitely many solutions.`,
    labHref: '/labs/row-reduction'
  }, random);
}
function lpExercise(random: () => number, index: number): AssessmentExercise {
  const cx = pick([2, 3, 4] as const, random), cy = pick([1, 2, 3] as const, random);
  const result = solveGraphicalLP([
    { a: 1, b: 1, relation: '<=', c: 4 },
    { a: 1, b: 0, relation: '<=', c: 3 },
    { a: 0, b: 1, relation: '<=', c: 3 }
  ], { x: cx, y: cy, sense: 'max' });
  const best = result.optima[0]!;
  const answer = `(${best.point.x}, ${best.point.y}), Z=${best.value}`;
  return choiceExercise({
    id: `lp-${index}`, module: 'applications', skillId: 'applications.lp', title: 'Corner-point optimization',
    prompt: `Maximize Z=${cx}x+${cy}y subject to x+y≤4, x≤3, y≤3, x,y≥0. Which listed corner is optimal?`,
    answer, distractors: [`(0, 0), Z=0`, `(3, 0), Z=${3 * cx}`, `(0, 3), Z=${3 * cy}`],
    explanation: `A bounded two-variable linear program reaches an optimum at a feasible corner. Evaluating all feasible vertices gives ${answer}.`,
    labHref: '/labs/linear-programming'
  }, random);
}
function gameExercise(random: () => number, index: number): AssessmentExercise {
  const useSaddle = random() > 0.5;
  const values = useSaddle ? [[3, 1], [4, 2]] : [[1, -1], [-1, 1]];
  const game = payoffMatrix(values);
  const lo = maximin(game), hi = minimax(game);
  const answer = lo.equals(hi) ? 'pure saddle point exists' : 'no pure saddle; mixed analysis is needed';
  return choiceExercise({
    id: `game-${index}`, module: 'applications', skillId: 'applications.game-theory', title: 'Security levels in a zero-sum game',
    prompt: `For the row-player payoff matrix [[${values[0]!.join(',')}],[${values[1]!.join(',')}]], compare maximin and minimax.`,
    answer, distractors: ['pure saddle point exists', 'no pure saddle; mixed analysis is needed', 'the game is infeasible', 'the matrix must be inverted first'],
    explanation: `The row player guarantees ${lo.toString()} and the column player holds the payoff to ${hi.toString()}. ${lo.equals(hi) ? 'Because they match, that value is a saddle-point game.' : 'Because they differ, there is no pure saddle point.'}`,
    labHref: '/labs/game-theory'
  }, random);
}

export function generateMixedAssessment(seed: string, count = 10): AssessmentExercise[] {
  const random = createSeededRandom(seed);
  const factories = [logicExercise, countingExercise, conditionalExercise, financeExercise, matrixExercise, systemExercise, lpExercise, gameExercise];
  const exercises: AssessmentExercise[] = [];
  for (let index = 0; index < count; index += 1) {
    const factory = factories[index % factories.length]!;
    exercises.push(factory(random, index));
  }
  return exercises;
}
