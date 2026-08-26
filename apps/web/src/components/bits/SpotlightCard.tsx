import { useRef, useState, type HTMLAttributes, type PropsWithChildren } from 'react';
// Source adapted from React Bits Spotlight Card (MIT + Commons Clause):
// https://github.com/DavidHDev/react-bits/blob/d71509062d8adbd97a43035a94d0ebdaf154b5cf/src/ts-tailwind/Components/SpotlightCard/SpotlightCard.tsx
// Restyled to AMAT 19 tokens and simplified for reduced-motion/coarse-pointer safety.
export default function SpotlightCard({children,className='',...props}:PropsWithChildren<HTMLAttributes<HTMLDivElement>>){
 const ref=useRef<HTMLDivElement>(null);const[position,setPosition]=useState({x:0,y:0});const[visible,setVisible]=useState(false);
 function move(event:React.MouseEvent<HTMLDivElement>){if(!ref.current)return;const rect=ref.current.getBoundingClientRect();setPosition({x:event.clientX-rect.left,y:event.clientY-rect.top});}
 return <div ref={ref} onMouseMove={move} onMouseEnter={()=>setVisible(true)} onMouseLeave={()=>setVisible(false)} className={`spotlight-card relative overflow-hidden ${className}`.trim()} {...props}><div aria-hidden="true" className="spotlight-card__light" style={{opacity:visible?1:0,background:`radial-gradient(420px circle at ${position.x}px ${position.y}px, var(--spotlight), transparent 68%)`}}/><div className="relative z-[1] h-full">{children}</div></div>
}
