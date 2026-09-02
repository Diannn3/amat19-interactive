import { useEffect, useMemo, useState } from 'react';
import { buildStudyQueue } from '@amat19/learning-engine';
import { skillGraph } from '@amat19/course-content';
import { DexiePersistence, type MasteryRecord, type PersistedAttempt, type PersistedSession, type SavedItem } from '@amat19/persistence';
import { Skeleton } from '../ui/Skeleton';
import { canonicalMasteryMap, canonicalSkillId } from '../../lib/mastery-targets';
import { learnerActivityLabel, learnerModuleLabel } from '../../lib/learner-labels';

const reasonLabel: Record<string, string> = { continue: 'Continue', repair: 'Repair', weak: 'Foundation', review: 'Review', new: 'New', bookmark: 'Saved' };

type Data = {
  mastery: MasteryRecord[];
  attempts: PersistedAttempt[];
  sessions: PersistedSession[];
  saved: SavedItem[];
};

export default function StudyDashboard() {
  const [data, setData] = useState<Data>();
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const db = new DexiePersistence();
    Promise.all([db.listMastery(), db.listAttempts(), db.listSessions(), db.listSavedItems()])
      .then(([mastery, attempts, sessions, saved]) => setData({ mastery, attempts, sessions, saved }))
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
    const activeSessions = data.sessions.filter((session) => session.outcome === 'active').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const bookmarks = new Set(data.saved.flatMap((item) => (item.skillIds ?? []).map(canonicalSkillId)));
    const currentSkills = skillGraph.filter((skill) => skill.scope === 'current');
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
        bookmarked: bookmarks.has(skill.id),
        resumable: activeSessions.some((session) => {
          const ids = session.skillIds.map(canonicalSkillId);
          return ids.includes(skill.id) || Boolean(skill.parentId && ids.includes(skill.parentId));
        }),
      };
    });
    const queue = buildStudyQueue(candidates, new Date(), 7);
    return { queue, activeSessions, attempts: attemptsByRecency };
  }, [data]);

  if (unavailable) {
    return (
      <div className="empty-state" role="status">
        <strong>Local study data is unavailable.</strong>
        <p>You can still open every lesson and lab directly from the course map.</p>
        <a className="text-link" href="/course">Open course map →</a>
      </div>
    );
  }

  if (!computed) {
    return <div className="study-instrument" aria-busy="true"><Skeleton className="h-44" /><Skeleton className="h-64" /></div>;
  }

  const primary = computed.queue[0];
  const recentSession = computed.activeSessions[0];
  const resumeHref = recentSession
    ? skillGraph.find((skill) => {
        const ids = recentSession.skillIds.map(canonicalSkillId);
        return ids.includes(skill.id) || Boolean(skill.parentId && ids.includes(skill.parentId));
      })?.labHref
    : undefined;

  return (
    <div className="study-instrument" data-testid="study-dashboard">
      <section className="study-recommended" aria-labelledby="recommended-heading">
        {primary ? (
          <>
            <h2 id="recommended-heading">{primary.title}</h2>
            <p>{primary.rationale}</p>
            <a className="amat-button amat-button--primary" href={primary.href}>Continue →</a>
          </>
        ) : (
          <>
            <h2 id="recommended-heading">Start anywhere in the core course.</h2>
            <p>Once you practice, the queue will prioritize unfinished work, recent misses, and retrieval reviews.</p>
            <a className="amat-button amat-button--primary" href="/course">Choose a module</a>
          </>
        )}
      </section>

      {recentSession && resumeHref && (
        <section className="study-resume" aria-labelledby="resume-heading">
          <p className="section-label">Resume unfinished work</p>
          <a href={resumeHref}>
            <span>
              <strong id="resume-heading">{learnerActivityLabel(recentSession)}</strong>
              <small>{learnerModuleLabel(recentSession.module)} · saved {new Date(recentSession.updatedAt).toLocaleDateString()}</small>
            </span>
            <span aria-hidden="true">→</span>
          </a>
        </section>
      )}

      <section className="study-queue-linear" aria-labelledby="queue-heading">
        <div className="section-heading">
          <div>
            <h2 id="queue-heading">Next</h2>
            <p className="section-context">High-value retrieval first</p>
          </div>
        </div>
        {computed.queue.length ? (
          <ol>
            {computed.queue.slice(0, 6).map((item, index) => (
              <li key={item.skillId}>
                <a href={item.href}>
                  <span className="study-queue-linear__number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="study-queue-linear__copy"><strong>{item.title}</strong><small>{item.rationale}</small></span>
                  <span className="study-queue-linear__reason">{reasonLabel[item.reason] ?? item.reason}</span>
                  <span aria-hidden="true">→</span>
                </a>
              </li>
            ))}
          </ol>
        ) : (
          <p className="lede">No repair queue yet. Practice a core skill and this list will adapt to your evidence.</p>
        )}
      </section>

      <nav className="study-shortcuts" aria-label="Study tools">
        <a href="/exam"><strong>Mixed course check</strong><span>Independent whole-course retrieval</span><span aria-hidden="true">→</span></a>
        <a href="/saved"><strong>Saved work</strong><span>Return to lessons and study objects</span><span aria-hidden="true">→</span></a>
        <a href="/reference"><strong>Reference</strong><span>Formulas, notation, and assumptions</span><span aria-hidden="true">→</span></a>
      </nav>
    </div>
  );
}
