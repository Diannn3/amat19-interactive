import type { LocalSnapshot, SnapshotScope } from './types.ts';

export function projectSnapshotForScope(snapshot: LocalSnapshot, scope: SnapshotScope): LocalSnapshot {
  if (scope === 'full') return { ...snapshot, snapshotScope: 'full' };
  if (scope === 'progress') return { ...snapshot, snapshotScope: 'progress', drafts: [], settings: [], sessions: [], savedItems: [], contentMeta: undefined };
  return { ...snapshot, snapshotScope: 'saved', drafts: [], attempts: [], mastery: [], settings: [], sessions: [], contentMeta: undefined };
}

/** Merge a validated scoped backup into current local state without deleting collections the backup never contained. */
export function mergeScopedSnapshot(current: LocalSnapshot, incoming: LocalSnapshot): LocalSnapshot {
  const scope = incoming.snapshotScope ?? 'full';
  if (scope === 'full') return { ...incoming, snapshotScope: 'full' };
  if (scope === 'progress') {
    return {
      ...current,
      exportedAt: incoming.exportedAt,
      schemaVersion: incoming.schemaVersion,
      snapshotScope: 'full',
      attempts: incoming.attempts,
      mastery: incoming.mastery,
      contentMeta: current.contentMeta,
    };
  }
  return {
    ...current,
    exportedAt: incoming.exportedAt,
    schemaVersion: incoming.schemaVersion,
    snapshotScope: 'full',
    savedItems: incoming.savedItems,
    contentMeta: current.contentMeta,
  };
}
