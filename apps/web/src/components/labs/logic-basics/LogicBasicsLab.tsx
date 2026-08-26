import { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Feedback } from '../../ui/Feedback';
import { recordAttempt, recordSkillEvidence } from '../../../lib/local-progress';

type Exercise =
  | {
      kind: 'proposition';
      prompt: string;
      answer: 'proposition' | 'not-proposition';
      explanation: string;
    }
  | {
      kind: 'connective';
      prompt: string;
      answer: 'and' | 'or' | 'implies' | 'iff';
      explanation: string;
    }
  | {
      kind: 'negation';
      prompt: string;
      answer: string;
      options: string[];
      explanation: string;
    };

const EXERCISES: Exercise[] = [
  {
    kind: 'proposition',
    prompt: 'The campus library closes at 8 PM today.',
    answer: 'proposition',
    explanation: 'It makes a declarative claim that can be assigned a truth value.'
  },
  {
    kind: 'proposition',
    prompt: 'Please submit the worksheet.',
    answer: 'not-proposition',
    explanation: 'A command is not true or false, so it is not a proposition.'
  },
  {
    kind: 'connective',
    prompt: 'Let P: “The quiz is today.” Let Q: “The room is open.” Translate: “The quiz is today and the room is open.”',
    answer: 'and',
    explanation: 'The word “and” joins both propositions with conjunction: P ∧ Q.'
  },
  {
    kind: 'connective',
    prompt: 'Let P: “A seat is available.” Let Q: “A standing spot is available.” Translate the inclusive statement: “A seat or a standing spot is available.”',
    answer: 'or',
    explanation: 'AMAT propositional OR is inclusive unless a problem explicitly says otherwise: P ∨ Q.'
  },
  {
    kind: 'connective',
    prompt: 'Let P: “You enter the lab.” Let Q: “You wear eye protection.” Translate: “You enter the lab only if you wear eye protection.”',
    answer: 'implies',
    explanation: '“P only if Q” means P → Q. Q is the necessary condition.'
  },
  {
    kind: 'connective',
    prompt: 'Let P: “The switch is on.” Let Q: “The indicator is lit.” Translate: “The switch is on if and only if the indicator is lit.”',
    answer: 'iff',
    explanation: '“If and only if” is the biconditional P ↔ Q.'
  },
  {
    kind: 'negation',
    prompt: 'Choose the correct negation of P ∧ Q.',
    answer: '∼P ∨ ∼Q',
    options: ['∼P ∨ ∼Q', '∼P ∧ ∼Q', 'P ∨ Q'],
    explanation: 'De Morgan’s Law changes ∧ to ∨ and negates both components.'
  }
];

const CONNECTIVE_OPTIONS = [
  ['and', '∧ · and'],
  ['or', '∨ · inclusive or'],
  ['implies', '→ · if…then / only if'],
  ['iff', '↔ · if and only if']
] as const;

export default function LogicBasicsLab() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string>();
  const [checked, setChecked] = useState(false);
  const exercise = EXERCISES[index % EXERCISES.length]!;
  const correct = selected === exercise.answer;

  const options = useMemo(() => {
    if (exercise.kind === 'proposition') {
      return [['proposition', 'Proposition'], ['not-proposition', 'Not a proposition']] as const;
    }
    if (exercise.kind === 'connective') return CONNECTIVE_OPTIONS;
    return exercise.options.map((value) => [value, value] as const);
  }, [exercise]);

  function next() {
    setIndex((current) => (current + 1) % EXERCISES.length);
    setSelected(undefined);
    setChecked(false);
  }

  async function check() {
    if (!selected) return;
    setChecked(true);
    await Promise.all([
      recordAttempt({
        prefix: 'logic-basics',
        exerciseId: `logic.basics.${index}`,
        module: 'logic',
        finalState: correct ? 'correct' : 'incomplete',
        payload: { kind: exercise.kind, selected, correct }
      }),
      recordSkillEvidence(exercise.kind === 'proposition' ? 'logic.propositions' : 'logic.equivalence', correct ? 1 : 0)
    ]).catch(() => undefined);
  }

  return (
    <section className="learning-lab" data-testid="logic-basics-lab">
      <div className="learning-lab__prompt">
        <p className="section-label">Controlled practice · {index + 1}/{EXERCISES.length}</p>
        <h2>{exercise.kind === 'proposition' ? 'Is this a proposition?' : exercise.kind === 'connective' ? 'Choose the connective' : 'Track the negation scope'}</h2>
        <p className="learning-lab__question">{exercise.prompt}</p>
        <div className="choice-grid" role="radiogroup" aria-label="Answer choices">
          {options.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="choice-button"
              role="radio"
              aria-checked={selected === value}
              data-selected={selected === value}
              onClick={() => { setSelected(value); setChecked(false); }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="action-row">
          <Button variant="primary" type="button" disabled={!selected} onClick={check}>Check answer</Button>
          <Button variant="ghost" type="button" onClick={() => { setSelected(undefined); setChecked(false); }}>
            <RotateCcw size={16} aria-hidden="true" /> Reset
          </Button>
        </div>
      </div>

      <aside className="learning-lab__explain">
        <p className="section-label">Why</p>
        {!checked && <p>Choose an answer first. Feedback explains the concept instead of only showing a score.</p>}
        {checked && (
          <Feedback tone={correct ? 'success' : 'error'} role={correct ? 'status' : 'alert'}>
            <strong>{correct ? 'Correct.' : 'Not yet.'}</strong> {exercise.explanation}
          </Feedback>
        )}
        {checked && correct && (
          <Button variant="secondary" type="button" onClick={next}>
            <CheckCircle2 size={16} aria-hidden="true" /> Try another
          </Button>
        )}
        <details className="reference-details">
          <summary>Connective reference</summary>
          <dl className="mini-definition-list">
            <div><dt>∼P</dt><dd>not P</dd></div>
            <div><dt>P ∧ Q</dt><dd>P and Q</dd></div>
            <div><dt>P ∨ Q</dt><dd>P or Q, inclusive</dd></div>
            <div><dt>P → Q</dt><dd>if P then Q; P only if Q</dd></div>
            <div><dt>P ↔ Q</dt><dd>P if and only if Q</dd></div>
          </dl>
        </details>
      </aside>
    </section>
  );
}
