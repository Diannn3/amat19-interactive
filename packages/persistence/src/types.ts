export type LabDraft<T = unknown> = {
  labId: string;
  contentVersion: string;
  updatedAt: string;
  state: T;
};

export type LocalSetting = {
  key: string;
  value: unknown;
  updatedAt: string;
};

export type PersistedAttempt<T = unknown> = {
  attemptId: string;
  exerciseId: string;
  module: string;
  startedAt: string;
  updatedAt: string;
  finalState: 'correct' | 'incomplete' | 'abandoned' | 'revealed';
  payload: T;
};

export type MasteryRecord = {
  skillId: string;
  evidenceScore: number;
  attempts: number;
  lastPracticed: string;
};

export type ContentMeta = {
  id: 'current';
  courseVersion: string;
  schemaVersion: number;
  updatedAt: string;
};

export interface PersistencePort {
  getLabDraft<T = unknown>(labId: string): Promise<LabDraft<T> | undefined>;
  saveLabDraft<T = unknown>(draft: LabDraft<T>): Promise<void>;
  deleteLabDraft(labId: string): Promise<void>;

  saveAttempt<T = unknown>(attempt: PersistedAttempt<T>): Promise<void>;
  listAttempts(exerciseId?: string): Promise<PersistedAttempt[]>;

  getMastery(skillId: string): Promise<MasteryRecord | undefined>;
  saveMastery(record: MasteryRecord): Promise<void>;

  getSetting<T = unknown>(key: string): Promise<T | undefined>;
  setSetting<T = unknown>(key: string, value: T, updatedAt: string): Promise<void>;

  getContentMeta(): Promise<ContentMeta | undefined>;
  setContentMeta(meta: ContentMeta): Promise<void>;
}
