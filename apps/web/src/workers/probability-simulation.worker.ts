/// <reference lib="webworker" />
import { simulateBernoulli } from '@amat19/domain-probability';
self.onmessage=(event:MessageEvent<{seed:string;probability:string;trials:number}>)=>{try{const result=simulateBernoulli({...event.data,checkpointCount:28});self.postMessage({ok:true,result:{...result,probability:result.probability.toString(),frequency:result.frequency.toString()}});}catch(error){self.postMessage({ok:false,error:error instanceof Error?error.message:'Simulation failed.'});}};
export {};
