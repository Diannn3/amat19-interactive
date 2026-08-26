import { ArrowUpRight, BookOpenCheck, Grid3X3, Sigma, WalletCards, Waypoints } from 'lucide-react';
import { currentCourseProfile } from '@amat19/course-content';
import SpotlightCard from '../bits/SpotlightCard';
const icons={logic:BookOpenCheck,probability:Sigma,finance:WalletCards,linear:Grid3X3,applications:Waypoints} as const;
export default function ModuleSpotlightGrid(){return <div className="module-spotlight-grid">{currentCourseProfile.modules.map((module,index)=>{const Icon=icons[module.id];return <SpotlightCard key={module.id}><a className="module-spotlight-link" href={module.href}><div><div className="module-spotlight-link__top"><span className="module-index">0{index+1}</span><Icon size={21} aria-hidden="true"/></div><h3>{module.title}</h3><p>{module.description}</p></div><span className="module-arrow" aria-hidden="true"><ArrowUpRight size={16}/></span></a></SpotlightCard>})}</div>}
