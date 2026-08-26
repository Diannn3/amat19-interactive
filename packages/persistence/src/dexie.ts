import Dexie, { type EntityTable } from 'dexie';
import type {
  ContentMeta,
  LabDraft,
  LocalSetting,
  MasteryRecord,
  PersistedAttempt,
  PersistencePort
} from './types.ts';

const DB_NAME = 'amat19-local';

class AmatDatabase extends Dexie {
  labDrafts!: EntityTable<LabDraft, 'labId'>;
  attempts!: EntityTable<PersistedAttempt, 'attemptId'>;
  mastery!: EntityTable<MasteryRecord, 'skillId'>;
  settings!: EntityTable<LocalSetting, 'key'>;
  contentMeta!: EntityTable<ContentMeta, 'id'>;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      labDrafts: 'labId, updatedAt, contentVersion',
      attempts: 'attemptId, exerciseId, module, updatedAt, finalState',
      mastery: 'skillId, lastPracticed',
      settings: 'key, updatedAt',
      contentMeta: 'id, courseVersion, schemaVersion, updatedAt'
    });
  }
}

export class DexiePersistence implements PersistencePort {
  private readonly db = new AmatDatabase();

  async getLabDraft<T = unknown>(labId: string): Promise<LabDraft<T> | undefined> {
    return (await this.db.labDrafts.get(labId)) as LabDraft<T> | undefined;
  }

  async saveLabDraft<T = unknown>(draft: LabDraft<T>): Promise<void> {
    await this.db.labDrafts.put(draft as LabDraft);
  }

  async deleteLabDraft(labId: string): Promise<void> {
    await this.db.labDrafts.delete(labId);
  }

  async saveAttempt<T = unknown>(attempt: PersistedAttempt<T>): Promise<void> {
    await this.db.attempts.put(attempt as PersistedAttempt);
  }

  async listAttempts(exerciseId?: string): Promise<PersistedAttempt[]> {
    if (exerciseId) {
      return this.db.attempts.where('exerciseId').equals(exerciseId).reverse().sortBy('updatedAt');
    }
    return this.db.attempts.orderBy('updatedAt').reverse().toArray();
  }

  async getMastery(skillId: string): Promise<MasteryRecord | undefined> {
    return this.db.mastery.get(skillId);
  }

  async saveMastery(record: MasteryRecord): Promise<void> {
    await this.db.mastery.put(record);
  }

  async getSetting<T = unknown>(key: string): Promise<T | undefined> {
    const setting = await this.db.settings.get(key);
    return setting?.value as T | undefined;
  }

  async setSetting<T = unknown>(key: string, value: T, updatedAt: string): Promise<void> {
    await this.db.settings.put({ key, value, updatedAt });
  }

  async getContentMeta(): Promise<ContentMeta | undefined> {
    return this.db.contentMeta.get('current');
  }

  async setContentMeta(meta: ContentMeta): Promise<void> {
    await this.db.contentMeta.put(meta);
  }
}
