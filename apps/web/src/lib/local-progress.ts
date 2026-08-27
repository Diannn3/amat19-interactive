import { mergeMasteryEvidence, masteryBand, type LearningSession } from '@amat19/learning-engine';
import { DexiePersistence, type MasteryRecord, type PersistedAttempt, type SavedItem } from '@amat19/persistence';
import { canonicalSkillId, canonicalizeSkillIds } from './mastery-targets.ts';

type EvidenceInput={independent?:boolean;assisted?:boolean;hintsUsed?:number;revealed?:boolean};

function mergeEvidenceRecord(previous:Readonly<MasteryRecord>|undefined,skillId:string,score:number,input:EvidenceInput|undefined,now:string):MasteryRecord{
  const independent=Boolean(input?.independent);
  const next=mergeMasteryEvidence(previous?.evidenceScore??0,previous?.attempts??0,score,previous?.independentSuccesses??0,independent);
  const assisted=input?.assisted??(!independent&&score>0);
  return{
    skillId,
    evidenceScore:next.evidenceScore,
    attempts:next.attempts,
    independentSuccesses:next.independentSuccesses,
    assistedSuccesses:(previous?.assistedSuccesses??0)+(assisted?1:0),
    hintsUsed:(previous?.hintsUsed??0)+(input?.hintsUsed??0),
    revealsUsed:(previous?.revealsUsed??0)+(input?.revealed?1:0),
    streak:independent?(previous?.streak??0)+1:0,
    lastPracticed:now,
  };
}

export async function recordSkillEvidence(skillId:string,score:number,input?:EvidenceInput):Promise<MasteryRecord>{
  const db=new DexiePersistence();
  const now=new Date().toISOString();
  const targetId=canonicalSkillId(skillId);
  return db.updateMastery(targetId,(previous)=>mergeEvidenceRecord(previous,targetId,score,input,now));
}

export function masteryLabel(record?:Pick<MasteryRecord,'evidenceScore'|'attempts'|'independentSuccesses'>):'New'|'Learning'|'Developing'|'Secure'{
  const band=masteryBand(record?.evidenceScore??0,record?.attempts??0,record?.independentSuccesses??0);
  return band==='new'?'New':band==='learning'?'Learning':band==='developing'?'Developing':'Secure';
}

function attemptId(prefix:string):string{
  if(typeof crypto!=='undefined'&&'randomUUID'in crypto)return`${prefix}-${crypto.randomUUID()}`;
  return`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
}

export async function recordAttempt<T>(input:{
  prefix:string;
  exerciseId:string;
  module:string;
  finalState:PersistedAttempt['finalState'];
  payload:T;
  startedAt?:string;
  skillIds?:string[];
  difficulty?:'intro'|'standard'|'challenge';
}):Promise<void>{
  const now=new Date().toISOString();
  const db=new DexiePersistence();
  await db.saveAttempt({attemptId:attemptId(input.prefix),exerciseId:input.exerciseId,module:input.module,startedAt:input.startedAt??now,updatedAt:now,finalState:input.finalState,payload:input.payload,skillIds:canonicalizeSkillIds(input.skillIds),difficulty:input.difficulty});
}

export async function persistLearningSession(session:LearningSession,payload:Record<string,unknown>={}):Promise<void>{
  const db=new DexiePersistence();
  await db.saveSession({sessionId:session.sessionId,exerciseId:session.exerciseId,module:session.module,skillIds:canonicalizeSkillIds(session.skillIds)??[],startedAt:session.startedAt,updatedAt:session.updatedAt,outcome:session.outcome,payload:{...payload,session}});
}

export async function toggleSavedItem(input:{id:string;kind:SavedItem['kind'];title:string;href?:string;module?:string;skillIds?:string[];payload?:unknown}):Promise<boolean>{
  const db=new DexiePersistence();
  const existing=await db.getSavedItem(input.id);
  if(existing){await db.deleteSavedItem(input.id);return false;}
  const now=new Date().toISOString();
  await db.saveItem({id:input.id,kind:input.kind,title:input.title,href:input.href,module:input.module,skillIds:canonicalizeSkillIds(input.skillIds),createdAt:now,updatedAt:now,payload:input.payload??{}});
  return true;
}
