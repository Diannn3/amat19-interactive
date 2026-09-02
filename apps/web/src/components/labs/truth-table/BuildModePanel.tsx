import { useEffect, useRef, useState } from 'react';
import type { TruthTable } from '@amat19/domain-logic';
import { CheckCircle2, ChevronRight, RotateCcw } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Feedback } from '../../ui/Feedback';
import { Badge } from '../../ui/Badge';
import { createAttemptId, recordAssessmentResult } from '../../../lib/local-progress';
import { parseNonnegativeIntegerInput } from '../../../lib/integer-input';
import { truthTableProblemFingerprint } from '../../../lib/problem-fingerprint';
import { applyTruthBuildGuess, type TruthBuildGuess } from './build-completion';

export function BuildModePanel({table}:{table:TruthTable}){
 const[rowCount,setRowCount]=useState('');const[rowCountChecked,setRowCountChecked]=useState(false);const[stage,setStage]=useState<1|2|3|4>(1);const[guesses,setGuesses]=useState<Record<number,TruthBuildGuess>>({});const[selectedRow,setSelectedRow]=useState(0);const resultColumn=table.columns.at(-1)!;const complete=Object.keys(guesses).length===table.rows.length&&Object.values(guesses).every(g=>g.ok);
 const rowCountInput=parseNonnegativeIntegerInput(rowCount,{label:'Predicted row count',positive:true,max:1_000_000});
 const completionRecordedRef=useRef(false);const incorrectGuessCountRef=useRef(0);const evaluationAttemptIdRef=useRef(createAttemptId('truth-build'));const evaluationStartedAtRef=useRef(new Date().toISOString());const rowCountIncorrectRef=useRef(0);const rowCountAttemptIdRef=useRef(createAttemptId('truth-row-count'));const rowCountStartedAtRef=useRef(new Date().toISOString());
 useEffect(()=>{setRowCount('');setRowCountChecked(false);setStage(1);setGuesses({});setSelectedRow(0);completionRecordedRef.current=false;incorrectGuessCountRef.current=0;evaluationAttemptIdRef.current=createAttemptId('truth-build');evaluationStartedAtRef.current=new Date().toISOString();rowCountIncorrectRef.current=0;rowCountAttemptIdRef.current=createAttemptId('truth-row-count');rowCountStartedAtRef.current=new Date().toISOString()},[table.expression]);
 async function checkRows(){if(rowCountInput.status!=='valid')return;const ok=rowCountInput.value===table.rows.length;const wrongBefore=rowCountIncorrectRef.current;if(!ok)rowCountIncorrectRef.current+=1;setRowCountChecked(true);await recordAssessmentResult({prefix:'truth-row-count',attemptId:rowCountAttemptIdRef.current,startedAt:rowCountStartedAtRef.current,exerciseId:'logic.truth-table.rows',problemFingerprint:truthTableProblemFingerprint(table,'row-count'),module:'logic',skillId:'logic.truth-table.rows',result:ok?'correct':'incorrect',firstAttemptCorrect:ok&&wrongBefore===0,incorrectAttempts:rowCountIncorrectRef.current,hintsUsed:0,revealsUsed:0,difficulty:'intro',payload:{expression:table.expression,prediction:rowCountInput.value,rawPrediction:rowCount,expected:table.rows.length}}).catch(()=>undefined);if(ok)setStage(2)}
 async function guess(value:boolean){
  const expected=table.rows[selectedRow]!.values[resultColumn.id]!;
  const applied=applyTruthBuildGuess(guesses,selectedRow,value,expected,table.rows.length);
  if(!applied.ok){
   incorrectGuessCountRef.current+=1;
   await recordAssessmentResult({prefix:'truth-build',attemptId:evaluationAttemptIdRef.current,startedAt:evaluationStartedAtRef.current,exerciseId:'logic.truth-table.build',problemFingerprint:truthTableProblemFingerprint(table,'build',resultColumn.id),module:'logic',skillId:'logic.truth-table.evaluate',result:'incorrect',firstAttemptCorrect:false,incorrectAttempts:incorrectGuessCountRef.current,hintsUsed:0,revealsUsed:0,difficulty:'standard',payload:{expression:table.expression,row:selectedRow,value,expected,columnId:resultColumn.id}}).catch(()=>undefined);
  }
  setGuesses(applied.nextGuesses);
  if(applied.ok){const next=table.rows.find(row=>!applied.nextGuesses[row.index]?.ok&&row.index!==selectedRow);if(next)setSelectedRow(next.index)}
  if(applied.complete&&!completionRecordedRef.current){
   completionRecordedRef.current=true;
   await recordAssessmentResult({
    prefix:'truth-build',attemptId:evaluationAttemptIdRef.current,startedAt:evaluationStartedAtRef.current,exerciseId:'logic.truth-table.build',problemFingerprint:truthTableProblemFingerprint(table,'build',resultColumn.id),module:'logic',skillId:'logic.truth-table.evaluate',result:'correct',firstAttemptCorrect:incorrectGuessCountRef.current===0,incorrectAttempts:incorrectGuessCountRef.current,hintsUsed:0,revealsUsed:0,difficulty:'standard',payload:{expression:table.expression,rowCount:table.rows.length,columnId:resultColumn.id}
   }).catch(()=>undefined)
  }
 }
 function reset(){setRowCount('');setRowCountChecked(false);setStage(1);setGuesses({});setSelectedRow(0);completionRecordedRef.current=false;incorrectGuessCountRef.current=0;evaluationAttemptIdRef.current=createAttemptId('truth-build');evaluationStartedAtRef.current=new Date().toISOString();rowCountIncorrectRef.current=0;rowCountAttemptIdRef.current=createAttemptId('truth-row-count');rowCountStartedAtRef.current=new Date().toISOString()}
 return <section className="truth-build" aria-label="Guided truth table builder">
  <div className="math-panel"><div className="math-panel__head"><div><p className="section-label">Build mode</p><h3>Construct the table in four decisions.</h3></div><Badge>stage {stage}/4</Badge></div>
   <ol className="build-stage-list"><li data-active={stage===1}><strong>1. Count symbols and rows</strong><small>{table.symbols.join(', ')}</small></li><li data-active={stage===2}><strong>2. Inspect base row patterns</strong><small>Systematic T/F assignments</small></li><li data-active={stage===3}><strong>3. Evaluate the final column</strong><small>{resultColumn.label}</small></li><li data-active={stage===4}><strong>4. Read the whole proposition</strong><small>Classify from the truth vector</small></li></ol>
  </div>
  <div className="math-panel truth-build__work">
   {stage===1&&<><p>You found <strong>{table.symbols.length}</strong> unique symbol{table.symbols.length===1?'':'s'}. How many truth-table rows are required?</p><div className="action-row"><input className="text-input" type="number" min="1" value={rowCount} onChange={e=>{setRowCount(e.target.value);setRowCountChecked(false)}} aria-label="Predicted number of rows"/><Button variant="primary" onClick={()=>void checkRows()} disabled={rowCountInput.status!=='valid'}>Check rows</Button></div>{rowCountInput.status==='invalid'&&<Feedback tone="error">{rowCountInput.message}</Feedback>}{rowCountChecked&&rowCountInput.status==='valid'&&<Feedback tone={rowCountInput.value===table.rows.length?'success':'error'}>{rowCountInput.value===table.rows.length?<><CheckCircle2 size={16}/> Correct: 2^{table.symbols.length} = {table.rows.length}.</>:`Use 2ⁿ with n=${table.symbols.length}.`}</Feedback>}</>}
   {stage===2&&<><p>Base columns follow a repeatable block pattern. Read the assignments before evaluating any compound column.</p><div className="truth-table-scroll"><table className="truth-table"><thead><tr>{table.symbols.map(symbol=><th key={symbol}>{symbol}</th>)}</tr></thead><tbody>{table.rows.map(row=><tr key={row.index}>{table.symbols.map(symbol=><td key={symbol}>{row.assignment[symbol]?'T':'F'}</td>)}</tr>)}</tbody></table></div><Button variant="primary" onClick={()=>setStage(3)}>I see the pattern <ChevronRight size={16}/></Button></>}
   {stage===3&&<><p>Evaluate <strong>{resultColumn.label}</strong> for each assignment. Pick a row, then decide T or F.</p><div className="truth-build__row-picker">{table.rows.map(row=><button key={row.index} data-active={selectedRow===row.index} data-status={guesses[row.index]?.ok?'correct':guesses[row.index]?'wrong':undefined} onClick={()=>setSelectedRow(row.index)}>R{row.index+1}</button>)}</div><div className="conditioning-banner"><span>Row {selectedRow+1}</span><strong>{table.symbols.map(symbol=>`${symbol}=${table.rows[selectedRow]!.assignment[symbol]?'T':'F'}`).join(' · ')}</strong><small>Evaluate the expression from the inside out.</small></div><div className="action-row"><Button variant="answer" onClick={()=>void guess(true)}>T · True</Button><Button variant="answer" onClick={()=>void guess(false)}>F · False</Button></div>{guesses[selectedRow]&&<Feedback tone={guesses[selectedRow]!.ok?'success':'error'}>{guesses[selectedRow]!.ok?'Correct for this row.':'Not yet. Re-evaluate the main connective from its child values.'}</Feedback>}{complete&&<Button variant="primary" onClick={()=>setStage(4)}>All rows complete <ChevronRight size={16}/></Button>}</>}
   {stage===4&&<><Feedback tone="success"><CheckCircle2 size={18}/><strong>Table constructed.</strong> Your final truth vector matches every row.</Feedback><div className="security-grid"><div className="formula-callout"><span>Final expression</span><strong>{resultColumn.label}</strong></div><div className="formula-callout"><span>Classification</span><strong>{table.classification}</strong></div></div><p>{table.classification==='tautology'?'Every row is true.':table.classification==='contradiction'?'Every row is false.':'The final column contains both true and false rows.'}</p></>}
   <Button variant="ghost" onClick={reset}><RotateCcw size={15}/> Restart build</Button>
  </div>
 </section>
}
