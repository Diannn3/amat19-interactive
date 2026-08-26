import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import { searchSkills } from '@amat19/course-content';

type Result={title:string;subtitle:string;href:string;kind:string};
const fixed:Result[]=[
 {title:'Study Queue',subtitle:'Recommended next work and recent sessions',href:'/study',kind:'Study'},
 {title:'Course Map',subtitle:'Five connected AMAT 19 modules',href:'/course',kind:'Course'},
 {title:'Mixed Practice',subtitle:'Adaptive whole-course retrieval',href:'/practice',kind:'Practice'},
 {title:'Mixed Course Check',subtitle:'Generated assessment with delayed feedback',href:'/exam',kind:'Assess'},
 {title:'Progress',subtitle:'Skill-level learning evidence',href:'/progress',kind:'Progress'},
 {title:'Saved',subtitle:'Bookmarks and saved problems',href:'/saved',kind:'Library'},
 {title:'Formula & Notation Reference',subtitle:'Symbols, formulas, and repair links',href:'/reference',kind:'Reference'},
 {title:'Settings',subtitle:'Notation, motion, practice, and display preferences',href:'/settings',kind:'Settings'}
];
export default function CommandPalette(){
 const ref=useRef<HTMLDialogElement>(null);const[input,setInput]=useState('');
 useEffect(()=>{const open=()=>{ref.current?.showModal();setTimeout(()=>ref.current?.querySelector<HTMLInputElement>('input')?.focus(),0)};const key=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();open();}};window.addEventListener('amat:command',open);window.addEventListener('keydown',key);return()=>{window.removeEventListener('amat:command',open);window.removeEventListener('keydown',key)}},[]);
 const results=useMemo<Result[]>(()=>{const q=input.trim();if(!q)return fixed;const skillResults=searchSkills(q).map(skill=>({title:skill.title,subtitle:skill.description,href:skill.labHref,kind:skill.module}));return [...fixed.filter(item=>`${item.title} ${item.subtitle}`.toLowerCase().includes(q.toLowerCase())),...skillResults].slice(0,14)},[input]);
 return <dialog ref={ref} className="command-dialog" aria-label="Search AMAT 19"><div className="command-dialog__header"><Search size={18} aria-hidden="true"/><input className="command-dialog__input" value={input} onChange={e=>setInput(e.target.value)} placeholder="Search skills, labs, or pages…" aria-label="Search skills, labs, or pages"/><button className="site-nav__command" type="button" onClick={()=>ref.current?.close()} aria-label="Close search"><X size={16}/></button></div><div className="command-dialog__list">{results.length?results.map(result=><a className="command-result" key={`${result.kind}-${result.href}-${result.title}`} href={result.href} onClick={()=>ref.current?.close()}><span><strong>{result.title}</strong><small>{result.subtitle}</small></span><small>{result.kind}</small></a>):<div className="empty-state"><BookOpen aria-hidden="true"/><strong>No matching study tool.</strong><p>Try a concept name such as “conditional”, “rref”, “annuity”, or “proof”.</p></div>}</div></dialog>
}
