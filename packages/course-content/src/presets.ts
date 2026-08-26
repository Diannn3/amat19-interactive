import type { ModuleId } from './index.ts';
export type PracticePreset={id:string;label:string;description:string;modules?:ModuleId[];skillIds?:string[];count:number;adaptive:'none'|'weak'|'recent-mistakes'|'review'};
export const practicePresets:PracticePreset[]=[
 {id:'quick-5',label:'Quick 5',description:'A five-question retrieval burst across the current course.',count:5,adaptive:'review'},
 {id:'weak-areas',label:'Weak Areas',description:'Prioritize skills with low or sparse saved evidence.',count:8,adaptive:'weak'},
 {id:'recent-mistakes',label:'Recent Mistakes',description:'Repair skills attached to recent incorrect attempts.',count:6,adaptive:'recent-mistakes'},
 {id:'logic-drill',label:'Logic Drill',description:'Truth values, equivalence, validity, and proof selection.',modules:['logic'],count:8,adaptive:'review'},
 {id:'probability-drill',label:'Probability Drill',description:'Counting, conditioning, independence, and exact probability.',modules:['probability'],count:8,adaptive:'review'},
 {id:'finance-drill',label:'Finance Drill',description:'Interest, rate equivalence, time value, and annuities.',modules:['finance'],count:8,adaptive:'review'},
 {id:'matrices-drill',label:'Matrices Drill',description:'Matrix operations, row reduction, inverse, and systems.',modules:['linear'],count:8,adaptive:'review'},
 {id:'applications-drill',label:'Applications Drill',description:'Linear programming and zero-sum game analysis.',modules:['applications'],count:8,adaptive:'review'},
 {id:'exam-mix',label:'Exam Mix',description:'Balanced whole-course questions with feedback held until the end.',count:12,adaptive:'none'}
];
export function getPracticePreset(id:string){return practicePresets.find(preset=>preset.id===id)}
