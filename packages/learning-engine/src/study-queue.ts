export type StudyQueueReason = 'repair' | 'weak' | 'review' | 'new' | 'bookmark' | 'continue';
export type StudyQueueCandidate = {
  skillId: string;
  title: string;
  href: string;
  masteryScore?: number;
  attempts?: number;
  lastPracticedAt?: string;
  recentIncorrect?: boolean;
  bookmarked?: boolean;
  resumable?: boolean;
  prerequisiteGap?: boolean;
};
export type StudyQueueItem = StudyQueueCandidate & { reason: StudyQueueReason; priority: number; rationale: string };

function ageDays(iso: string | undefined, now: Date): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now.getTime() - new Date(iso).getTime()) / 86_400_000);
}

export function buildStudyQueue(candidates: StudyQueueCandidate[], now = new Date(), limit = 8): StudyQueueItem[] {
  return candidates
    .map((candidate): StudyQueueItem => {
      const attempts = candidate.attempts ?? 0;
      const score = candidate.masteryScore ?? 0;
      const days = ageDays(candidate.lastPracticedAt, now);
      if (candidate.resumable) return { ...candidate, reason: 'continue', priority: 100, rationale: 'You already started this work.' };
      if (candidate.recentIncorrect) return { ...candidate, reason: 'repair', priority: 92, rationale: 'A recent miss makes this the best repair target.' };
      if (candidate.prerequisiteGap) return { ...candidate, reason: 'weak', priority: 84, rationale: 'A prerequisite gap is blocking later skills.' };
      if (candidate.bookmarked) return { ...candidate, reason: 'bookmark', priority: 74, rationale: 'You saved this for another pass.' };
      if (attempts === 0) return { ...candidate, reason: 'new', priority: 58, rationale: 'This skill has no saved practice evidence yet.' };
      if (score < 0.62) return { ...candidate, reason: 'weak', priority: 70 + Math.min(12, days), rationale: 'Your saved evidence is still developing.' };
      return { ...candidate, reason: 'review', priority: 35 + Math.min(25, days * 1.5), rationale: days > 5 ? 'Enough time has passed for retrieval practice.' : 'A short review keeps this skill available.' };
    })
    .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title))
    .slice(0, limit);
}
