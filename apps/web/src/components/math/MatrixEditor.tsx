import { Grid2X2, Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

function parseRaw(raw:string):string[][]{
 const rows=raw.trim().split(/\n+/).map(line=>line.trim().split(/[\s,]+/).filter(Boolean));
 return rows.length&&rows[0]?.length?rows:[['0']];
}
function serialize(rows:string[][]){return rows.map(row=>row.join(' ')).join('\n')}
export function MatrixEditor({value,onChange,label='Matrix',maxRows=6,maxCols=6}:{value:string;onChange:(value:string)=>void;label?:string;maxRows?:number;maxCols?:number}){
 const rows=parseRaw(value);const cols=Math.max(...rows.map(row=>row.length));const normalized=rows.map(row=>Array.from({length:cols},(_,c)=>row[c]??'0'));
 const update=(r:number,c:number,next:string)=>{const copy=normalized.map(row=>row.slice());copy[r]![c]=next;onChange(serialize(copy))};
 const addRow=()=>{if(normalized.length>=maxRows)return;onChange(serialize([...normalized,Array.from({length:cols},()=> '0')]))};
 const removeRow=()=>{if(normalized.length<=1)return;onChange(serialize(normalized.slice(0,-1)))};
 const addCol=()=>{if(cols>=maxCols)return;onChange(serialize(normalized.map(row=>[...row,'0'])))};
 const removeCol=()=>{if(cols<=1)return;onChange(serialize(normalized.map(row=>row.slice(0,-1))))};
 const identity=()=>{const n=Math.min(4,Math.max(2,Math.min(normalized.length,cols)));onChange(serialize(Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>r===c?'1':'0'))))};
 return <div className="matrix-editor"><div className="matrix-editor__toolbar"><strong>{label}</strong><span className="status-pill">{normalized.length}×{cols}</span><Button variant="ghost" type="button" onClick={addRow} disabled={normalized.length>=maxRows}><Plus size={14}/> row</Button><Button variant="ghost" type="button" onClick={removeRow} disabled={normalized.length<=1}><Minus size={14}/> row</Button><Button variant="ghost" type="button" onClick={addCol} disabled={cols>=maxCols}><Plus size={14}/> col</Button><Button variant="ghost" type="button" onClick={removeCol} disabled={cols<=1}><Minus size={14}/> col</Button><Button variant="ghost" type="button" onClick={identity}><Grid2X2 size={14}/> identity</Button><Button variant="ghost" type="button" onClick={()=>onChange('1 2\n3 4')}><RotateCcw size={14}/> sample</Button></div><div className="matrix-editor__grid" role="group" aria-label={`${label} cells`}>{normalized.map((row,r)=><div className="matrix-editor__row" key={r}>{row.map((cell,c)=><input key={c} className="matrix-editor__cell" aria-label={`${label} row ${r+1} column ${c+1}`} value={cell} onChange={event=>update(r,c,event.target.value)}/>)}</div>)}</div><details><summary>Paste matrix text</summary><textarea className="matrix-textarea" rows={4} value={value} onChange={event=>onChange(event.target.value)} aria-label={`${label} matrix text`}/></details></div>
}
