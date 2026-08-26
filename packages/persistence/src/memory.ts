import type {
  ContentMeta,
  LabDraft,
  MasteryRecord,
  PersistedAttempt,
  PersistencePort
} from './types.ts';

export class MemoryPersistence implements PersistencePort {
  private readonly drafts = new Map<string, LabDraft>();
  private readonly attempts = new Map<string, PersistedAttempt>();
  private readonly mastery = new Map<string, MasteryRecord>();
  private readonly settings = new Map<string, unknown>();
  private contentMeta?: ContentMeta;

  async getLabDraft<T = unknown>(labId: string): Promise<LabDraft<T> | undefined> {
    return this.drafts.get(labId) as LabDraft<T> | undefined;
  }

  async saveLabDraft<T = unknown>(draft: LabDraft<T>): Promise<void> {
    this.drafts.set(draft.labId, draft as LabDraft);
  }

  async deleteLabDraft(labId: string): Promise<void> {
    this.drafts.delete(labId);
  }

  async saveAttempt<T = unknown>(attempt: PersistedAttempt<T>): Promise<void> {
    this.attempts.set(attempt.attemptId, attempt as PersistedAttempt);
  }

  async listAttempts(exerciseId?: string): Promise<PersistedAttempt[]> {
    return [...this.attempts.values()]
      .filter((attempt) => !exerciseId || attempt.exerciseId === exerciseId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getMastery(skillId: string): Promise<MasteryRecord | undefined> {
    return this.mastery.get(skillId);
  }

  async saveMastery(record: MasteryRecord): Promise<void> {
    this.mastery.set(record.skillId, record);
  }

  async getSetting<T = unknown>(key: string): Promise<T | undefined> {
    return this.settings.get(key) as T | undefined;
  }

  async setSetting<T = unknown>(key: string, value: T): Promise<void> {
    this.settings.set(key, value);
  }

  async getContentMeta(): Promise<ContentMeta | undefined> {
    return this.contentMeta;
  }

  async setContentMeta(meta: ContentMeta): Promise<void> {
    this.contentMeta = meta;
  }
}
