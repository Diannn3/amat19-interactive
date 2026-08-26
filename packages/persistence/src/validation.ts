import {CURRENT_SCHEMA_VERSION,type LabDraft,type LocalSnapshot,type MasteryRecord,type PersistedAttempt} from './types.ts';
const rec=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function isLabDraft(v:unknown):v is LabDraft{return rec(v)&&typeof v.labId==='string'&&typeof v.contentVersion==='string'&&typeof v.updatedAt==='string'&&'state'in v;}
export function isPersistedAttempt(v:unknown):v is PersistedAttempt{return rec(v)&&typeof v.attemptId==='string'&&typeof v.exerciseId==='string'&&typeof v.module==='string'&&typeof v.startedAt==='string'&&typeof v.updatedAt==='string'&&['correct','incomplete','abandoned','revealed'].includes(String(v.finalState))&&'payload'in v;}
export function isMasteryRecord(v:unknown):v is MasteryRecord{return rec(v)&&typeof v.skillId==='string'&&typeof v.evidenceScore==='number'&&v.evidenceScore>=0&&v.evidenceScore<=1&&Number.isInteger(v.attempts)&&Number(v.attempts)>=0&&typeof v.lastPracticed==='string';}
export function validateSnapshot(v:unknown):LocalSnapshot{
 if(!rec(v))throw new TypeError('The imported file is not an AMAT 19 local-data snapshot.');
 if(v.schemaVersion!==CURRENT_SCHEMA_VERSION)throw new RangeError(`Snapshot schema ${String(v.schemaVersion)} is not supported by schema ${CURRENT_SCHEMA_VERSION}.`);
 if(!Array.isArray(v.drafts)||!v.drafts.every(isLabDraft))throw new TypeError('Snapshot drafts are invalid.');
 if(!Array.isArray(v.attempts)||!v.attempts.every(isPersistedAttempt))throw new TypeError('Snapshot attempts are invalid.');
 if(!Array.isArray(v.mastery)||!v.mastery.every(isMasteryRecord))throw new TypeError('Snapshot mastery records are invalid.');
 if(!Array.isArray(v.settings))throw new TypeError('Snapshot settings are invalid.');
 return v as unknown as LocalSnapshot;
}
