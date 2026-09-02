import { useEffect, useRef, useState } from 'react';
import type { TruthTable } from '@amat19/domain-logic';
import { Button } from '../../ui/Button';
import { Feedback } from '../../ui/Feedback';
import { createAttemptId, recordAssessmentResult } from '../../../lib/local-progress';
import { truthTableProblemFingerprint } from '../../../lib/problem-fingerprint';

type Classification = TruthTable['classification'];

export function ClassificationPanel({ table }: { table: TruthTable }) {
  const [prediction, setPrediction] = useState<Classification>();
  const [revealed, setRevealed] = useState(false);
  const correct = prediction === table.classification;
  const trueRows = table.rows.filter((row) => row.finalValue).length;
  const falseRows = table.rows.length - trueRows;
  const incorrectAttemptsRef = useRef(0);
  const attemptIdRef = useRef(createAttemptId('truth-classify'));
  const startedAtRef = useRef(new Date().toISOString());

  useEffect(() => {
    incorrectAttemptsRef.current = 0;
    attemptIdRef.current = createAttemptId('truth-classify');
    startedAtRef.current = new Date().toISOString();
    setPrediction(undefined);
    setRevealed(false);
  }, [table.expression]);

  async function check() {
    if (!prediction) return;
    const wrongBefore = incorrectAttemptsRef.current;
    if (!correct) incorrectAttemptsRef.current += 1;
    setRevealed(true);
    await recordAssessmentResult({
      prefix: 'truth-classify',
      attemptId: attemptIdRef.current,
      startedAt: startedAtRef.current,
      exerciseId: 'logic.truth-table.classify',
      problemFingerprint: truthTableProblemFingerprint(table,'classify'),
      module: 'logic',
      skillId: 'logic.truth-table.classify',
      result: correct ? 'correct' : 'incorrect',
      firstAttemptCorrect: correct && wrongBefore === 0,
      incorrectAttempts: incorrectAttemptsRef.current,
      hintsUsed: 0,
      revealsUsed: 0,
      difficulty: 'standard',
      payload: { expression: table.expression, prediction, expected: table.classification },
    }).catch(() => undefined);
  }

  return (
    <section className="classification-practice" aria-labelledby="classification-heading">
      <p className="truth-lab__section-label" id="classification-heading">4 · Classify the final column</p>
      <div className="truth-lab__classification" role="radiogroup" aria-label="Classification prediction">
        {(['tautology', 'contradiction', 'contingent'] as const).map((value) => (
          <button key={value} type="button" className="truth-lab__chip" role="radio" aria-checked={prediction === value} data-selected={prediction === value} onClick={() => { setPrediction(value); setRevealed(false); }}>
            {value}
          </button>
        ))}
        <Button variant="primary" type="button" disabled={!prediction} onClick={check}>Check classification</Button>
      </div>
      {revealed && (
        <Feedback tone={correct ? 'success' : 'error'} role={correct ? 'status' : 'alert'}>
          <strong>{correct ? 'Correct.' : `This proposition is ${table.classification}.`}</strong>{' '}
          The final column has {trueRows} true row{trueRows === 1 ? '' : 's'} and {falseRows} false row{falseRows === 1 ? '' : 's'}.
          {table.classification === 'tautology' && ' A tautology is true on every assignment.'}
          {table.classification === 'contradiction' && ' A contradiction is false on every assignment.'}
          {table.classification === 'contingent' && ' A contingent proposition is true on some assignments and false on others.'}
        </Feedback>
      )}
    </section>
  );
}
