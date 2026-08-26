import { useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw, ExternalLink, LockKeyhole } from 'lucide-react';
import { Button } from '../ui/Button';
import { Feedback } from '../ui/Feedback';
import { generateMixedAssessment, type AssessmentExercise } from '../../lib/mixed-assessment';
import { recordAttempt, recordSkillEvidence } from '../../lib/local-progress';

type Mode = 'practice' | 'exam';
function freshSeed(prefix: string): string { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

export default function MixedPracticeRunner({ mode = 'practice', questionCount = 10 }: { mode?: Mode; questionCount?: number }) {
  const [seed, setSeed] = useState(() => freshSeed(mode));
  const questions = useMemo(() => generateMixedAssessment(seed, questionCount), [seed, questionCount]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);

  const score = questions.reduce((total, question) => total + (answers[question.id] === question.correctIndex ? 1 : 0), 0);

  async function checkOne(question: AssessmentExercise) {
    setChecked((current) => ({ ...current, [question.id]: true }));
    const selected = answers[question.id];
    if (selected === undefined) return;
    const correct = selected === question.correctIndex;
    await recordAttempt({
      prefix: 'mixed-practice', exerciseId: question.id, module: question.module,
      finalState: correct ? 'correct' : 'incomplete',
      payload: { seed, questionId: question.id, selected, correctIndex: question.correctIndex, mode }
    }).catch(() => undefined);
    await recordSkillEvidence(question.skillId, correct ? 1 : 0).catch(() => undefined);
  }

  async function submitExam() {
    setSubmitted(true);
    if (saved) return;
    setSaved(true);
    await Promise.all(questions.map(async (question) => {
      const selected = answers[question.id];
      const correct = selected === question.correctIndex;
      await recordAttempt({
        prefix: 'mixed-check', exerciseId: question.id, module: question.module,
        finalState: correct ? 'correct' : 'incomplete',
        payload: { seed, questionId: question.id, selected, correctIndex: question.correctIndex, mode: 'exam' }
      }).catch(() => undefined);
      await recordSkillEvidence(question.skillId, correct ? 0.9 : 0).catch(() => undefined);
    }));
  }

  function reset() {
    setSeed(freshSeed(mode)); setAnswers({}); setChecked({}); setSubmitted(false); setSaved(false);
  }

  return (
    <div className="mixed-practice" data-testid={mode === 'exam' ? 'mixed-exam' : 'mixed-practice'}>
      <div className="mixed-practice__toolbar">
        <div>
          <p className="eyebrow">Original generated set · seed {seed}</p>
          <h2>{mode === 'exam' ? 'Mixed course check' : 'Mixed practice'}</h2>
          <p>{mode === 'exam' ? 'Feedback stays hidden until submission. This is a study check, not an official course examination.' : 'Check each item immediately, read the reason, then jump into the linked lab when a concept needs more work.'}</p>
        </div>
        <Button variant="secondary" type="button" onClick={reset}><RefreshCw size={16} aria-hidden="true" /> New set</Button>
      </div>

      <ol className="mixed-question-list">
        {questions.map((question, index) => {
          const showResult = mode === 'exam' ? submitted : checked[question.id];
          const selected = answers[question.id];
          const correct = selected === question.correctIndex;
          return (
            <li className="mixed-question" key={question.id} data-result={showResult ? (correct ? 'correct' : 'wrong') : undefined}>
              <div className="mixed-question__head"><span className="status-pill">{question.module}</span><strong>{index + 1}. {question.title}</strong></div>
              <p>{question.prompt}</p>
              <fieldset disabled={mode === 'exam' && submitted}>
                <legend className="sr-only">Answer question {index + 1}</legend>
                <div className="choice-grid">
                  {question.choices.map((choice, choiceIndex) => (
                    <label className="choice-option" key={choice}>
                      <input type="radio" name={question.id} checked={selected === choiceIndex} onChange={() => setAnswers((current) => ({ ...current, [question.id]: choiceIndex }))} />
                      <span>{choice}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {mode === 'practice' && !showResult && <Button variant="primary" type="button" disabled={selected === undefined} onClick={() => void checkOne(question)}>Check item</Button>}
              {showResult && (
                <div className="mixed-question__result">
                  <Feedback tone={correct ? 'success' : 'error'} role="status">
                    {correct ? 'Correct.' : `Not yet. The correct answer is ${question.choices[question.correctIndex]}.`} {question.explanation}
                  </Feedback>
                  <a className="text-link" href={question.labHref}>Practice this skill in its lab <ExternalLink size={14} aria-hidden="true" /></a>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {mode === 'exam' && !submitted && <Button variant="primary" type="button" onClick={() => void submitExam()}><LockKeyhole size={16} aria-hidden="true" /> Submit all answers</Button>}
      {mode === 'exam' && submitted && (
        <div className="mixed-practice__score" role="status">
          <CheckCircle2 aria-hidden="true" /> <strong>{score}/{questions.length}</strong>
          <span>{score === questions.length ? 'All items correct.' : 'Use the per-item lab links to repair the concepts you missed, then generate a new set.'}</span>
        </div>
      )}
    </div>
  );
}
