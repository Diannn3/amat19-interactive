import { createSeededRandom, Rational, type RationalLike } from '@amat19/math-core';
export type SimulationCheckpoint={trials:number;successes:number;frequency:number};
export type BernoulliSimulation={seed:string;probability:Rational;trials:number;successes:number;frequency:Rational;checkpoints:SimulationCheckpoint[]};
/** Deterministic seeded Bernoulli simulation. Empirical frequency is evidence, never a proof of probability. */
export function simulateBernoulli(input:{seed:string;probability:RationalLike;trials:number;checkpointCount?:number}):BernoulliSimulation{
 const p=Rational.from(input.probability);if(!p.isProbability())throw new RangeError('Simulation probability must lie between 0 and 1.');
 if(!Number.isInteger(input.trials)||input.trials<1||input.trials>1_000_000)throw new RangeError('Trials must be an integer from 1 to 1,000,000.');
 const checkpointCount=Math.max(1,Math.min(100,Math.floor(input.checkpointCount??24))),stride=Math.max(1,Math.floor(input.trials/checkpointCount));
 const random=createSeededRandom(input.seed);let successes=0;const checkpoints:SimulationCheckpoint[]=[];const threshold=p.toNumber();
 for(let trial=1;trial<=input.trials;trial+=1){if(random()<threshold)successes+=1;if(trial%stride===0||trial===input.trials)checkpoints.push({trials:trial,successes,frequency:successes/trial});}
 return{seed:input.seed,probability:p,trials:input.trials,successes,frequency:new Rational(successes,input.trials),checkpoints};
}
