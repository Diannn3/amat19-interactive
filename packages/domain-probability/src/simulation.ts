import { createSeededUint32, Rational, UINT32_RANGE, type RationalLike, type SeededUint32 } from '@amat19/math-core';
export const MAX_SIMULATION_TRIALS=1_000_000;
export type SimulationCheckpoint={trials:number;successes:number;frequency:number};
export type BernoulliSimulation={seed:string;probability:Rational;trials:number;successes:number;frequency:Rational;checkpoints:SimulationCheckpoint[]};

export function validateSimulationTrials(trials:number):number{if(!Number.isInteger(trials)||trials<1||trials>MAX_SIMULATION_TRIALS)throw new RangeError(`Trials must be an integer from 1 to ${MAX_SIMULATION_TRIALS.toLocaleString('en-US')}.`);return trials;}
export function bernoulliUint32Threshold(probability:RationalLike):number{
 const p=Rational.from(probability);if(!p.isProbability())throw new RangeError('Simulation probability must lie between 0 and 1.');
 return Number((p.numerator*BigInt(UINT32_RANGE))/p.denominator);
}
export function advanceBernoulliTrials(input:{randomUint32:SeededUint32;threshold:number;trials:number;successes?:number}):number{
 if(!Number.isInteger(input.threshold)||input.threshold<0||input.threshold>UINT32_RANGE)throw new RangeError('Bernoulli threshold must lie on the uint32 probability grid.');
 if(!Number.isInteger(input.trials)||input.trials<0)throw new RangeError('Batch trial count must be a nonnegative integer.');
 let successes=input.successes??0;if(!Number.isInteger(successes)||successes<0)throw new RangeError('Success count must be a nonnegative integer.');
 for(let index=0;index<input.trials;index+=1)if(input.randomUint32()<input.threshold)successes+=1;return successes;
}
/** Deterministic seeded Bernoulli simulation. Empirical frequency is evidence, never a proof of probability. */
export function simulateBernoulli(input:{seed:string;probability:RationalLike;trials:number;checkpointCount?:number}):BernoulliSimulation{
 const p=Rational.from(input.probability);if(!p.isProbability())throw new RangeError('Simulation probability must lie between 0 and 1.');const trials=validateSimulationTrials(input.trials);
 const checkpointCount=Math.max(1,Math.min(100,Math.floor(input.checkpointCount??24))),stride=Math.max(1,Math.floor(trials/checkpointCount));
 const randomUint32=createSeededUint32(input.seed),threshold=bernoulliUint32Threshold(p);let successes=0,processed=0;const checkpoints:SimulationCheckpoint[]=[];
 while(processed<trials){const next=Math.min(trials,processed+stride),batch=next-processed;successes=advanceBernoulliTrials({randomUint32,threshold,trials:batch,successes});processed=next;checkpoints.push({trials:processed,successes,frequency:successes/processed});}
 return{seed:input.seed,probability:p,trials,successes,frequency:new Rational(successes,trials),checkpoints};
}
