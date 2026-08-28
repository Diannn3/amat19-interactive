import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Languages, RotateCcw, Shapes } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Feedback } from '../../ui/Feedback';
import { recordAttempt, recordSkillEvidence } from '../../../lib/local-progress';

type Mode='proposition'|'connective'|'main-connective'|'symbolize'|'translate'|'negation';
type Exercise={mode:Mode;prompt:string;answer:string;options:string[];explanation:string;skillId:string;preview?:string};

const EXERCISES:Exercise[]=[
 {mode:'proposition',prompt:'The campus library closes at 8 PM today.',answer:'proposition',options:['proposition','not a proposition'],explanation:'It is a declarative claim that can be assigned a truth value.',skillId:'logic.proposition.identify'},
 {mode:'proposition',prompt:'Please submit the worksheet.',answer:'not a proposition',options:['proposition','not a proposition'],explanation:'A command is not true or false, so it is not a proposition.',skillId:'logic.proposition.identify'},
 {mode:'connective',prompt:'“The quiz is today and the room is open.”',answer:'∧',options:['∼','∧','∨','→','↔'],explanation:'The word “and” joins both propositions with conjunction.',skillId:'logic.connective.identify',preview:'P ∧ Q'},
 {mode:'connective',prompt:'“A seat or a standing spot is available.” Use inclusive OR.',answer:'∨',options:['∼','∧','∨','→','↔'],explanation:'Unless a problem says otherwise, propositional OR is inclusive.',skillId:'logic.connective.identify',preview:'P ∨ Q'},
 {mode:'main-connective',prompt:'In ∼P ∨ (Q → R), which connective controls the whole proposition?',answer:'∨',options:['∼','∨','→'],explanation:'Parentheses make Q → R a component. The outermost disjunction joins ∼P with that component.',skillId:'logic.connective.identify',preview:'∼P  ∨  (Q → R)'},
 {mode:'main-connective',prompt:'In ∼(P ∧ Q) → R, which connective is the main connective?',answer:'→',options:['∼','∧','→'],explanation:'The leading negation applies only to the parenthesized conjunction; implication joins that result to R.',skillId:'logic.connective.identify',preview:'∼(P ∧ Q)  →  R'},
 {mode:'symbolize',prompt:'Let P: “You enter the lab.” Q: “You wear eye protection.” Symbolize: “You enter the lab only if you wear eye protection.”',answer:'P → Q',options:['P → Q','Q → P','P ↔ Q','P ∧ Q'],explanation:'“P only if Q” means Q is necessary for P, so P → Q.',skillId:'logic.symbolize'},
 {mode:'symbolize',prompt:'Let P: “The switch is on.” Q: “The indicator is lit.” Symbolize: “The switch is on if and only if the indicator is lit.”',answer:'P ↔ Q',options:['P → Q','Q → P','P ↔ Q','P ∨ Q'],explanation:'“If and only if” is the biconditional.',skillId:'logic.symbolize'},
 {mode:'symbolize',prompt:'Let P: “The permit is valid.” Q: “Entry is allowed.” Symbolize: “A valid permit is sufficient for entry.”',answer:'P → Q',options:['P → Q','Q → P','P ∧ Q','P ↔ Q'],explanation:'“P is sufficient for Q” means whenever P holds, Q follows: P → Q.',skillId:'logic.symbolize'},
 {mode:'symbolize',prompt:'Let P: “The password is correct.” Q: “Access is granted.” Symbolize: “A correct password is necessary for access.”',answer:'Q → P',options:['P → Q','Q → P','P ∨ Q','P ↔ Q'],explanation:'“P is necessary for Q” means Q cannot occur without P: Q → P.',skillId:'logic.symbolize'},
 {mode:'translate',prompt:'Translate P → Q into controlled language.',answer:'If P, then Q',options:['If P, then Q','P if and only if Q','P and Q','Not P or not Q'],explanation:'Implication reads “if P, then Q.” It can also be expressed as “P only if Q.”',skillId:'logic.symbolize'},
 {mode:'translate',prompt:'Translate P ↔ Q into controlled language.',answer:'P if and only if Q',options:['If P, then Q','P if and only if Q','P or Q','Not P'],explanation:'The biconditional states both directions together.',skillId:'logic.symbolize'},
 {mode:'negation',prompt:'Choose the equivalent form of ∼(P ∧ Q).',answer:'∼P ∨ ∼Q',options:['∼P ∨ ∼Q','∼P ∧ ∼Q','P ∨ Q'],explanation:'De Morgan’s Law switches ∧ to ∨ and negates both components.',skillId:'logic.equivalence.transform'},
 {mode:'negation',prompt:'Choose the equivalent form of ∼(P ∨ Q).',answer:'∼P ∧ ∼Q',options:['∼P ∨ ∼Q','∼P ∧ ∼Q','P ∧ Q'],explanation:'De Morgan’s Law switches ∨ to ∧ and negates both components.',skillId:'logic.equivalence.transform'}
];
const MODE_LABELS:Record<Mode,string>={proposition:'Statements',connective:'Connectives','main-connective':'Main connective',symbolize:'Symbolize',translate:'Translate',negation:'Negation'};

