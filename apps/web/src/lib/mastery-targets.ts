import { currentCourseProfile, getSkillNode, skillGraph } from '@amat19/course-content';
import type { MasteryRecord } from '@amat19/persistence';

const LEGACY_SKILL_ALIASES: Readonly<Record<string, string>> = {
  'games.saddle': 'applications.game.security',
};

export function canonicalSkillId(skillId: string): string {
  return LEGACY_SKILL_ALIASES[skillId] ?? skillId;
}

export function canonicalizeSkillIds(skillIds: readonly string[] | undefined): string[] | undefined {
  if (!skillIds) return undefined;
  return [...new Set(skillIds.map(canonicalSkillId))];
}

export function masteryHierarchyIds(skillId: string): string[] {
  const canonical = canonicalSkillId(skillId);
  const leaf = getSkillNode(canonical);
  return leaf?.parentId ? [canonical, leaf.parentId] : [canonical];
}

export function moduleForSkill(skillId: string) {
  const canonical = canonicalSkillId(skillId);
  return getSkillNode(canonical)?.module ?? currentCourseProfile.skills.find((skill) => skill.id === canonical)?.module;
}

function combineMasteryRecords(skillId:string,records:ReadonlyArray<Readonly<MasteryRecord>>):MasteryRecord|undefined{
  if(!records.length)return undefined;
  const attempts=records.reduce((sum,record)=>sum+record.attempts,0);
  const denominator=records.reduce((sum,record)=>sum+Math.max(record.attempts,1),0);
  const evidenceScore=denominator?records.reduce((sum,record)=>sum+record.evidenceScore*Math.max(record.attempts,1),0)/denominator:0;
  const latest=[...records].sort((a,b)=>b.lastPracticed.localeCompare(a.lastPracticed))[0]!;
  return{
    skillId,
    evidenceScore,
    attempts,
    independentSuccesses:records.reduce((sum,record)=>sum+(record.independentSuccesses??0),0),
    assistedSuccesses:records.reduce((sum,record)=>sum+(record.assistedSuccesses??0),0),
    hintsUsed:records.reduce((sum,record)=>sum+(record.hintsUsed??0),0),
    revealsUsed:records.reduce((sum,record)=>sum+(record.revealsUsed??0),0),
    streak:latest.streak??0,
    lastPracticed:latest.lastPracticed,
  };
}

export function canonicalMasteryMap(records:ReadonlyArray<Readonly<MasteryRecord>>):Map<string,MasteryRecord>{
  const groups=new Map<string,MasteryRecord[]>();
  for(const record of records){const id=canonicalSkillId(record.skillId);const group=groups.get(id)??[];group.push({...record,skillId:id});groups.set(id,group);}
  return new Map([...groups].map(([id,group])=>[id,combineMasteryRecords(id,group)!]));
}

/**
 * Derive a broad course-skill record from direct evidence plus any leaf records under it.
 * Evidence is not duplicated in storage; this view lets Progress understand older leaf-only data.
 */
export function aggregateMasteryForCourseSkill(skillId:string,records:ReadonlyArray<Readonly<MasteryRecord>>):MasteryRecord|undefined{
  const canonical=canonicalSkillId(skillId);
  const byId=canonicalMasteryMap(records);
  const related=[byId.get(canonical),...skillGraph.filter(skill=>skill.parentId===canonical).map(skill=>byId.get(skill.id))].filter((record):record is MasteryRecord=>Boolean(record));
  return combineMasteryRecords(canonical,related);
}
