import type { CheckResult } from './contracts.ts';
export type MasteryBand='new'|'developing'|'secure';
export function masteryBand(score:number,attempts:number):MasteryBand{if(attempts===0)return'new';if(attempts>=3&&score>=.78)return'secure';return'developing';}
export function updateMastery(input:{previousScore:number;previousAttempts:number;checks:CheckResult[];hintsUsed:number;revealed:boolean}){
  const accuracy=input.checks.length?input.checks.filter(c=>c.ok).length/input.checks.length:0;
  const current=Math.max(0,Math.min(1,accuracy-Math.min(.25,input.hintsUsed*.05)-(input.revealed?.25:0)));
  const weight=Math.min(input.previousAttempts,4),evidenceScore=(input.previousScore*weight+current)/(weight+1),attempts=input.previousAttempts+1;
  return{evidenceScore,attempts,band:masteryBand(evidenceScore,attempts)};
}

/** Merge one normalized evidence score into the transparent rolling mastery record. */
export function mergeMasteryEvidence(previousScore: number, previousAttempts: number, evidence: number) {
  const normalized = Math.max(0, Math.min(1, evidence));
  const weight = Math.min(previousAttempts, 4);
  const evidenceScore = (previousScore * weight + normalized) / (weight + 1);
  const attempts = previousAttempts + 1;
  return { evidenceScore, attempts, band: masteryBand(evidenceScore, attempts) };
}
