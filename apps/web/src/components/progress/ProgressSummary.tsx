import { useEffect, useState } from 'react';
import { currentCourseProfile } from '@amat19/course-content';
import { DexiePersistence, type MasteryRecord } from '@amat19/persistence';
import { masteryLabel } from '../../lib/local-progress';
import { aggregateMasteryForCourseSkill } from '../../lib/mastery-targets';

export default function ProgressSummary() {
  const [records, setRecords] = useState<MasteryRecord[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  useEffect(() => {
    try {
      const db = new DexiePersistence();
      db.listMastery().then((items) => {
        setRecords(items);
        setStatus('ready');
      }).catch(() => setStatus('unavailable'));
    } catch {
      setStatus('unavailable');
    }
  }, []);

  if (status === 'loading') return <p role="status">Loading local progress…</p>;
  if (status === 'unavailable') return <p role="status">Local progress is unavailable in this browser context.</p>;

  return (
    <div className="progress-list" data-testid="progress-summary">
      {currentCourseProfile.skills
        .filter((skill) => skill.status === 'implemented' || skill.status === 'engine-ready')
        .map((skill) => {
          const record = aggregateMasteryForCourseSkill(skill.id, records);
          const label = masteryLabel(record);
          return (
            <a className="progress-row" href={skill.relatedLab ?? '#'} key={skill.id}>
              <span>
                <strong>{skill.title}</strong>
                <small>{skill.description}</small>
              </span>
              <span className="progress-row__meta">
                <span className="status-pill">{label}</span>
                <small>{record ? `${record.attempts} saved practice attempt${record.attempts === 1 ? '' : 's'}` : 'No saved evidence yet'}</small>
              </span>
            </a>
          );
        })}
    </div>
  );
}
