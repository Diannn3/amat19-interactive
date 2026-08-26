import { useMemo, useState } from 'react';
import { ArrowUpRight, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

export type ReferenceModule = 'Logic' | 'Probability' | 'Financial Mathematics' | 'Matrices' | 'Linear Programming' | 'Game Theory';

export type ReferenceEntry = {
  id: string;
  module: ReferenceModule;
  title: string;
  formula: string;
  explanation: string;
  assumptions: string;
  labHref: string;
  labLabel: string;
};

const referenceEntries: ReferenceEntry[] = [
  { id: 'logic-negation', module: 'Logic', title: 'Negation', formula: '∼P', explanation: 'Flips the truth value of P.', assumptions: 'P must be a proposition with a truth value.', labHref: '/labs/truth-table', labLabel: 'Open Truth Table Lab' },
  { id: 'logic-conjunction', module: 'Logic', title: 'Conjunction', formula: 'P ∧ Q', explanation: 'True only when both propositions are true.', assumptions: 'Both P and Q are evaluated in the same row.', labHref: '/labs/truth-table', labLabel: 'Open Truth Table Lab' },
  { id: 'logic-disjunction', module: 'Logic', title: 'Inclusive disjunction', formula: 'P ∨ Q', explanation: 'False only when both propositions are false.', assumptions: '“Or” is inclusive unless the problem says otherwise.', labHref: '/labs/truth-table', labLabel: 'Open Truth Table Lab' },
  { id: 'logic-implication', module: 'Logic', title: 'Implication', formula: 'P → Q', explanation: 'False only when P is true and Q is false.', assumptions: 'The antecedent is P; the consequent is Q.', labHref: '/labs/truth-table', labLabel: 'Open Truth Table Lab' },
  { id: 'logic-biconditional', module: 'Logic', title: 'Biconditional', formula: 'P ↔ Q', explanation: 'True when P and Q agree.', assumptions: 'Both directions must have the same truth value.', labHref: '/labs/truth-table', labLabel: 'Open Truth Table Lab' },
  { id: 'probability-permutation', module: 'Probability', title: 'Ordered selection', formula: 'P(n,r) = n! / (n − r)!', explanation: 'Counts selections without repetition when order creates distinct outcomes.', assumptions: 'Choose r distinct objects from n, with r ≤ n.', labHref: '/labs/counting', labLabel: 'Open Counting Lab' },
  { id: 'probability-combination', module: 'Probability', title: 'Unordered selection', formula: 'C(n,r) = n! / [r!(n − r)!]', explanation: 'Counts groups without repetition when rearranging a group does not create a new outcome.', assumptions: 'Choose r distinct objects from n, with r ≤ n.', labHref: '/labs/counting', labLabel: 'Open Counting Lab' },
  { id: 'probability-inclusion-exclusion', module: 'Probability', title: 'Two-set inclusion–exclusion', formula: '|A ∪ B| = |A| + |B| − |A ∩ B|', explanation: 'Adds the two set counts and removes the overlap counted twice.', assumptions: 'A and B are measured in the same finite sample space.', labHref: '/labs/conditional-probability', labLabel: 'Open Probability Lab' },
  { id: 'probability-conditional', module: 'Probability', title: 'Conditional probability', formula: 'P(A|B) = P(A∩B) / P(B)', explanation: 'When B is given, the active denominator becomes B.', assumptions: 'P(B) must be greater than zero.', labHref: '/labs/conditional-probability', labLabel: 'Open Probability Lab' },
  { id: 'probability-independence', module: 'Probability', title: 'Independence test', formula: 'P(A∩B) = P(A)P(B)', explanation: 'Checks whether the occurrence of one event leaves the other probability unchanged.', assumptions: 'Use the equality as a test; do not assume independence from disjointness.', labHref: '/labs/conditional-probability', labLabel: 'Open Probability Lab' },
  { id: 'finance-simple', module: 'Financial Mathematics', title: 'Simple interest', formula: 'A = P(1 + it)', explanation: 'Grows principal linearly using one rate on the original principal.', assumptions: 'i is the effective rate per period and t is measured in those periods.', labHref: '/labs/interest', labLabel: 'Open Interest & TVM Lab' },
  { id: 'finance-compound', module: 'Financial Mathematics', title: 'Compound accumulation', formula: 'A = P(1 + i)ᵗ', explanation: 'Accumulates each period’s balance at an effective rate i.', assumptions: 'i and t use the same period; t may be fractional only when the model permits it.', labHref: '/labs/interest', labLabel: 'Open Interest & TVM Lab' },
  { id: 'finance-nominal', module: 'Financial Mathematics', title: 'Nominal conversion', formula: 'A = P(1 + j/m)ᵐᵗ', explanation: 'Uses nominal annual rate j convertible m times per year.', assumptions: 'j/m is the rate per conversion period and mt is the number of conversions.', labHref: '/labs/interest', labLabel: 'Open Interest & TVM Lab' },
  { id: 'finance-effective', module: 'Financial Mathematics', title: 'Annual effective rate', formula: 'i = (1 + j/m)ᵐ − 1', explanation: 'Converts a nominal rate into the equivalent annual effective rate.', assumptions: 'The same conversion frequency m applies through the full year.', labHref: '/labs/interest', labLabel: 'Open Interest & TVM Lab' },
  { id: 'finance-discount', module: 'Financial Mathematics', title: 'Discount factor', formula: 'vⁿ = (1 + i)⁻ⁿ', explanation: 'Moves a value n periods backward to a focal date.', assumptions: 'The focal date and the rate period must be stated consistently.', labHref: '/labs/cashflow-timeline', labLabel: 'Open Cash-flow Timeline Lab' },
  { id: 'matrices-addition', module: 'Matrices', title: 'Matrix addition', formula: 'A + B', explanation: 'Adds corresponding entries of two matrices.', assumptions: 'A and B must have equal dimensions.', labHref: '/labs/matrix-operations', labLabel: 'Open Matrix Operations Lab' },
  { id: 'matrices-product', module: 'Matrices', title: 'Matrix product', formula: 'AB', explanation: 'Combines rows of A with columns of B through dot products.', assumptions: 'The number of columns in A must equal the number of rows in B.', labHref: '/labs/matrix-operations', labLabel: 'Open Matrix Operations Lab' },
  { id: 'matrices-entry', module: 'Matrices', title: 'Product entry', formula: '(AB)ᵢⱼ', explanation: 'Entry (i,j) is row i of A dotted with column j of B.', assumptions: 'Keep the row and column positions fixed while multiplying.', labHref: '/labs/matrix-operations', labLabel: 'Open Matrix Operations Lab' },
  { id: 'matrices-inverse', module: 'Matrices', title: 'Gauss–Jordan inverse', formula: '[A | I] → [I | A⁻¹]', explanation: 'Reduces the left block to the identity while transforming the right block.', assumptions: 'A must be square and invertible.', labHref: '/labs/row-reduction', labLabel: 'Open Gauss–Jordan Lab' },
  { id: 'matrices-system', module: 'Matrices', title: 'Augmented system', formula: 'RREF([A | b])', explanation: 'Reveals whether a system has a unique, infinite, or no solution.', assumptions: 'A contradictory row signals inconsistency.', labHref: '/labs/row-reduction', labLabel: 'Open Gauss–Jordan Lab' },
  { id: 'lp-constraint', module: 'Linear Programming', title: 'Half-plane constraint', formula: 'ax + by ≤ c', explanation: 'Describes one feasible side of a boundary line.', assumptions: 'The inequality direction and non-negativity conditions define the feasible region.', labHref: '/labs/linear-programming', labLabel: 'Open Linear Programming Lab' },
  { id: 'lp-objective', module: 'Linear Programming', title: 'Linear objective', formula: 'Z = c₁x + c₂y', explanation: 'Assigns a value to each feasible point for maximization or minimization.', assumptions: 'The objective coefficients and optimization sense are explicit.', labHref: '/labs/linear-programming', labLabel: 'Open Linear Programming Lab' },
  { id: 'lp-corner', module: 'Linear Programming', title: 'Corner-point principle', formula: 'Evaluate feasible vertices', explanation: 'A bounded two-variable LP reaches an optimum at a feasible vertex; an entire edge may also be optimal.', assumptions: 'First confirm the region is feasible and bounded in the improving direction.', labHref: '/labs/linear-programming', labLabel: 'Open Linear Programming Lab' },
  { id: 'lp-unbounded', module: 'Linear Programming', title: 'Unbounded region', formula: 'Z → ∞ (or −∞)', explanation: 'A feasible improving direction lets the objective grow without a finite optimum.', assumptions: 'The direction must remain inside every constraint.', labHref: '/labs/linear-programming', labLabel: 'Open Linear Programming Lab' },
  { id: 'game-maximin', module: 'Game Theory', title: 'Maximin', formula: 'max(row minima)', explanation: 'The row player chooses the strategy with the largest guaranteed payoff.', assumptions: 'Entries are row-player payoffs in a zero-sum game.', labHref: '/labs/game-theory', labLabel: 'Open Game Theory Lab' },
  { id: 'game-minimax', module: 'Game Theory', title: 'Minimax', formula: 'min(column maxima)', explanation: 'The column player chooses the strategy with the smallest payoff they allow.', assumptions: 'The column player minimizes the row player’s payoff.', labHref: '/labs/game-theory', labLabel: 'Open Game Theory Lab' },
  { id: 'game-saddle', module: 'Game Theory', title: 'Pure saddle point', formula: 'maximin = minimax', explanation: 'Matching security levels identify a pure saddle-point value.', assumptions: 'The matching value occurs at a cell that is both a row minimum and a column maximum.', labHref: '/labs/game-theory', labLabel: 'Open Game Theory Lab' },
  { id: 'game-mixed', module: 'Game Theory', title: 'Mixed strategy', formula: 'p + (1 − p) = 1', explanation: 'When no pure saddle exists, probabilities can make the opponent indifferent in supported 2×2 games.', assumptions: 'The probability model and supported strategies must be stated before solving.', labHref: '/labs/game-theory', labLabel: 'Open Game Theory Lab' },
];

const modules: Array<'all' | ReferenceModule> = ['all', 'Logic', 'Probability', 'Financial Mathematics', 'Matrices', 'Linear Programming', 'Game Theory'];

export default function ReferenceBrowser() {
  const [query, setQuery] = useState('');
  const [module, setModule] = useState<'all' | ReferenceModule>('all');
  const normalizedQuery = query.trim().toLowerCase();
  const filteredEntries = useMemo(() => referenceEntries.filter((entry) => {
    const matchesModule = module === 'all' || entry.module === module;
    const haystack = `${entry.module} ${entry.title} ${entry.formula} ${entry.explanation} ${entry.assumptions}`.toLowerCase();
    return matchesModule && (!normalizedQuery || haystack.includes(normalizedQuery));
  }), [module, normalizedQuery]);

  function clearFilters() {
    setQuery('');
    setModule('all');
  }

  return <div className="reference-browser" data-testid="reference-browser">
    <div className="reference-browser__controls">
      <label className="reference-browser__field reference-browser__search">
        <span>Search reference</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try conditional, inverse, or P(A|B)" aria-label="Search reference" />
      </label>
      <label className="reference-browser__field">
        <span>Filter by module</span>
        <select value={module} onChange={(event) => setModule(event.target.value as 'all' | ReferenceModule)} aria-label="Filter by module">
          {modules.map((item) => <option key={item} value={item}>{item === 'all' ? 'All modules' : item}</option>)}
        </select>
      </label>
      <Button variant="ghost" type="button" onClick={clearFilters} disabled={!query && module === 'all'}><RotateCcw size={15} aria-hidden="true" /> Clear</Button>
    </div>

    <div className="reference-browser__summary" aria-live="polite"><strong>{filteredEntries.length}</strong> of {referenceEntries.length} entries · open an entry for assumptions and its live lab.</div>

    {filteredEntries.length ? <div className="reference-entry-grid">
      {filteredEntries.map((entry) => <details className="reference-entry" data-module={entry.module} key={entry.id}>
        <summary><span className="reference-entry__summary"><code>{entry.formula}</code><strong>{entry.title}</strong></span><span className="reference-entry__module">{entry.module}</span></summary>
        <div className="reference-entry__body"><p>{entry.explanation}</p><div className="reference-entry__assumption"><span>Assumption</span><strong>{entry.assumptions}</strong></div><a className="text-link" href={entry.labHref}>{entry.labLabel} <ArrowUpRight size={15} aria-hidden="true" /></a></div>
      </details>)}
    </div> : <div className="empty-state"><strong>No matching reference entries.</strong><p>Try a formula, a module name, or clear the filters.</p></div>}
  </div>;
}
