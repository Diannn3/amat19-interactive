import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, History, LockKeyhole, RefreshCw, Sparkles, Target } from 'lucide-react';
import { practicePresets, skillGraph, type ModuleId } from '@amat19/course-content';
import { DexiePersistence } from '@amat19/persistence';
import { Button } from '../ui/Button';
import { Feedback } from '../ui/Feedback';
import { Badge } from '../ui/Badge';
import { generateMixedAssessment, type AssessmentExercise, type AssessmentModule } from '../../lib/mixed-assessment';
import { recordAttempt, recordSkillEvidence } from '../../lib/local-progress';

type Mode = 'practice' | 'exam';
type Props = { mode?: Mode; questionCount?: number; module?: AssessmentModule; defaultPresetId?: string };

const modulePreset: Record<AssessmentModule, string> = {
  logic: 'logic-drill',
  probability: 'probability-drill',
  finance: 'finance-drill',
  linear: 'matrices-drill',
  applications: 'applications-drill',
};

const moduleLabel: Record<AssessmentModule, string> = {
  logic: 'Logic',
  probability: 'Probability',
  finance: 'Financial Mathematics',
  linear: 'Matrices & Systems',
  applications: 'Applications',
};

function freshSeed(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function MixedPracticeRunner({ mode = 'practice', questionCount = 10, module, defaultPresetId }: Props) {
  const availablePresets = useMemo(
    () => practicePresets.filter((preset) => preset.id !== 'exam-mix' && (!module || preset.modules?.includes(module))),
    [module],
  );
  const initialPresetId = mode === 'exam' ? 'exam-mix' : defaultPresetId ?? (module ? modulePreset[module] : 'quick-5');
  // Keep the server-rendered question deterministic. A fresh client seed is
  // applied after hydration so React does not reconcile different question
  // markup produced by Date.now()/Math.random() on the server and browser.
  const [seed, setSeed] = useState(() => `${mode}-initial`);
  const [presetId, setPresetId] = useState(initialPresetId);
  const [modules, setModules] = useState<AssessmentModule[] | undefined>(module ? [module] : undefined);
  const [skillId, setSkillId] = useState<string>();
  const [adaptiveCount, setAdaptiveCount] = useState(questionCount);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (mode === 'exam') {
      setSeed(freshSeed(mode));
      setHydrated(true);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const requested = params.get('preset');
    const requestedSkill = params.get('skill') || undefined;
    if (requested && availablePresets.some((preset) => preset.id === requested)) setPresetId(requested);
    if (requestedSkill) {
      const node = skillGraph.find((skill) => skill.id === requestedSkill);
      if (node && (!module || node.module === module)) {
        setSkillId(requestedSkill);
        setModules([node.module]);
      }
    }
    setSeed(freshSeed(requested ?? initialPresetId));
    setHydrated(true);
  }, [availablePresets, mode, module]);

  useEffect(() => {
    if (mode === 'exam') return;
    const preset = practicePresets.find((item) => item.id === presetId);
    if (!preset) return;

    setAdaptiveCount(preset.count);
    if (module) {
      setModules([module]);
      return;
    }
    if (skillId) {
      const node = skillGraph.find((skill) => skill.id === skillId);
      if (node) {
        setModules([node.module]);
        return;
      }
    }
    if (preset.modules) setModules(preset.modules as AssessmentModule[]);
    else if (preset.adaptive === 'none' || preset.adaptive === 'review') setModules(undefined);

    if (preset.adaptive === 'weak' || preset.adaptive === 'recent-mistakes') {
      let active = true;
      const db = new DexiePersistence();
      Promise.all([db.listMastery(), db.listAttempts()]).then(([mastery, attempts]) => {
        if (!active) return;
        if (preset.adaptive === 'recent-mistakes') {
          const recent = [...new Set(attempts.filter((attempt) => attempt.finalState === 'incomplete').slice(0, 12).map((attempt) => attempt.module as AssessmentModule))];
          setModules(recent.length ? recent : undefined);
          return;
        }
        const moduleScores = new Map<ModuleId, { sum: number; count: number }>();
        for (const record of mastery) {
          const node = skillGraph.find((skill) => skill.id === record.skillId || skill.parentId === record.skillId);
          if (!node) continue;
          const current = moduleScores.get(node.module) ?? { sum: 0, count: 0 };
          current.sum += record.evidenceScore;
          current.count += 1;
          moduleScores.set(node.module, current);
        }
        const ranked = [...moduleScores.entries()].sort((a, b) => (a[1].count ? a[1].sum / a[1].count : 0) - (b[1].count ? b[1].sum / b[1].count : 0));
        setModules(ranked.length ? [ranked[0]![0] as AssessmentModule] : undefined);
      }).catch(() => {
        if (active) setModules(undefined);
      });
      return () => { active = false; };
    }
  }, [module, mode, presetId, skillId]);

  const modulesKey = modules?.join('|');
  const questions = useMemo(
    () => generateMixedAssessment(seed, mode === 'exam' ? questionCount : adaptiveCount, { modules, skillId }),
    [seed, mode, questionCount, adaptiveCount, modulesKey, skillId],
  );
  const activeIndex = Math.min(activeQuestionIndex, Math.max(questions.length - 1, 0));
  const activeQuestion = questions[activeIndex];
  const answeredCount = questions.filter((question) => answers[question.id] !== undefined).length;
  const score = questions.reduce((total, question) => total + (answers[question.id] === question.correctIndex ? 1 : 0), 0);
  const activePreset = practicePresets.find((preset) => preset.id === presetId);

  function choosePreset(id: string) {
    if (!availablePresets.some((preset) => preset.id === id)) return;
    setPresetId(id);
    setSkillId(undefined);
    const url = new URL(window.location.href);
    url.searchParams.set('preset', id);
    url.searchParams.delete('skill');
    window.history.replaceState({}, '', url);
    setSeed(freshSeed(id));
    setAnswers({});
    setChecked({});
    setActiveQuestionIndex(0);
    setSubmitted(false);
    setSaved(false);
  }

  function reset() {
    setSeed(freshSeed(mode));
    setAnswers({});
    setChecked({});
    setActiveQuestionIndex(0);
    setSubmitted(false);
    setSaved(false);
  }

  function goToQuestion(index: number) {
    setActiveQuestionIndex(Math.min(Math.max(index, 0), Math.max(questions.length - 1, 0)));
  }

  async function checkOne(question: AssessmentExercise) {
    setChecked((current) => ({ ...current, [question.id]: true }));
    const selected = answers[question.id];
    if (selected === undefined) return;
    const correct = selected === question.correctIndex;
    await Promise.all([
      recordAttempt({ prefix: 'mixed-practice', exerciseId: question.id, module: question.module, finalState: correct ? 'correct' : 'incomplete', payload: { seed, questionId: question.id, selected, correctIndex: question.correctIndex, mode, presetId }, skillIds: [question.skillId] }),
      recordSkillEvidence(question.skillId, correct ? 1 : 0, { independent: correct }),
    ]).catch(() => undefined);
  }

  async function submitExam() {
    setSubmitted(true);
    if (saved) return;
    setSaved(true);
    await Promise.all(questions.map(async (question) => {
      const selected = answers[question.id];
      const correct = selected === question.correctIndex;
      await recordAttempt({ prefix: 'mixed-check', exerciseId: question.id, module: question.module, finalState: correct ? 'correct' : 'incomplete', payload: { seed, questionId: question.id, selected, correctIndex: question.correctIndex, mode: 'exam' }, skillIds: [question.skillId] }).catch(() => undefined);
      await recordSkillEvidence(question.skillId, correct ? 0.9 : 0, { independent: correct }).catch(() => undefined);
    }));
  }

  return <div className="mixed-practice" data-testid={mode === 'exam' ? 'mixed-exam' : 'mixed-practice'} data-module={module} data-hydrated={hydrated ? 'true' : undefined}>
    {mode === 'practice' && !module && <div className="practice-presets" aria-label="Practice presets">
      {availablePresets.map((preset) => <Button key={preset.id} variant={preset.id === presetId ? 'primary' : 'secondary'} aria-pressed={preset.id === presetId} onClick={() => choosePreset(preset.id)}>
        {preset.id === 'weak-areas' ? <Target size={15} aria-hidden="true" /> : preset.id === 'recent-mistakes' ? <History size={15} aria-hidden="true" /> : <Sparkles size={15} aria-hidden="true" />} {preset.label}
      </Button>)}
    </div>}

    <div className="mixed-practice__toolbar">
      <div>
        <h2>{mode === 'exam' ? 'Mixed course check' : activePreset?.label ?? 'Module retrieval'}</h2>
        <p className="section-context">{mode === 'exam' ? 'Whole-course review' : module ? `${moduleLabel[module]} module` : 'Fresh practice set'}</p>
        <p>{mode === 'exam' ? 'Feedback stays hidden until submission. This is a study check, not an official course examination.' : activePreset?.description ?? 'Check each item, read the reason, then repair the linked skill.'}</p>
      </div>
      <Button variant="secondary" type="button" onClick={reset}><RefreshCw size={16} aria-hidden="true" /> New set</Button>
    </div>

    <div className="mixed-practice__progress" role="status" aria-live="polite">
      <span className="section-label">{mode === 'exam' ? 'Course check' : 'Practice set'}</span>
      <strong>Question {activeIndex + 1} of {questions.length}</strong>
      <span>{answeredCount} answered</span>
    </div>

    {mode === 'exam' && <nav className="exam-question-nav" aria-label="Exam question navigator">
      {questions.map((question, index) => <button key={question.id} type="button" aria-label={`Question ${index + 1}${answers[question.id] !== undefined ? ', answered' : ''}`} aria-current={index === activeIndex ? 'step' : undefined} data-current={index === activeIndex ? 'true' : undefined} data-answered={answers[question.id] !== undefined ? 'true' : undefined} onClick={() => goToQuestion(index)}>{String(index + 1).padStart(2, '0')}</button>)}
    </nav>}

    {activeQuestion && <div className="mixed-question-stage">
      <ol className="mixed-question-list">
        {(() => {
          const question = activeQuestion;
          const showResult = mode === 'exam' ? submitted : checked[question.id];
          const selected = answers[question.id];
          const correct = selected === question.correctIndex;
          return <li className="mixed-question" key={question.id} data-result={showResult ? (correct ? 'correct' : 'wrong') : undefined}>
            <div className="mixed-question__head"><Badge>{moduleLabel[question.module]}</Badge><span className="mixed-question__counter">Question {activeIndex + 1}</span><strong>{question.title}</strong></div>
            <p>{question.prompt}</p>
            <fieldset disabled={mode === 'exam' ? submitted : Boolean(showResult)}>
              <legend className="sr-only">Answer question {activeIndex + 1}</legend>
              <div className="choice-grid">{question.choices.map((choice, choiceIndex) => <label className="choice-option" key={choice}>
                <input type="radio" name={question.id} checked={selected === choiceIndex} onChange={() => setAnswers((current) => ({ ...current, [question.id]: choiceIndex }))} />
                <span>{choice}</span>
              </label>)}</div>
            </fieldset>
            {mode === 'practice' && !showResult && <Button variant="primary" type="button" disabled={selected === undefined} onClick={() => void checkOne(question)}>Check item</Button>}
            {showResult && <div className="mixed-question__result"><Feedback tone={correct ? 'success' : 'error'}>{correct ? 'Correct.' : `Not yet. The correct answer is ${question.choices[question.correctIndex]}.`} {question.explanation}</Feedback><a className="text-link" href={question.labHref}>Repair this skill in its lab <ExternalLink size={14} aria-hidden="true" /></a></div>}
            <div className="mixed-question__actions">
              <Button variant="secondary" type="button" disabled={activeIndex === 0} onClick={() => goToQuestion(activeIndex - 1)}>Previous</Button>
              {mode === 'practice' && showResult && <Button variant="primary" type="button" onClick={() => activeIndex === questions.length - 1 ? reset() : goToQuestion(activeIndex + 1)}>{activeIndex === questions.length - 1 ? 'Start another set' : 'Next question'}</Button>}
              {mode === 'exam' && <Button variant="secondary" type="button" disabled={activeIndex === questions.length - 1} onClick={() => goToQuestion(activeIndex + 1)}>Next question</Button>}
            </div>
          </li>;
        })()}
      </ol>
    </div>}

    {mode === 'exam' && !submitted && <Button variant="primary" type="button" onClick={() => void submitExam()}><LockKeyhole size={16} aria-hidden="true" /> Submit all answers</Button>}
    {mode === 'exam' && submitted && <div className="mixed-practice__score" role="status"><CheckCircle2 aria-hidden="true" /><strong>{score}/{questions.length}</strong><span>{score === questions.length ? 'All items correct.' : 'Use the repair links for missed concepts, then generate a new set.'}</span></div>}
  </div>;
}