export default function LogicBasicsLab(){
 const[mode,setMode]=useState<Mode>('proposition');const[index,setIndex]=useState(0);const[selected,setSelected]=useState<string>();const[checked,setChecked]=useState(false);
 const[hydrated,setHydrated]=useState(false);
 useEffect(()=>{setHydrated(true)},[]);
 const pool=useMemo(()=>EXERCISES.filter(item=>item.mode===mode),[mode]);const exercise=pool[index%pool.length]!;const correct=selected===exercise.answer;
 function chooseMode(next:Mode){setMode(next);setIndex(0);setSelected(undefined);setChecked(false)}
 function next(){setIndex(current=>(current+1)%pool.length);setSelected(undefined);setChecked(false)}
 async function check(){if(!selected)return;setChecked(true);await Promise.all([recordAttempt({prefix:'logic-basics',exerciseId:`${exercise.skillId}.${index}`,module:'logic',finalState:correct?'correct':'incomplete',payload:{mode,selected,answer:exercise.answer},skillIds:[exercise.skillId],difficulty:mode==='main-connective'||mode==='symbolize'?'standard':'intro'}),recordSkillEvidence(exercise.skillId,correct?1:0,{independent:correct})]).catch(()=>undefined)}
 return <section className="learning-lab learning-lab--wide" data-testid="logic-basics-lab" data-hydrated={hydrated?'true':undefined}>
  <div className="learning-lab__full">
   <div className="logic-mode-tabs" aria-label="Logic basics practice mode">{(Object.keys(MODE_LABELS) as Mode[]).map(value=><Button key={value} variant={mode===value?'primary':'secondary'} onClick={()=>chooseMode(value)}>{value==='symbolize'||value==='translate'?<Languages size={15}/>:<Shapes size={15}/>} {MODE_LABELS[value]}</Button>)}</div>
  </div>
  <div className="learning-lab__prompt symbolization-card">
   <div><h2>{MODE_LABELS[mode]}</h2><p className="section-context">Controlled practice · {index+1}/{pool.length}</p><p className="learning-lab__question">{exercise.prompt}</p></div>
   {exercise.preview&&<div className="symbolization-preview" aria-label="Expression structure preview">{exercise.preview}</div>}
   <div className="choice-grid" role="radiogroup" aria-label="Answer choices">{exercise.options.map(value=><button key={value} type="button" className="choice-button" role="radio" aria-checked={selected===value} data-selected={selected===value} onClick={()=>{setSelected(value);setChecked(false)}}>{value==='proposition'?'Proposition':value==='not a proposition'?'Not a proposition':value}</button>)}</div>
   <div className="action-row"><Button variant="primary" type="button" disabled={!selected} onClick={check}>Check answer</Button><Button variant="ghost" type="button" onClick={()=>{setSelected(undefined);setChecked(false)}}><RotateCcw size={16}/> Reset</Button></div>
  </div>
  <aside className="learning-lab__explain">
   <div className="math-panel__head"><div><p className="section-label">Why</p><h3>Read the structure, not just the keywords.</h3></div><Badge>{exercise.skillId.split('.').at(-1)}</Badge></div>
   {!checked&&<p>Choose an answer first. The explanation will name the structural cue that matters.</p>}
   {checked&&<Feedback tone={correct?'success':'error'} role={correct?'status':'alert'}><strong>{correct?'Correct.':'Not yet.'}</strong> {exercise.explanation}</Feedback>}
   {checked&&correct&&<Button variant="secondary" type="button" onClick={next}><CheckCircle2 size={16}/> Try another <ArrowRight size={15}/></Button>}
   <details className="reference-details"><summary>Controlled-language map</summary><dl className="mini-definition-list"><div><dt>∼P</dt><dd>not P</dd></div><div><dt>P ∧ Q</dt><dd>P and Q</dd></div><div><dt>P ∨ Q</dt><dd>P or Q, inclusive</dd></div><div><dt>P → Q</dt><dd>if P then Q · P only if Q · P sufficient for Q · Q necessary for P</dd></div><div><dt>P ↔ Q</dt><dd>P if and only if Q</dd></div></dl></details>
  </aside>
 </section>
}
