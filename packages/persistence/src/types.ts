export const CURRENT_SCHEMA_VERSION=3;
export type LabDraft<T=unknown>={labId:string;contentVersion:string;updatedAt:string;state:T;};
export type LocalSetting={key:string;value:unknown;updatedAt:string;};
export type PersistedAttempt<T=unknown>={attemptId:string;exerciseId:string;module:string;startedAt:string;updatedAt:string;finalState:'correct'|'incomplete'|'abandoned'|'revealed';payload:T;skillIds?:string[];difficulty?:'intro'|'standard'|'challenge';};
export type MasteryRecord={
 skillId:string;evidenceScore:number;attempts:number;lastPracticed:string;
 independentSuccesses?:number;assistedSuccesses?:number;hintsUsed?:number;revealsUsed?:number;streak?:number;
};
export type PersistedSession<T=unknown>={
 sessionId:string;exerciseId:string;module:string;skillIds:string[];startedAt:string;updatedAt:string;
 outcome:'active'|'completed'|'abandoned'|'revealed';payload:T;
};
export type SavedItem<T=unknown>={
 id:string;kind:'lesson'|'exercise'|'custom-problem'|'bookmark';title:string;href?:string;module?:string;skillIds?:string[];createdAt:string;updatedAt:string;payload:T;
};
export type ContentMeta={id:'current';courseVersion:string;schemaVersion:number;updatedAt:string;};
export type LocalSnapshot={
 exportedAt:string;schemaVersion:number;drafts:LabDraft[];attempts:PersistedAttempt[];mastery:MasteryRecord[];settings:LocalSetting[];
 sessions:PersistedSession[];savedItems:SavedItem[];contentMeta?:ContentMeta;
};
export interface PersistencePort{
 getLabDraft<T=unknown>(labId:string):Promise<LabDraft<T>|undefined>;listLabDrafts():Promise<LabDraft[]>;saveLabDraft<T=unknown>(draft:LabDraft<T>):Promise<void>;deleteLabDraft(labId:string):Promise<void>;
 saveAttempt<T=unknown>(attempt:PersistedAttempt<T>):Promise<void>;listAttempts(exerciseId?:string):Promise<PersistedAttempt[]>;
 getMastery(skillId:string):Promise<MasteryRecord|undefined>;listMastery():Promise<MasteryRecord[]>;saveMastery(record:MasteryRecord):Promise<void>;
 getSession<T=unknown>(sessionId:string):Promise<PersistedSession<T>|undefined>;listSessions():Promise<PersistedSession[]>;saveSession<T=unknown>(session:PersistedSession<T>):Promise<void>;deleteSession(sessionId:string):Promise<void>;
 getSavedItem<T=unknown>(id:string):Promise<SavedItem<T>|undefined>;listSavedItems(kind?:SavedItem['kind']):Promise<SavedItem[]>;saveItem<T=unknown>(item:SavedItem<T>):Promise<void>;deleteSavedItem(id:string):Promise<void>;
 getSetting<T=unknown>(key:string):Promise<T|undefined>;listSettings():Promise<LocalSetting[]>;setSetting<T=unknown>(key:string,value:T,updatedAt:string):Promise<void>;
 getContentMeta():Promise<ContentMeta|undefined>;setContentMeta(meta:ContentMeta):Promise<void>;
 exportSnapshot(now:string):Promise<LocalSnapshot>;importSnapshot(snapshot:LocalSnapshot|unknown):Promise<void>;clearAll():Promise<void>;
}
