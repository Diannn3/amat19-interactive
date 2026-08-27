import {CURRENT_SCHEMA_VERSION,type ContentMeta,type LabDraft,type LocalSetting,type LocalSnapshot,type MasteryRecord,type PersistedAttempt,type PersistedSession,type SavedItem} from './types.ts';

const MAX_COLLECTION_ITEMS=100_000;
const rec=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const str=(v:unknown):v is string=>typeof v==='string'&&v.length>0;
const stringArray=(v:unknown):v is string[]=>Array.isArray(v)&&v.every(str);
const nonnegativeInteger=(v:unknown)=>Number.isInteger(v)&&Number(v)>=0;
const optionalNonnegativeInteger=(v:unknown)=>v===undefined||nonnegativeInteger(v);
const boundedArray=(v:unknown):v is unknown[]=>Array.isArray(v)&&v.length<=MAX_COLLECTION_ITEMS;

export function isLabDraft(v:unknown):v is LabDraft{return rec(v)&&str(v.labId)&&str(v.contentVersion)&&str(v.updatedAt)&&'state'in v;}
export function isPersistedAttempt(v:unknown):v is PersistedAttempt{return rec(v)&&str(v.attemptId)&&str(v.exerciseId)&&str(v.module)&&str(v.startedAt)&&str(v.updatedAt)&&['correct','incomplete','abandoned','revealed'].includes(String(v.finalState))&&'payload'in v&&(v.skillIds===undefined||stringArray(v.skillIds))&&(v.difficulty===undefined||['intro','standard','challenge'].includes(String(v.difficulty)));}
export function isMasteryRecord(v:unknown):v is MasteryRecord{return rec(v)&&str(v.skillId)&&typeof v.evidenceScore==='number'&&Number.isFinite(v.evidenceScore)&&v.evidenceScore>=0&&v.evidenceScore<=1&&nonnegativeInteger(v.attempts)&&str(v.lastPracticed)&&optionalNonnegativeInteger(v.independentSuccesses)&&optionalNonnegativeInteger(v.assistedSuccesses)&&optionalNonnegativeInteger(v.hintsUsed)&&optionalNonnegativeInteger(v.revealsUsed)&&optionalNonnegativeInteger(v.streak);}
export function isPersistedSession(v:unknown):v is PersistedSession{return rec(v)&&str(v.sessionId)&&str(v.exerciseId)&&str(v.module)&&stringArray(v.skillIds)&&str(v.startedAt)&&str(v.updatedAt)&&['active','completed','abandoned','revealed'].includes(String(v.outcome))&&'payload'in v;}
export function isSavedItem(v:unknown):v is SavedItem{return rec(v)&&str(v.id)&&['lesson','exercise','custom-problem','bookmark'].includes(String(v.kind))&&str(v.title)&&str(v.createdAt)&&str(v.updatedAt)&&'payload'in v&&(v.href===undefined||str(v.href))&&(v.module===undefined||str(v.module))&&(v.skillIds===undefined||stringArray(v.skillIds));}
export function isLocalSetting(v:unknown):v is LocalSetting{return rec(v)&&str(v.key)&&str(v.updatedAt)&&'value'in v;}
export function isContentMeta(v:unknown):v is ContentMeta{return rec(v)&&v.id==='current'&&str(v.courseVersion)&&Number.isInteger(v.schemaVersion)&&Number(v.schemaVersion)>0&&str(v.updatedAt);}

function migrateV2(v:Record<string,unknown>):LocalSnapshot{return{
 exportedAt:str(v.exportedAt)?v.exportedAt:new Date().toISOString(),schemaVersion:CURRENT_SCHEMA_VERSION,
 drafts:Array.isArray(v.drafts)?v.drafts as LabDraft[]:[],attempts:Array.isArray(v.attempts)?v.attempts as PersistedAttempt[]:[],mastery:Array.isArray(v.mastery)?v.mastery as MasteryRecord[]:[],settings:Array.isArray(v.settings)?v.settings as LocalSetting[]:[],sessions:[],savedItems:[],contentMeta:rec(v.contentMeta)?v.contentMeta as ContentMeta:undefined
};}

function validateCollection(name:string,value:unknown,predicate:(item:unknown)=>boolean):void{
 if(!boundedArray(value))throw new TypeError(`Snapshot ${name} are invalid or exceed the ${MAX_COLLECTION_ITEMS.toLocaleString()} item safety limit.`);
 if(!value.every(predicate))throw new TypeError(`Snapshot ${name} are invalid.`);
}

export function validateSnapshot(v:unknown):LocalSnapshot{
 if(!rec(v))throw new TypeError('The imported file is not an AMAT 19 local-data snapshot.');
 const candidate=v.schemaVersion===2?migrateV2(v):v as unknown as LocalSnapshot;
 if(candidate.schemaVersion!==CURRENT_SCHEMA_VERSION)throw new RangeError(`Snapshot schema ${String(v.schemaVersion)} is not supported by schema ${CURRENT_SCHEMA_VERSION}.`);
 if(!str(candidate.exportedAt))throw new TypeError('Snapshot export timestamp is invalid.');
 validateCollection('drafts',candidate.drafts,isLabDraft);
 validateCollection('attempts',candidate.attempts,isPersistedAttempt);
 validateCollection('mastery records',candidate.mastery,isMasteryRecord);
 validateCollection('settings',candidate.settings,isLocalSetting);
 validateCollection('sessions',candidate.sessions,isPersistedSession);
 validateCollection('saved items',candidate.savedItems,isSavedItem);
 if(candidate.contentMeta!==undefined&&!isContentMeta(candidate.contentMeta))throw new TypeError('Snapshot content metadata is invalid.');
 return candidate;
}
