import { ArrowUpRight, BookOpenCheck, Grid3X3, Sigma, WalletCards, Waypoints } from 'lucide-react';
import { currentCourseProfile, type ModuleId } from '@amat19/course-content';
import SpotlightCard from '../bits/SpotlightCard';

const icons = { logic: BookOpenCheck, probability: Sigma, finance: WalletCards, linear: Grid3X3, applications: Waypoints } as const;
const teasers: Record<ModuleId, string> = {
  logic: 'Symbols, truth tables, and proofs.',
  probability: 'Count, condition, and compare chance.',
  finance: 'Move every value to one date.',
  linear: 'Multiply, reduce, and read systems.',
  applications: 'Model choices, payoffs, and states.',
};

export default function ModuleSpotlightGrid() {
  return <div className="module-spotlight-grid">{currentCourseProfile.modules.map((module, index) => {
    const Icon = icons[module.id];
    const labCount = currentCourseProfile.labs.filter((lab) => lab.module === module.id).length;

    return <SpotlightCard key={module.id} className={`module-tile module-tile--${module.id}`}><a className="module-spotlight-link" href={module.href}>
      <div>
        <div className="module-spotlight-link__top"><span className="module-index">0{index + 1}</span><Icon size={21} aria-hidden="true" /></div>
        <h3>{module.title}</h3>
        <p>{teasers[module.id]}</p>
      </div>
      <div className="module-spotlight-link__bottom"><span>{labCount} labs</span><span>Open module <ArrowUpRight size={16} aria-hidden="true" /></span></div>
    </a></SpotlightCard>;
  })}</div>;
}
