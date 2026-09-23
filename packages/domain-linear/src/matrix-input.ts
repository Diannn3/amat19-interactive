import { Rational } from '@amat19/math-core';
import { INTERACTIVE_MATRIX_LIMITS, MAX_MATRIX_CELLS, MAX_MATRIX_COLS, MAX_MATRIX_ROWS, matrix, type Matrix } from './matrix.ts';

export const MAX_MATRIX_LITERAL_LENGTH=128;
export const MAX_MATRIX_TEXT_LENGTH=32_768;
export type MatrixInputLimits={maxRows:number;maxCols:number;maxCells:number;maxLiteralLength?:number;maxTextLength?:number};
export const DEFAULT_MATRIX_INPUT_LIMITS:MatrixInputLimits={maxRows:MAX_MATRIX_ROWS,maxCols:MAX_MATRIX_COLS,maxCells:MAX_MATRIX_CELLS,maxLiteralLength:MAX_MATRIX_LITERAL_LENGTH,maxTextLength:MAX_MATRIX_TEXT_LENGTH};
export const DEFAULT_INTERACTIVE_MATRIX_INPUT_LIMITS:MatrixInputLimits={...INTERACTIVE_MATRIX_LIMITS,maxLiteralLength:MAX_MATRIX_LITERAL_LENGTH,maxTextLength:MAX_MATRIX_TEXT_LENGTH};

export type MatrixTextInspection=
 | {status:'valid';matrix:Matrix;tokens:string[][];rows:number;cols:number}
 | {status:'incomplete';message:string;tokens:string[][]}
 | {status:'invalid';message:string;tokens:string[][];row?:number;col?:number};

export function tokenizeMatrixText(raw:string):string[][]{
 const trimmed=raw.trim();if(!trimmed)return[];
 return trimmed.split(/\r?\n/).filter(line=>line.trim().length>0).map(line=>line.trim().split(/[\s,]+/).filter(Boolean));
}

export function inspectMatrixText(raw:string,limits:MatrixInputLimits=DEFAULT_MATRIX_INPUT_LIMITS):MatrixTextInspection{
 const maxTextLength=limits.maxTextLength??MAX_MATRIX_TEXT_LENGTH,maxLiteralLength=limits.maxLiteralLength??MAX_MATRIX_LITERAL_LENGTH;
 if(raw.length>maxTextLength)return{status:'invalid',message:`Matrix text cannot exceed ${maxTextLength} characters.`,tokens:[]};
 const tokens=tokenizeMatrixText(raw);
 if(!tokens.length)return{status:'incomplete',message:'Enter at least one matrix row.',tokens};
 if(tokens.length>limits.maxRows)return{status:'invalid',message:`This matrix can contain at most ${limits.maxRows} rows.`,tokens};
 const cols=tokens[0]?.length??0;if(cols===0)return{status:'incomplete',message:'Enter at least one matrix value.',tokens};
 if(cols>limits.maxCols)return{status:'invalid',message:`This matrix can contain at most ${limits.maxCols} columns.`,tokens};
 if(tokens.length*cols>limits.maxCells)return{status:'invalid',message:`This matrix can contain at most ${limits.maxCells} cells.`,tokens};
 for(let row=0;row<tokens.length;row++){
  if(tokens[row]!.length!==cols)return{status:'invalid',message:`Row ${row+1} has ${tokens[row]!.length} entr${tokens[row]!.length===1?'y':'ies'}; expected ${cols}.`,tokens,row};
  for(let col=0;col<cols;col++){
   const literal=tokens[row]![col]!;
   if(literal.length>maxLiteralLength)return{status:'invalid',message:`Entry at row ${row+1}, column ${col+1} exceeds ${maxLiteralLength} characters.`,tokens,row,col};
   try{Rational.parse(literal)}catch(error){return{status:'invalid',message:`Row ${row+1}, column ${col+1}: ${error instanceof Error?error.message:'invalid exact number'}`,tokens,row,col};}
  }
 }
 try{const value=matrix(tokens);return{status:'valid',matrix:value,tokens,rows:tokens.length,cols};}
 catch(error){return{status:'invalid',message:error instanceof Error?error.message:'Matrix input is invalid.',tokens};}
}

export function parseMatrixText(raw:string,limits:MatrixInputLimits=DEFAULT_MATRIX_INPUT_LIMITS):Matrix{
 const result=inspectMatrixText(raw,limits);if(result.status==='valid')return result.matrix;throw new RangeError(result.message);
}
