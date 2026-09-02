import { Rational, sumRationals, type RationalLike } from '@amat19/math-core';
import { matrix, multiplyMatrices, shape, type Matrix } from './matrix.ts';

declare const transitionMatrixBrand: unique symbol;
declare const probabilityVectorBrand: unique symbol;
export type TransitionMatrix=Matrix&{readonly [transitionMatrixBrand]:true};
export type ProbabilityVector=Rational[]&{readonly [probabilityVectorBrand]:true};
export const MAX_MARKOV_STEPS=10_000;

export function transitionMatrix(values:RationalLike[][]):TransitionMatrix{
 const P=matrix(values);const size=shape(P);if(size.rows!==size.cols)throw new RangeError('A transition matrix must be square.');
 for(const row of P){if(row.some(value=>value.isNegative()))throw new RangeError('Transition probabilities cannot be negative.');if(!sumRationals(row).equals(1))throw new RangeError('Every transition-matrix row must sum to 1.');}
 return P as TransitionMatrix;
}
export function distribution(values:RationalLike[]):ProbabilityVector{
 const d=values.map(Rational.from);if(d.length===0)throw new RangeError('A state distribution needs at least one state.');if(d.some(value=>value.isNegative()))throw new RangeError('State probabilities cannot be negative.');if(!sumRationals(d).equals(1))throw new RangeError('A state distribution must sum to 1.');return d as ProbabilityVector;
}
function validatedPair(d:ReadonlyArray<RationalLike>,P:ReadonlyArray<ReadonlyArray<RationalLike>>){const transition=transitionMatrix(P.map(row=>[...row])),state=distribution([...d]);if(state.length!==transition.length)throw new RangeError(`Distribution length (${state.length}) must match transition-matrix order (${transition.length}).`);return{state,transition};}
export function stepDistribution(d:ProbabilityVector,P:TransitionMatrix):ProbabilityVector{
 const validated=validatedPair(d,P),row=matrix([validated.state]);return distribution(multiplyMatrices(row,validated.transition)[0]!);
}
export function matrixPower(P:TransitionMatrix,k:number):TransitionMatrix{
 if(!Number.isInteger(k)||k<0||k>MAX_MARKOV_STEPS)throw new RangeError(`Markov steps must be an integer from 0 to ${MAX_MARKOV_STEPS}.`);
 const transition=transitionMatrix(P);let result=matrix(transition.map((row,r)=>row.map((_,c)=>r===c?1:0))),base:Matrix=transition,e=k;
 while(e>0){if(e%2===1)result=multiplyMatrices(result,base);e=Math.floor(e/2);if(e>0)base=multiplyMatrices(base,base);}
 return transitionMatrix(result);
}
export function distributionAfter(d:ProbabilityVector,P:TransitionMatrix,k:number):ProbabilityVector{return stepDistribution(d,matrixPower(P,k));}

export type StationaryTwoStateResult=
 | {kind:'unique';vector:ProbabilityVector}
 | {kind:'nonunique';reason:string}
 | {kind:'unsupported-dimension';size:number;reason:string};
export function stationaryTwoStateResult(P:TransitionMatrix):StationaryTwoStateResult{
 const transition=transitionMatrix(P);if(transition.length!==2)return{kind:'unsupported-dimension',size:transition.length,reason:'The closed-form stationary shortcut currently supports only 2×2 transition matrices.'};
 const p01=transition[0]![1]!,p10=transition[1]![0]!,den=p01.add(p10);
 if(den.isZero())return{kind:'nonunique',reason:'Both cross-state transition probabilities are 0, so every two-state distribution is stationary; there is no unique stationary vector.'};
 return{kind:'unique',vector:distribution([p10.divide(den),p01.divide(den)])};
}
/** Compatibility wrapper for callers that require a unique 2-state vector. */
export function stationaryTwoState(P:TransitionMatrix):ProbabilityVector{
 const result=stationaryTwoStateResult(P);if(result.kind!=='unique')throw new RangeError(result.reason);return result.vector;
}
