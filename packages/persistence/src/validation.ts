import {CURRENT_SCHEMA_VERSION,type LabDraft,type LocalSnapshot,type MasteryRecord,type PersistedAttempt,type PersistedSession,type SavedItem} from './types.ts';
const rec=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function isLabDraft(v:unknown):v is LabDraft{return rec(v)&&typeof v.labId==='string'&&typeof v.contentVersion==='string'&&typeof v.updatedAt==='string'&&'state'in v;}
export function isPersistedAttempt(v:unknown):v is PersistedAttempt{return rec(v)&&typeof v.attemptId==='string'&&typeof v.exerciseId==='string'&&typeof v.module==='string'&&typeof v.startedAt==='string'&&typeof v.updatedAt==='string'&&['correct','incomplete','abandoned','revealed'].includes(String(v.finalState))&&'payload'in v;}
export function isMasteryRecord(v:unknown):v is MasteryRecord{return rec(v)&&typeof v.skillId==='string'&&typeof v.evidenceScore==='number'&&v.evidenceScore>=0&&v.evidenceScore<=1&&Number.isInteger(v.attempts)&&Number(v.attempts)>=0&&typeof v.lastPracticed==='string';}
export function isPersistedSession(v:unknown):v is PersistedSession{return rec(v)&&typeof v.sessionId==='string'&&typeof v.exerciseId==='string'&&typeof v.module==='string'&&Array.isArray(v.skillIds)&&v.skillIds.every(x=>typeof x==='string')&&typeof v.startedAt==='string'&&typeof v.updatedAt==='string'&&['active','completed','abandoned','revealed'].includes(String(v.outcome))&&'payload'in v;}
export function isSavedItem(v:unknown):v is SavedItem{return rec(v)&&typeof v.id==='string'&&['lesson','exercise','custom-problem','bookmark'].includes(String(v.kind))&&typeof v.title==='string'&&typeof v.createdAt==='string'&&typeof v.updatedAt==='string'&&'payload'in v;}
function migrateV2(v:Record<string,unknown>):LocalSnapshot{return{
 exportedAt:typeof v.exportedAt==='string'?v.exportedAt:new Date().toISOString(),schemaVersion:CURRENT_SCHEMA_VERSION,
 drafts:Array.isArray(v.drafts)?v.drafts as LabDraft[]:[],attempts:Array.isArray(v.attempts)?v.attempts as PersistedAttempt[]:[],mastery:Array.isArray(v.mastery)?v.mastery as MasteryRecord[]:[],settings:Array.isArray(v.settings)?v.settings as LocalSnapshot['settings']:[],sessions:[],savedItems:[],contentMeta:rec(v.contentMeta)?v.contentMeta as LocalSnapshot['contentMeta']:undefined
};}
export function validateSnapshot(v:unknown):LocalSnapshot{
 if(!rec(v))throw new TypeError('The imported file is not an AMAT 19 local-data snapshot.');
 const candidate=v.schemaVersion===2?migrateV2(v):v as unknown as LocalSnapshot;
 if(candidate.schemaVersion!==CURRENT_SCHEMA_VERSION)throw new RangeError(`Snapshot schema ${String(v.schemaVersion)} is not supported by schema ${CURRENT_SCHEMA_VERSION}.`);
 if(!Array.isArray(candidate.drafts)||!candidate.drafts.every(isLabDraft))throw new TypeError('Snapshot drafts are invalid.');
 if(!Array.isArray(candidate.attempts)||!candidate.attempts.every(isPersistedAttempt))throw new TypeError('Snapshot attempts are invalid.');
 if(!Array.isArray(candidate.mastery)||!candidate.mastery.every(isMasteryRecord))throw new TypeError('Snapshot mastery records are invalid.');
 if(!Array.isArray(candidate.settings))throw new TypeError('Snapshot settings are invalid.');
 if(!Array.isArray(candidate.sessions)||!candidate.sessions.every(isPersistedSession))throw new TypeError('Snapshot sessions are invalid.');
 if(!Array.isArray(candidate.savedItems)||!candidate.savedItems.every(isSavedItem))throw new TypeError('Snapshot saved items are invalid.');
 return candidate;
}
