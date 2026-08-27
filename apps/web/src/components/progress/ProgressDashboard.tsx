import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Eye } from 'lucide-react';
import { currentCourseProfile } from '@amat19/course-content';
import { DexiePersistence, type MasteryRecord, type PersistedAttempt } from '@amat19/persistence';
import { masteryLabel } from '../../lib/local-progress';
import { aggregateMasteryForCourseSkill } from '../../lib/mastery-targets';
import { Progress } from '../ui/Progress';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';

const coreSkills = currentCourseProfile.skills.filter((skill) => skill.status === 'implemented');

export default function ProgressDashboard() {
  const [records, setRecords] = useState<MasteryRecord[]>();
  const [attempts, setAttempts] = useState<PersistedAttempt[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const db = new DexiePersistence();
    Promise.all([db.listMastery(), db.listAttempts()]).then(([mastery, savedAttempts]) => {
      setRecords(mastery);
      setAttempts(savedAttempts);
    }).catch(() => setRecords([]));
  }, []);

  const byId = useMemo(() => new Map(coreSkills.flatMap((skill) => {
    const record = aggregateMasteryForCourseSkill(skill.id, records ?? []);
    return record ? [[skill.id, record] as const] : [];
  })), [records]);
  const needsAttention = useMemo(() => coreSkills.filter((skill) => masteryLabel(byId.get(skill.id)) !== 'Secure'), [byId]);
  const prioritizedSkills = needsAttention.length ? needsAttention : coreSkills;
  const visibleSkills = showAll ? coreSkills : prioritizedSkills.slice(0, 6);
  const secureCount = coreSkills.length - needsAttention.length;
  const recordedCount = coreSkills.filter((skill) => byId.has(skill.id)).length;

  if (!records) return <div className="progress-dashboard"><Skeleton className="h-32" /><Skeleton className="h-80" /></div>;

  return <div className="progress-dashboard" data-testid="progress-dashboard">
    <div className="progress-overview">
      {currentCourseProfile.modules.map((module) => {
        const skills = coreSkills.filter((skill) => skill.module === module.id);
        const values = skills.map((skill) => byId.get(skill.id)?.evidenceScore ?? 0);
        const value = values.length ? values.reduce((total, current) => total + current, 0) / values.length * 100 : 0;
        return <div className="progress-module" key={module.id}><h3>{module.title}</h3><Progress value={value} label={`${skills.filter((skill) => byId.has(skill.id)).length}/${skills.length} skills practiced`} /></div>;
      })}
    </div>

    <section className="study-panel progress-focus" data-testid="progress-attention">
      <div className="study-panel__body">
        <div className="progress-focus__header">
          <div>
            <h2>{needsAttention.length ? 'Needs attention' : 'Core skills are secure'}</h2>
            <p className="section-context">Priority queue</p>
            <p className="lede">{needsAttention.length ? `${needsAttention.length} core skill${needsAttention.length === 1 ? '' : 's'} ${needsAttention.length === 1 ? 'is' : 'are'} below Secure. Start with one weak link, then return after an independent attempt.` : 'Every current core skill has Secure evidence. Keep retrieving to maintain it.'}</p>
          </div>
          <div className="progress-focus__stats" aria-label="Progress evidence summary">
            <div><strong>{needsAttention.length}</strong><span>needs review</span></div>
            <div><strong>{secureCount}</strong><span>secure</span></div>
            <div><strong>{recordedCount}</strong><span>with evidence</span></div>
          </div>
        </div>

        {prioritizedSkills.length ? <div className="progress-skill-grid">
          {visibleSkills.map((skill) => {
            const record = byId.get(skill.id);
            const label = masteryLabel(record);
            return <a className="progress-skill progress-focus-skill" href={skill.relatedLab ?? '#'} key={skill.id}>
              <span><strong>{skill.title}</strong><small>{record ? `${record.attempts} evidence update${record.attempts === 1 ? '' : 's'} · ${record.independentSuccesses ?? 0} independent success${(record.independentSuccesses ?? 0) === 1 ? '' : 'es'}` : 'No saved practice evidence yet'}</small></span>
              <span className="progress-skill__status" data-band={label.toLowerCase()}><Badge>{label}</Badge><ArrowRight size={15} aria-hidden="true" /></span>
            </a>;
          })}
        </div> : <div className="empty-state"><strong>No current skills need attention.</strong><p>New evidence will appear here after you use a supported lab.</p></div>}

        {prioritizedSkills.length > 6 && <Button variant="secondary" type="button" onClick={() => setShowAll((current) => !current)}>{showAll ? <Eye size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}{showAll ? 'Show fewer skills' : `Show all ${coreSkills.length} core skills`}</Button>}
      </div>
    </section>

    <section className="study-panel">
      <div className="study-panel__body">
        <div className="section-heading"><div><h2>Latest practice</h2><p className="section-context">Recent evidence</p></div></div>
        {attempts.length ? <div className="saved-grid">{attempts.slice(0, 8).map((attempt) => <div className="saved-item" key={attempt.attemptId}><span><strong>{attempt.exerciseId}</strong><small>{attempt.module} · {new Date(attempt.updatedAt).toLocaleString()}</small></span><Badge>{attempt.finalState}</Badge></div>)}</div> : <div className="empty-state"><strong>No attempts yet.</strong><p>Practice results will appear here after you check work in supported labs.</p></div>}
      </div>
    </section>
  </div>;
}
