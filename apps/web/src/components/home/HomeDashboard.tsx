import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { buildStudyQueue } from '@amat19/learning-engine';
import { currentCourseProfile, skillGraph } from '@amat19/course-content';
import { DexiePersistence, type MasteryRecord, type PersistedAttempt, type PersistedSession } from '@amat19/persistence';
import { Skeleton } from '../ui/Skeleton';
import { aggregateMasteryForCourseSkill, canonicalMasteryMap, canonicalSkillId } from '../../lib/mastery-targets';
import { learnerActivityLabel, learnerModuleLabel } from '../../lib/learner-labels';
import { masteryLabel } from '../../lib/local-progress';

type Data = { mastery: MasteryRecord[]; attempts: PersistedAttempt[]; sessions: PersistedSession[] };

type QueueReason = 'continue' | 'repair' | 'weak' | 'review' | 'new' | 'bookmark';

const moduleMath: Record<string, string> = {
  logic: 'P ↔ Q',
  probability: 'P(A|B)',
  finance: 'F=P(1+i)ⁿ',
  linear: '[A|b]',
  applications: 'Z=cᵀx',
};

const moduleSketch: Record<string, string> = {
  logic: `P  Q  P→Q
T  T   T
T  F   F
F  T   T`,
  probability: `      A
Ω ─────┤
      Aᶜ
P(A|B)`,
  finance: `0────1────2────n
P    ↑    ↑    F
     cash flow`,
  linear: `[ 1  1 | 3 ]
[ 1 -1 | 1 ]
R₂ ← R₂ − R₁`,
  applications: `y
│ ╱ feasible
│╱_____ x
max Z=cᵀx`,
};

const reasonLabel: Record<QueueReason, string> = {
  continue: 'Continue',
  repair: 'Repair',
  weak: 'Foundation',
  review: 'Review',
  new: 'New',
  bookmark: 'Saved',
};

