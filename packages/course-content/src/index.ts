export type ContentStatus = 'implemented' | 'engine-ready' | 'planned' | 'supplemental';
export type ModuleId = 'logic' | 'probability' | 'finance' | 'linear' | 'applications';
export type SkillDefinition = { id:string; module:ModuleId; title:string; description:string; status:ContentStatus; prerequisiteIds:string[]; relatedLab?:string };
export type ModuleDefinition = { id:ModuleId; order:number; title:string; description:string; status:ContentStatus; href:string };
export type LabDefinition = { id:string; module:ModuleId; title:string; href:string; skillIds:string[]; status:'live'|'experimental'|'supplemental'|'planned' };
export type WorkbenchDefinition = { id:ModuleId; title:string; description:string; notation:string; href:string; absorbedLabIds:string[] };
export type CourseProfile = { id:string; label:string; authority:string; modules:ModuleDefinition[]; workbenches:WorkbenchDefinition[]; skills:SkillDefinition[]; labs:LabDefinition[]; featureFlags:Record<string,boolean> };
export type LegacyLabAlias = { workbenchId:ModuleId; destination:string; legacyModes?:Record<string,string> };
export const COURSE_VERSION='amat19-core-v1';
export const legacyLabAliases:Record<string,LegacyLabAlias>={
 'logic-basics':{workbenchId:'logic',destination:'/workbenches/logic?mode=table'},
 'truth-table':{workbenchId:'logic',destination:'/workbenches/logic?mode=table',legacyModes:{argument:'/workbenches/logic?mode=argument'}},
 'equivalence':{workbenchId:'logic',destination:'/workbenches/logic?mode=compare'},
 'formal-proof':{workbenchId:'logic',destination:'/workbenches/logic?mode=proof'},
 'counting':{workbenchId:'probability',destination:'/workbenches/probability?mode=counting'},
 'conditional-probability':{workbenchId:'probability',destination:'/workbenches/probability?mode=conditioning'},
 'distribution':{workbenchId:'probability',destination:'/workbenches/probability?mode=conditioning'},
 'probability-simulation':{workbenchId:'probability',destination:'/workbenches/probability?mode=verify'},
 'bayes':{workbenchId:'probability',destination:'/workbenches/probability?mode=bayes'},
 'interest':{workbenchId:'finance',destination:'/workbenches/finance?scenario=cashflows'},
 'cashflow-timeline':{workbenchId:'finance',destination:'/workbenches/finance?scenario=cashflows'},
 'annuity':{workbenchId:'finance',destination:'/workbenches/finance?scenario=annuity'},
 'bonds':{workbenchId:'finance',destination:'/workbenches/finance?scenario=bond'},
 'matrix-operations':{workbenchId:'linear',destination:'/workbenches/linear?goal=rref'},
 'row-reduction':{workbenchId:'linear',destination:'/workbenches/linear?goal=system'},
 'linear-programming':{workbenchId:'applications',destination:'/workbenches/applications?mode=linear'},
 'game-theory':{workbenchId:'applications',destination:'/workbenches/applications?mode=game'},
 'markov':{workbenchId:'applications',destination:'/workbenches/applications?mode=advanced'}
};
export const currentCourseProfile:CourseProfile={
 id:'course-guide', label:'AMAT 19 · Finite Mathematics', authority:'Official course syllabus guide; original app explanations and generated practice',
 modules:[
  {id:'logic',order:1,title:'Logic',description:'Propositions, truth values, equivalence, inference, validity, and proof.',status:'implemented',href:'/modules/logic'},
  {id:'probability',order:2,title:'Probability',description:'Counting, inclusion–exclusion, exact probability, conditioning, independence, and supplemental distributions.',status:'implemented',href:'/modules/probability'},
  {id:'finance',order:3,title:'Financial Mathematics',description:'Interest measurement, simple/compound interest, rate equivalence, time value of money, and annuities.',status:'implemented',href:'/modules/finance'},
  {id:'linear',order:4,title:'Matrices & Systems',description:'Matrix operations, multiplication, inverse, row reduction, and systems of linear equations.',status:'implemented',href:'/modules/linear'},
  {id:'applications',order:5,title:'Applications',description:'Graphical linear programming, game theory, simplex synchronization, and supplemental Markov chains.',status:'implemented',href:'/modules/applications'}
 ],
 workbenches:[
  {id:'logic',title:'Logic & Proof',description:'Translate statements, test arguments, and build a valid proof one step at a time.',notation:'P → Q',href:'/workbenches/logic',absorbedLabIds:['logic-basics','truth-table','equivalence','formal-proof']},
  {id:'probability',title:'Probability Model Builder',description:'Choose a counting or probability model, then compare its table, tree, and exact fraction.',notation:'P(A | B)',href:'/workbenches/probability',absorbedLabIds:['counting','conditional-probability','distribution','probability-simulation','bayes']},
  {id:'finance',title:'Money Timeline',description:'Place cash flows on a timeline and move every amount to one focal date.',notation:'F = P(1 + i)ⁿ',href:'/workbenches/finance',absorbedLabIds:['interest','cashflow-timeline','annuity','bonds']},
  {id:'linear',title:'Row Operations Coach',description:'Perform row operations, inspect the arithmetic, and classify the resulting system.',notation:'R₂ ← R₂ − 2R₁',href:'/workbenches/linear',absorbedLabIds:['matrix-operations','row-reduction']},
  {id:'applications',title:'Optimization & Strategy',description:'Formulate an optimization or strategy model before solving it.',notation:'max z = cᵀx',href:'/workbenches/applications',absorbedLabIds:['linear-programming','game-theory','markov']}
 ],
 skills:[
  {id:'logic.propositions',module:'logic',title:'Propositions & connectives',description:'Recognize proposition structure and connect controlled language to logical symbols.',status:'implemented',prerequisiteIds:[],relatedLab:'/workbenches/logic?mode=table'},
  {id:'logic.truth-values',module:'logic',title:'Truth values & truth tables',description:'Generate assignments, evaluate subexpressions, and classify propositions.',status:'implemented',prerequisiteIds:['logic.propositions'],relatedLab:'/workbenches/logic?mode=table'},
  {id:'logic.equivalence',module:'logic',title:'Logical equivalence',description:'Compare propositions semantically and validate named equivalence-rule rewrites.',status:'implemented',prerequisiteIds:['logic.truth-values'],relatedLab:'/workbenches/logic?mode=compare'},
  {id:'logic.argument-validity',module:'logic',title:'Argument validity',description:'Find or rule out true-premise/false-conclusion counterexamples.',status:'implemented',prerequisiteIds:['logic.truth-values'],relatedLab:'/workbenches/logic?mode=argument'},
  {id:'logic.formal-proof',module:'logic',title:'Formal proof',description:'Build line-by-line derivations using configured equivalence and inference rules.',status:'implemented',prerequisiteIds:['logic.equivalence','logic.argument-validity'],relatedLab:'/workbenches/logic?mode=proof'},
  {id:'probability.counting',module:'probability',title:'Permutation & combination',description:'Choose a counting model based on order and repetition, then calculate exact counts.',status:'implemented',prerequisiteIds:[],relatedLab:'/workbenches/probability?mode=counting'},
  {id:'probability.inclusion-exclusion',module:'probability',title:'Inclusion–exclusion',description:'Count unions without double-counting intersections.',status:'implemented',prerequisiteIds:['probability.counting'],relatedLab:'/workbenches/probability?mode=counting'},
  {id:'probability.basic',module:'probability',title:'Basic probability',description:'Represent favorable outcomes and sample spaces with exact rational values.',status:'implemented',prerequisiteIds:['probability.counting'],relatedLab:'/workbenches/probability?mode=conditioning'},
  {id:'probability.conditional',module:'probability',title:'Conditional probability',description:'Restrict the active universe and compare P(A|B) with P(B|A).',status:'implemented',prerequisiteIds:['probability.basic'],relatedLab:'/workbenches/probability?mode=conditioning'},
  {id:'probability.independence',module:'probability',title:'Independence',description:'Test independence by exact probability identities.',status:'implemented',prerequisiteIds:['probability.conditional'],relatedLab:'/workbenches/probability?mode=conditioning'},
  {id:'probability.distribution',module:'probability',title:'Discrete distributions',description:'Supplemental expected value and variance with exact rational probabilities.',status:'supplemental',prerequisiteIds:['probability.basic']},
  {id:'probability.simulation',module:'probability',title:'Probability simulation',description:'Supplemental seeded simulation comparing empirical frequency with theoretical probability.',status:'supplemental',prerequisiteIds:['probability.basic'],relatedLab:'/workbenches/probability?mode=verify'},
  {id:'probability.bayes',module:'probability',title:'Bayes & total probability',description:'Supplemental prior-to-posterior updating with exact tree and table representations.',status:'supplemental',prerequisiteIds:['probability.conditional'],relatedLab:'/workbenches/probability?mode=bayes'},
  {id:'finance.interest',module:'finance',title:'Interest measurement',description:'Distinguish simple, effective compound, and nominal-rate accumulation.',status:'implemented',prerequisiteIds:[],relatedLab:'/workbenches/finance?scenario=cashflows'},
  {id:'finance.rate-equivalence',module:'finance',title:'Equivalent rates',description:'Convert nominal and annual effective rates by matching one-year accumulation.',status:'implemented',prerequisiteIds:['finance.interest'],relatedLab:'/workbenches/finance?scenario=cashflows'},
  {id:'finance.tvm',module:'finance',title:'Time value of money',description:'Move cash flows to a common focal date before comparing or combining them.',status:'implemented',prerequisiteIds:['finance.interest'],relatedLab:'/workbenches/finance?scenario=cashflows'},
  {id:'finance.annuity',module:'finance',title:'Annuities',description:'Value level payment streams as immediate or due, at present or future focal dates.',status:'implemented',prerequisiteIds:['finance.tvm'],relatedLab:'/workbenches/finance?scenario=annuity'},
  {id:'finance.bonds',module:'finance',title:'Bond pricing',description:'Supplemental coupon/redemption valuation with premium and discount interpretation.',status:'supplemental',prerequisiteIds:['finance.annuity','finance.rate-equivalence'],relatedLab:'/workbenches/finance?scenario=bond'},
  {id:'linear.operations',module:'linear',title:'Matrix operations',description:'Check dimensions, add, transpose, multiply, and inspect row-by-column products.',status:'implemented',prerequisiteIds:[],relatedLab:'/workbenches/linear?goal=rref'},
  {id:'linear.inverse',module:'linear',title:'Inverse of a matrix',description:'Use Gauss–Jordan elimination on [A | I] and detect singular matrices.',status:'implemented',prerequisiteIds:['linear.operations'],relatedLab:'/workbenches/linear?goal=inverse'},
  {id:'linear.rref',module:'linear',title:'Row reduction',description:'Track elementary row operations to reduced row echelon form.',status:'implemented',prerequisiteIds:['linear.operations'],relatedLab:'/workbenches/linear?goal=rref'},
  {id:'linear.systems',module:'linear',title:'Systems of linear equations',description:'Classify systems as unique, infinite, or inconsistent from exact RREF structure.',status:'implemented',prerequisiteIds:['linear.rref'],relatedLab:'/workbenches/linear?goal=system'},
  {id:'applications.lp',module:'applications',title:'Graphical linear programming',description:'Construct a feasible region, enumerate corners, and optimize an objective over feasible points.',status:'implemented',prerequisiteIds:['linear.systems'],relatedLab:'/workbenches/applications?mode=linear'},
  {id:'applications.simplex',module:'applications',title:'Simplex tableau',description:'Supplemental deterministic pivot trace synchronized with supported graphical maximization models.',status:'supplemental',prerequisiteIds:['applications.lp'],relatedLab:'/workbenches/applications?mode=advanced'},
  {id:'applications.game-theory',module:'applications',title:'Game theory',description:'Analyze security levels, saddle points, strict dominance, and 2×2 zero-sum mixtures.',status:'implemented',prerequisiteIds:['linear.operations'],relatedLab:'/workbenches/applications?mode=game'},
  {id:'applications.markov',module:'applications',title:'Markov chains',description:'Supplemental transition matrices, k-step movement, and two-state stationary distributions.',status:'supplemental',prerequisiteIds:['linear.operations','probability.basic'],relatedLab:'/workbenches/applications?mode=advanced'}
 ],
 labs:[
  {id:'logic-basics',module:'logic',title:'Logic Basics',href:'/workbenches/logic?mode=table',skillIds:['logic.propositions'],status:'live'},
  {id:'truth-table',module:'logic',title:'Truth Table Lab',href:'/workbenches/logic?mode=table',skillIds:['logic.truth-values','logic.argument-validity'],status:'live'},
  {id:'equivalence',module:'logic',title:'Equivalence Lab',href:'/workbenches/logic?mode=compare',skillIds:['logic.equivalence'],status:'live'},
  {id:'formal-proof',module:'logic',title:'Formal Proof Workspace',href:'/workbenches/logic?mode=proof',skillIds:['logic.formal-proof'],status:'live'},
  {id:'counting',module:'probability',title:'Counting Explorer',href:'/workbenches/probability?mode=counting',skillIds:['probability.counting','probability.inclusion-exclusion'],status:'live'},
  {id:'conditional-probability',module:'probability',title:'Conditional Probability Lab',href:'/workbenches/probability?mode=conditioning',skillIds:['probability.basic','probability.conditional','probability.independence'],status:'live'},
  {id:'distribution',module:'probability',title:'Discrete Distribution Lab',href:'/workbenches/probability?mode=conditioning',skillIds:['probability.distribution'],status:'supplemental'},
  {id:'probability-simulation',module:'probability',title:'Probability Simulation Lab',href:'/workbenches/probability?mode=verify',skillIds:['probability.simulation'],status:'supplemental'},
  {id:'bayes',module:'probability',title:'Bayes Update Lab',href:'/workbenches/probability?mode=bayes',skillIds:['probability.bayes'],status:'supplemental'},
  {id:'interest',module:'finance',title:'Interest & Time Value Lab',href:'/workbenches/finance?scenario=cashflows',skillIds:['finance.interest','finance.rate-equivalence','finance.tvm'],status:'live'},
  {id:'cashflow-timeline',module:'finance',title:'Cash-flow Timeline Lab',href:'/workbenches/finance?scenario=cashflows',skillIds:['finance.tvm'],status:'live'},
  {id:'annuity',module:'finance',title:'Annuity Timeline Lab',href:'/workbenches/finance?scenario=annuity',skillIds:['finance.annuity'],status:'live'},
  {id:'bonds',module:'finance',title:'Bond Pricing Lab',href:'/workbenches/finance?scenario=bond',skillIds:['finance.bonds'],status:'supplemental'},
  {id:'matrix-operations',module:'linear',title:'Matrix Operations Lab',href:'/workbenches/linear?goal=rref',skillIds:['linear.operations'],status:'live'},
  {id:'row-reduction',module:'linear',title:'Gauss–Jordan & Systems Lab',href:'/workbenches/linear?goal=system',skillIds:['linear.rref','linear.inverse','linear.systems'],status:'live'},
  {id:'linear-programming',module:'applications',title:'Linear Programming Lab',href:'/workbenches/applications?mode=linear',skillIds:['applications.lp','applications.simplex'],status:'live'},
  {id:'game-theory',module:'applications',title:'Game Theory Lab',href:'/workbenches/applications?mode=game',skillIds:['applications.game-theory'],status:'live'},
  {id:'markov',module:'applications',title:'Markov Chain Lab',href:'/workbenches/applications?mode=advanced',skillIds:['applications.markov'],status:'supplemental'}
 ],
 featureFlags:{formalProofDirect:true,formalProofConditionalExperimental:true,formalProofIndirectExperimental:true,probabilityExpectedValueSupplemental:true,markovSupplemental:true,simplexSupplemental:true}
};
export const logicSkills=currentCourseProfile.skills.filter(s=>s.module==='logic');
export const probabilitySkills=currentCourseProfile.skills.filter(s=>s.module==='probability');
export const financeSkills=currentCourseProfile.skills.filter(s=>s.module==='finance');
export const linearSkills=currentCourseProfile.skills.filter(s=>s.module==='linear');
export const applicationSkills=currentCourseProfile.skills.filter(s=>s.module==='applications');
export const primaryWorkbenches=currentCourseProfile.workbenches;
export const workbenchForModule=(moduleId:ModuleId)=>currentCourseProfile.workbenches.find(workbench=>workbench.id===moduleId);
export const workbenchForLab=(labId:string)=>currentCourseProfile.workbenches.find(workbench=>workbench.absorbedLabIds.includes(labId));
export const liveLabs=currentCourseProfile.labs.filter(l=>l.status==='live');
export const allAvailableLabs=currentCourseProfile.labs.filter(l=>l.status==='live'||l.status==='supplemental');

export * from './skill-graph.ts';
export * from './presets.ts';
