import { mergeMasteryEvidence, masteryBand, normalizeAssessmentResult, payloadRepresentsIndependentSuccess, suppressRepeatedIndependentEvidence, type AssessmentResultInput, type LearningSession } from '@amat19/learning-engine';
import { DexiePersistence, type MasteryRecord, type PersistedAttempt, type SavedItem } from '@amat19/persistence';
import { canonicalLeafSkillId, canonicalSkillId, canonicalizeSkillIds } from './mastery-targets.ts';

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

export function createAttemptId(prefix:string):string{
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
  attemptId?:string;
  skillIds?:string[];
  difficulty?:'intro'|'standard'|'challenge';
}):Promise<void>{
  const now=new Date().toISOString();
  const db=new DexiePersistence();
  await db.saveAttempt({attemptId:input.attemptId??createAttemptId(input.prefix),exerciseId:input.exerciseId,module:input.module,startedAt:input.startedAt??now,updatedAt:now,finalState:input.finalState,payload:input.payload,skillIds:canonicalizeSkillIds(input.skillIds),difficulty:input.difficulty});
}

export async function recordAssessmentResult<T>(input: AssessmentResultInput & {
  prefix: string;
  payload: T;
  startedAt?: string;
  attemptId?: string;
}): Promise<void> {
  const skillId = canonicalLeafSkillId(input.skillId);
  const baseNormalized = normalizeAssessmentResult({ ...input, skillId });
  const db = new DexiePersistence();
  const now = new Date().toISOString();
  const attemptId = input.attemptId ?? createAttemptId(input.prefix);
  const startedAt = input.startedAt ?? now;
  const normalizedFor = (hasPriorMatch:boolean) => suppressRepeatedIndependentEvidence(baseNormalized, hasPriorMatch);

  await db.commitAttemptAndMastery({
    exerciseId: input.exerciseId,
    skillId,
    priorAttemptMatches: (attempt) => Boolean(baseNormalized.evidence?.independent)
      && Boolean(attempt.skillIds?.includes(skillId))
      && payloadRepresentsIndependentSuccess(attempt.payload, input.problemFingerprint),
    buildAttempt: (hasPriorMatch) => {
      const normalized = normalizedFor(hasPriorMatch);
      return {
        attemptId,
        exerciseId: input.exerciseId,
        module: input.module,
        startedAt,
        updatedAt: now,
        finalState: normalized.finalState,
        payload: {
          problemFingerprint: input.problemFingerprint,
          assessment: {
            result: input.result,
            firstAttemptCorrect: input.firstAttemptCorrect,
            incorrectAttempts: input.incorrectAttempts,
            hintsUsed: input.hintsUsed,
            revealsUsed: input.revealsUsed,
          },
          repeatIndependentSuppressed: hasPriorMatch,
          data: input.payload,
        },
        skillIds: [skillId],
        difficulty: input.difficulty,
      };
    },
    updateMastery: baseNormalized.evidence ? (previous, hasPriorMatch) => {
      const evidence = normalizedFor(hasPriorMatch).evidence!;
      return mergeEvidenceRecord(previous, skillId, evidence.score, {
        independent: evidence.independent,
        assisted: evidence.assisted,
        hintsUsed: evidence.hintsUsed,
        revealed: evidence.revealed,
      }, now);
    } : undefined,
  });
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