export default function HomeDashboard() {
  const [data, setData] = useState<Data>();
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const db = new DexiePersistence();
    Promise.all([db.listMastery(), db.listAttempts(), db.listSessions()])
      .then(([mastery, attempts, sessions]) => setData({ mastery, attempts, sessions }))
      .catch(() => setUnavailable(true));
  }, []);

  const computed = useMemo(() => {
    if (!data) return undefined;
    const mastery = canonicalMasteryMap(data.mastery);
    const attemptsByRecency = [...data.attempts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const recentMisses = new Set(
      attemptsByRecency
        .filter((attempt) => attempt.finalState === 'incomplete')
        .slice(0, 12)
        .flatMap((attempt) => (attempt.skillIds ?? []).map(canonicalSkillId)),
    );
    const currentSkills = skillGraph.filter((skill) => skill.scope === 'current');
    const activeSessions = data.sessions
      .filter((session) => session.outcome === 'active')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const candidates = currentSkills.map((skill) => {
      const record = mastery.get(skill.id) ?? (skill.parentId ? mastery.get(skill.parentId) : undefined);
      return {
        skillId: skill.id,
        title: skill.title,
        href: skill.labHref,
        masteryScore: record?.evidenceScore,
        attempts: record?.attempts,
        lastPracticedAt: record?.lastPracticed,
        recentIncorrect: recentMisses.has(skill.id) || Boolean(skill.parentId && recentMisses.has(skill.parentId)),
        bookmarked: false,
        resumable: activeSessions.some((session) => {
          const ids = session.skillIds.map(canonicalSkillId);
          return ids.includes(skill.id) || Boolean(skill.parentId && ids.includes(skill.parentId));
        }),
      };
    });
    const queue = buildStudyQueue(candidates, new Date(), 7);
    const reviewItems = queue.filter((item) => ['repair', 'weak', 'review'].includes(item.reason));

    const active = activeSessions[0];
    const activeSkill = active
      ? skillGraph.find((skill) => {
          const ids = active.skillIds.map(canonicalSkillId);
          return ids.includes(skill.id) || Boolean(skill.parentId && ids.includes(skill.parentId));
        })
      : undefined;
    const fallback = queue[0];
    const continueItem = active
      ? {
          title: activeSkill?.title ?? learnerActivityLabel(active),
          module: learnerModuleLabel(active.module),
          href: activeSkill?.labHref ?? '/study',
          detail: `Last work: ${learnerActivityLabel(active)}`,
          secondary: `Saved ${new Date(active.updatedAt).toLocaleDateString()}`,
          moduleId: active.module,
        }
      : fallback
        ? {
            title: fallback.title,
            module: (() => { const node = skillGraph.find((skill) => skill.id === fallback.skillId); return node ? learnerModuleLabel(node.module) : 'AMAT 19'; })(),
            href: fallback.href,
            detail: fallback.rationale,
            secondary: 'Recommended from your local study evidence',
            moduleId: skillGraph.find((skill) => skill.id === fallback.skillId)?.module ?? 'logic',
          }
        : {
            title: 'Truth values & truth tables',
            module: 'Logic',
            href: '/labs/truth-table',
            detail: 'Start with a core mathematical object.',
            secondary: 'Your future work stays local to this browser',
            moduleId: 'logic',
          };

    const moduleProgress = currentCourseProfile.modules.map((module) => {
      const skills = currentCourseProfile.skills.filter((skill) => skill.module === module.id && skill.status === 'implemented');
      const records = skills.map((skill) => aggregateMasteryForCourseSkill(skill.id, data.mastery)).filter(Boolean) as MasteryRecord[];
      const score = skills.length
        ? skills.reduce((sum, skill) => sum + (aggregateMasteryForCourseSkill(skill.id, data.mastery)?.evidenceScore ?? 0), 0) / skills.length
        : 0;
      const labels = skills.map((skill) => masteryLabel(aggregateMasteryForCourseSkill(skill.id, data.mastery)));
      const status = labels.length && labels.every((label) => label === 'Secure')
        ? 'Secure'
        : records.length
          ? 'Developing'
          : 'Learning';
      return { module, percent: Math.round(score * 100), status };
    });

    return { continueItem, queue, reviewItems, moduleProgress };
  }, [data]);

  if (unavailable) {
    return <div className="empty-state" role="status"><strong>Local study evidence is unavailable.</strong><p>The course and every lab still work directly.</p><a className="text-link" href="/course">Open the course →</a></div>;
  }
  if (!computed) {
    return <div className="home-dashboard" aria-busy="true"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="home-dashboard" data-testid="home-dashboard">
      <div className="home-dashboard__main">
        <section aria-labelledby="continue-heading">
          <h2 className="home-section-title" id="continue-heading">Continue studying</h2>
          <div className="home-continue">
            <div className="home-continue__math" aria-hidden="true">
              <pre>{moduleSketch[computed.continueItem.moduleId] ?? moduleSketch.logic}</pre>
            </div>
            <div className="home-continue__body">
              <h2>{computed.continueItem.title}</h2>
              <span className="home-continue__module">{computed.continueItem.module}</span>
              <div className="home-continue__meta"><span>{computed.continueItem.detail}</span><span>{computed.continueItem.secondary}</span></div>
              <div className="home-continue__actions"><a className="amat-button amat-button--primary" href={computed.continueItem.href}>Continue <ArrowRight size={16} aria-hidden="true" /></a></div>
            </div>
          </div>
        </section>

        <section aria-labelledby="course-overview-heading">
          <h2 className="home-section-title" id="course-overview-heading">Course overview</h2>
          <div className="course-evidence-list">
            {computed.moduleProgress.map(({ module, percent, status }, index) => (
              <a className="course-evidence-row" href={module.href} key={module.id}>
                <span className="course-evidence-row__number">{index + 1}</span>
                <strong>{module.title}</strong>
                <span className="course-evidence-row__track" aria-hidden="true"><span className="course-evidence-row__fill" style={{ width: `${percent}%` }} /></span>
                <span className="course-evidence-row__status" aria-label={`${module.title} evidence ${percent}% · ${status}`}>{status}</span>
                <span aria-hidden="true">›</span>
              </a>
            ))}
          </div>
        </section>
      </div>

      <aside className="home-dashboard__aside" aria-label="Study suggestions">
        <section className="home-review">
          <h2 className="home-section-title">Review &amp; repair</h2>
          <div className="home-review__metric">
            <RotateCcw aria-hidden="true" size={28} strokeWidth={1.6} />
            <span>
              <strong>{computed.reviewItems.length ? `${computed.reviewItems.length} prioritized ${computed.reviewItems.length === 1 ? 'item' : 'items'}` : 'Nothing urgent'}</strong>
              <small>{computed.reviewItems.length ? 'Based on recent misses, developing evidence, and retrieval spacing.' : 'Your saved evidence does not currently surface a repair or spaced-review priority.'}</small>
            </span>
          </div>
          <div className="home-review__action"><a className="text-link" href="/study">Open study queue →</a></div>
        </section>

        <section className="home-next">
          <h2 className="home-section-title">Next</h2>
          <div className="home-next-list">
            {computed.queue.slice(0, 3).map((item) => {
              const node = skillGraph.find((skill) => skill.id === item.skillId);
              return <a className="home-next-item" href={item.href} key={item.skillId}>
                <span className="home-next-item__math" aria-hidden="true">{moduleMath[node?.module ?? 'logic']}</span>
                <span><strong>{item.title}</strong><small>{reasonLabel[item.reason as QueueReason]}</small></span>
                <span aria-hidden="true">›</span>
              </a>;
            })}
          </div>
          <div className="home-review__action"><a className="text-link" href="/study">View all →</a></div>
        </section>
      </aside>
    </div>
  );
}
