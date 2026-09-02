import { useEffect, useMemo, useState } from 'react';
import { currentCourseProfile } from '@amat19/course-content';
import { DexiePersistence, type MasteryRecord, type PersistedAttempt } from '@amat19/persistence';
import { masteryLabel } from '../../lib/local-progress';
import { aggregateMasteryForCourseSkill } from '../../lib/mastery-targets';
import { learnerActivityLabel, learnerAttemptStateLabel, learnerModuleLabel } from '../../lib/learner-labels';
import { Skeleton } from '../ui/Skeleton';

const coreSkills = currentCourseProfile.skills.filter((skill) => skill.status === 'implemented');

export default function ProgressDashboard() {
  const [records, setRecords] = useState<MasteryRecord[]>();
  const [attempts, setAttempts] = useState<PersistedAttempt[]>([]);

  useEffect(() => {
    const db = new DexiePersistence();
    Promise.all([db.listMastery(), db.listAttempts()])
      .then(([mastery, savedAttempts]) => {
        setRecords(mastery);
        setAttempts(savedAttempts);
      })
      .catch(() => setRecords([]));
  }, []);

  const byId = useMemo(
    () => new Map(coreSkills.flatMap((skill) => {
      const record = aggregateMasteryForCourseSkill(skill.id, records ?? []);
      return record ? [[skill.id, record] as const] : [];
    })),
    [records],
  );

  if (!records) {
    return <div className="progress-dashboard" aria-busy="true"><Skeleton className="h-36" /><Skeleton className="h-72" /></div>;
  }

  const weak = coreSkills.filter((skill) => byId.has(skill.id) && masteryLabel(byId.get(skill.id)) !== 'Secure');
  const attemptsByRecency = [...attempts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="progress-dashboard" data-testid="progress-dashboard">
      {weak.length > 0 && (
        <section className="progress-attention" aria-labelledby="attention-heading">
          <h2 id="attention-heading">{weak.length} core skill{weak.length === 1 ? '' : 's'} need another pass.</h2>
          <p className="section-context">Needs attention</p>
          <p>Choose one weak link, practice it independently, then come back after another retrieval attempt.</p>
          {weak[0]?.relatedLab && <a className="amat-button amat-button--primary" href={weak[0].relatedLab}>Practice {weak[0].title} →</a>}
        </section>
      )}

      <section aria-labelledby="concept-map-heading">
        <div className="section-heading">
          <div>
            <h2 id="concept-map-heading">Course evidence</h2>
            <p className="section-context">Evidence, not a fake grade</p>
          </div>
        </div>
        {currentCourseProfile.modules.map((module) => {
          const skills = coreSkills.filter((skill) => skill.module === module.id);
          return (
            <section className="progress-module-section" key={module.id} aria-labelledby={`progress-${module.id}`}>
              <div className="progress-module-section__heading">
                <h2 id={`progress-${module.id}`}>{module.title}</h2>
                <a className="text-link" href={module.href}>Open module →</a>
              </div>
              <div className="progress-concept-list">
                {skills.map((skill) => {
                  const record = byId.get(skill.id);
                  const label = masteryLabel(record);
                  const score = Math.max(0, Math.min(1, record?.evidenceScore ?? 0));
                  return (
                    <a className="progress-concept" href={skill.relatedLab ?? module.href} key={skill.id}>
                      <span><strong>{skill.title}</strong></span>
                      <span className="progress-concept__track" aria-hidden="true"><span className="progress-concept__fill" style={{ width: `${score * 100}%` }} /></span>
                      <span className="progress-concept__status">{label}</span>
                      <span aria-hidden="true">→</span>
                    </a>
                  );
                })}
              </div>
            </section>
          );
        })}
      </section>

      <section aria-labelledby="recent-evidence-heading">
        <div className="section-heading">
          <div>
            <h2 id="recent-evidence-heading">Latest practice</h2>
            <p className="section-context">Recent evidence</p>
          </div>
        </div>
        {attemptsByRecency.length ? (
          <div className="progress-evidence-list">
            {attemptsByRecency.slice(0, 8).map((attempt) => (
              <div className="progress-evidence-row" key={attempt.attemptId}>
                <span>
                  <strong>{learnerActivityLabel(attempt)}</strong>
                  <small>{learnerModuleLabel(attempt.module)} · {new Date(attempt.updatedAt).toLocaleString()}</small>
                </span>
                <span>{learnerAttemptStateLabel(attempt.finalState)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><strong>No attempts yet.</strong><p>Practice results appear here after you check work in supported labs.</p></div>
        )}
      </section>
    </div>
  );
}
