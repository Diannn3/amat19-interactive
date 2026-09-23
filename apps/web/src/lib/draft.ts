import { DexiePersistence } from '@amat19/persistence';

export async function loadDraft<T>(labId: string, contentVersion: string): Promise<T | undefined> {
  try {
    const db = new DexiePersistence();
    const draft = await db.getLabDraft<T>(labId);
    return draft?.contentVersion === contentVersion ? draft.state : undefined;
  } catch {
    return undefined;
  }
}

export async function saveDraft<T>(labId: string, contentVersion: string, state: T): Promise<boolean> {
  try {
    const db = new DexiePersistence();
    await db.saveLabDraft({ labId, contentVersion, updatedAt: new Date().toISOString(), state });
    return true;
  } catch {
    return false;
  }
}
