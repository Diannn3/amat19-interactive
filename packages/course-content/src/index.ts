export type ContentStatus = 'implemented' | 'engine-ready' | 'planned' | 'supplemental';
export type ModuleId = 'logic' | 'probability' | 'finance' | 'linear' | 'applications';
export type SkillDefinition = { id:string; module:ModuleId; title:string; description:string; status:ContentStatus; prerequisiteIds:string[]; relatedLab?:string };
export type ModuleDefinition = { id:ModuleId; order:number; title:string; description:string; status:ContentStatus; href:string };
export type LabDefinition = { id:string; module:ModuleId; title:string; href:string; skillIds:string[]; status:'live'|'experimental'|'supplemental'|'planned' };
export type CourseProfile = { id:string; label:string; authority:string; modules:ModuleDefinition[]; skills:SkillDefinition[]; labs:LabDefinition[]; featureFlags:Record<string,boolean> };
export const COURSE_VERSION='amat19-ay2025-2026-1s-v1';
export const currentCourseProfile:CourseProfile={
 id:'ay-2025-2026-1s', label:'AMAT 19 · 1st Semester AY 2025–2026', authority:'Current course guide; original app explanations and generated practice',
 modules:[
  {id:'logic',order:1,title:'Logic',description:'Propositions, truth values, equivalence, inference, validity, and proof.',status:'implemented',href:'/modules/logic'},
  {id:'probability',order:2,title:'Probability',description:'Counting, inclusion–exclusion, exact probability, conditioning, independence, and supplemental distributions.',status:'implemented',href:'/modules/probability'},
  {id:'finance',order:3,title:'Financial Mathematics',description:'Interest measurement, simple/compound interest, rate equivalence, time value of money, and annuities.',status:'implemented',href:'/modules/finance'},
  {id:'linear',order:4,title:'Matrices & Systems',description:'Matrix operations, multiplication, inverse, row reduction, and systems of linear equations.',status:'implemented',href:'/modules/linear'},
  {id:'applications',order:5,title:'Applications',description:'Graphical linear programming, game theory, simplex synchronization, and supplemental Markov chains.',status:'implemented',href:'/modules/applications'}
 ],
 skills:[
  {id:'logic.propositions',module:'logic',title:'Propositions & connectives',description:'Recognize proposition structure and connect controlled language to logical symbols.',status:'implemented',prerequisiteIds:[],relatedLab:'/labs/logic-basics'},
  {id:'logic.truth-values',module:'logic',title:'Truth values & truth tables',description:'Generate assignments, evaluate subexpressions, and classify propositions.',status:'implemented',prerequisiteIds:['logic.propositions'],relatedLab:'/labs/truth-table'},
  {id:'logic.equivalence',module:'logic',title:'Logical equivalence',description:'Compare propositions semantically and validate named equivalence-rule rewrites.',status:'implemented',prerequisiteIds:['logic.truth-values'],relatedLab:'/labs/equivalence'},
  {id:'logic.argument-validity',module:'logic',title:'Argument validity',description:'Find or rule out true-premise/false-conclusion counterexamples.',status:'implemented',prerequisiteIds:['logic.truth-values'],relatedLab:'/labs/truth-table?mode=argument'},
  {id:'logic.formal-proof',module:'logic',title:'Formal proof',description:'Build line-by-line derivations using configured equivalence and inference rules.',status:'implemented',prerequisiteIds:['logic.equivalence','logic.argument-validity'],relatedLab:'/labs/formal-proof'},
  {id:'probability.counting',module:'probability',title:'Permutation & combination',description:'Choose a counting model based on order and repetition, then calculate exact counts.',status:'implemented',prerequisiteIds:[],relatedLab:'/labs/counting'},
  {id:'probability.inclusion-exclusion',module:'probability',title:'Inclusion–exclusion',description:'Count unions without double-counting intersections.',status:'implemented',prerequisiteIds:['probability.counting'],relatedLab:'/labs/counting#inclusion-exclusion'},
  {id:'probability.basic',module:'probability',title:'Basic probability',description:'Represent favorable outcomes and sample spaces with exact rational values.',status:'implemented',prerequisiteIds:['probability.counting'],relatedLab:'/labs/conditional-probability'},
  {id:'probability.conditional',module:'probability',title:'Conditional probability',description:'Restrict the active universe and compare P(A|B) with P(B|A).',status:'implemented',prerequisiteIds:['probability.basic'],relatedLab:'/labs/conditional-probability'},
  {id:'probability.independence',module:'probability',title:'Independence',description:'Test independence by exact probability identities.',status:'implemented',prerequisiteIds:['probability.conditional'],relatedLab:'/labs/conditional-probability'},
  {id:'probability.distribution',module:'probability',title:'Discrete distributions',description:'Supplemental expected value and variance with exact rational probabilities.',status:'supplemental',prerequisiteIds:['probability.basic'],relatedLab:'/labs/distribution'},
  {id:'probability.simulation',module:'probability',title:'Probability simulation',description:'Supplemental seeded simulation comparing empirical frequency with theoretical probability.',status:'supplemental',prerequisiteIds:['probability.basic'],relatedLab:'/labs/probability-simulation'},
  {id:'probability.bayes',module:'probability',title:'Bayes & total probability',description:'Supplemental prior-to-posterior updating with exact tree and table representations.',status:'supplemental',prerequisiteIds:['probability.conditional'],relatedLab:'/labs/bayes'},
  {id:'finance.interest',module:'finance',title:'Interest measurement',description:'Distinguish simple, effective compound, and nominal-rate accumulation.',status:'implemented',prerequisiteIds:[],relatedLab:'/labs/interest'},
  {id:'finance.rate-equivalence',module:'finance',title:'Equivalent rates',description:'Convert nominal and annual effective rates by matching one-year accumulation.',status:'implemented',prerequisiteIds:['finance.interest'],relatedLab:'/labs/interest'},
  {id:'finance.tvm',module:'finance',title:'Time value of money',description:'Move cash flows to a common focal date before comparing or combining them.',status:'implemented',prerequisiteIds:['finance.interest'],relatedLab:'/labs/interest'},
  {id:'finance.annuity',module:'finance',title:'Annuities',description:'Value level payment streams as immediate or due, at present or future focal dates.',status:'implemented',prerequisiteIds:['finance.tvm'],relatedLab:'/labs/annuity'},
  {id:'finance.bonds',module:'finance',title:'Bond pricing',description:'Supplemental coupon/redemption valuation with premium and discount interpretation.',status:'supplemental',prerequisiteIds:['finance.annuity','finance.rate-equivalence'],relatedLab:'/labs/bonds'},
  {id:'linear.operations',module:'linear',title:'Matrix operations',description:'Check dimensions, add, transpose, multiply, and inspect row-by-column products.',status:'implemented',prerequisiteIds:[],relatedLab:'/labs/matrix-operations'},
  {id:'linear.inverse',module:'linear',title:'Inverse of a matrix',description:'Use Gauss–Jordan elimination on [A | I] and detect singular matrices.',status:'implemented',prerequisiteIds:['linear.operations'],relatedLab:'/labs/row-reduction'},
  {id:'linear.rref',module:'linear',title:'Row reduction',description:'Track elementary row operations to reduced row echelon form.',status:'implemented',prerequisiteIds:['linear.operations'],relatedLab:'/labs/row-reduction'},
  {id:'linear.systems',module:'linear',title:'Systems of linear equations',description:'Classify systems as unique, infinite, or inconsistent from exact RREF structure.',status:'implemented',prerequisiteIds:['linear.rref'],relatedLab:'/labs/row-reduction'},
  {id:'applications.lp',module:'applications',title:'Graphical linear programming',description:'Construct a feasible region, enumerate corners, and optimize an objective over feasible points.',status:'implemented',prerequisiteIds:['linear.systems'],relatedLab:'/labs/linear-programming'},
  {id:'applications.simplex',module:'applications',title:'Simplex tableau',description:'Supplemental deterministic pivot trace synchronized with supported graphical maximization models.',status:'supplemental',prerequisiteIds:['applications.lp'],relatedLab:'/labs/linear-programming'},
  {id:'applications.game-theory',module:'applications',title:'Game theory',description:'Analyze security levels, saddle points, strict dominance, and 2×2 zero-sum mixtures.',status:'implemented',prerequisiteIds:['linear.operations'],relatedLab:'/labs/game-theory'},
  {id:'applications.markov',module:'applications',title:'Markov chains',description:'Supplemental transition matrices, k-step movement, and two-state stationary distributions.',status:'supplemental',prerequisiteIds:['linear.operations','probability.basic'],relatedLab:'/labs/markov'}
 ],
 labs:[
  {id:'logic-basics',module:'logic',title:'Logic Basics',href:'/labs/logic-basics',skillIds:['logic.propositions'],status:'live'},
  {id:'truth-table',module:'logic',title:'Truth Table Lab',href:'/labs/truth-table',skillIds:['logic.truth-values','logic.argument-validity'],status:'live'},
  {id:'equivalence',module:'logic',title:'Equivalence Lab',href:'/labs/equivalence',skillIds:['logic.equivalence'],status:'live'},
  {id:'formal-proof',module:'logic',title:'Formal Proof Workspace',href:'/labs/formal-proof',skillIds:['logic.formal-proof'],status:'live'},
  {id:'counting',module:'probability',title:'Counting Explorer',href:'/labs/counting',skillIds:['probability.counting','probability.inclusion-exclusion'],status:'live'},
  {id:'conditional-probability',module:'probability',title:'Conditional Probability Lab',href:'/labs/conditional-probability',skillIds:['probability.basic','probability.conditional','probability.independence'],status:'live'},
  {id:'distribution',module:'probability',title:'Discrete Distribution Lab',href:'/labs/distribution',skillIds:['probability.distribution'],status:'supplemental'},
  {id:'probability-simulation',module:'probability',title:'Probability Simulation Lab',href:'/labs/probability-simulation',skillIds:['probability.simulation'],status:'supplemental'},
  {id:'bayes',module:'probability',title:'Bayes Update Lab',href:'/labs/bayes',skillIds:['probability.bayes'],status:'supplemental'},
  {id:'interest',module:'finance',title:'Interest & Time Value Lab',href:'/labs/interest',skillIds:['finance.interest','finance.rate-equivalence','finance.tvm'],status:'live'},
  {id:'annuity',module:'finance',title:'Annuity Timeline Lab',href:'/labs/annuity',skillIds:['finance.annuity'],status:'live'},
  {id:'bonds',module:'finance',title:'Bond Pricing Lab',href:'/labs/bonds',skillIds:['finance.bonds'],status:'supplemental'},
  {id:'matrix-operations',module:'linear',title:'Matrix Operations Lab',href:'/labs/matrix-operations',skillIds:['linear.operations'],status:'live'},
  {id:'row-reduction',module:'linear',title:'Gauss–Jordan & Systems Lab',href:'/labs/row-reduction',skillIds:['linear.rref','linear.inverse','linear.systems'],status:'live'},
  {id:'linear-programming',module:'applications',title:'Linear Programming Lab',href:'/labs/linear-programming',skillIds:['applications.lp','applications.simplex'],status:'live'},
  {id:'game-theory',module:'applications',title:'Game Theory Lab',href:'/labs/game-theory',skillIds:['applications.game-theory'],status:'live'},
  {id:'markov',module:'applications',title:'Markov Chain Lab',href:'/labs/markov',skillIds:['applications.markov'],status:'supplemental'}
 ],
 featureFlags:{formalProofDirect:true,formalProofConditionalExperimental:true,formalProofIndirectExperimental:true,probabilityExpectedValueSupplemental:true,markovSupplemental:true,simplexSupplemental:true}
};
export const logicSkills=currentCourseProfile.skills.filter(s=>s.module==='logic');
export const probabilitySkills=currentCourseProfile.skills.filter(s=>s.module==='probability');
export const financeSkills=currentCourseProfile.skills.filter(s=>s.module==='finance');
export const linearSkills=currentCourseProfile.skills.filter(s=>s.module==='linear');
export const applicationSkills=currentCourseProfile.skills.filter(s=>s.module==='applications');
export const liveLabs=currentCourseProfile.labs.filter(l=>l.status==='live');
export const allAvailableLabs=currentCourseProfile.labs.filter(l=>l.status==='live'||l.status==='supplemental');

export * from './skill-graph.ts';
export * from './presets.ts';
