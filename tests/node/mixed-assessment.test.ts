import assert from 'node:assert/strict';
import test from 'node:test';
import {assessmentCoverage,generateMixedAssessment} from '../../apps/web/src/lib/mixed-assessment.ts';
import {aggregateMasteryForCourseSkill,canonicalMasteryMap,canonicalSkillId,canonicalizeSkillIds,masteryHierarchyIds,moduleForSkill} from '../../apps/web/src/lib/mastery-targets.ts';

test('targeted conditional practice only emits a genuinely conditional question',()=>{
 const questions=generateMixedAssessment('conditional-target',6,{skillId:'probability.conditional.denominator'});
 assert.equal(questions.length,6);
 assert.ok(questions.every(question=>question.skillId==='probability.conditional.denominator'));
});

test('targeted simple-interest practice forces the simple-interest generator branch',()=>{
 const questions=generateMixedAssessment('simple-target',5,{skillId:'finance.simple-interest'});
 assert.ok(questions.every(question=>question.skillId==='finance.simple-interest'));
 assert.ok(questions.every(question=>question.title==='Simple accumulation'));
});

test('unsupported targeted leaf practice falls back honestly without relabeling questions',()=>{
 const questions=generateMixedAssessment('proof-target',4,{skillId:'logic.proof.direct'});
 assert.ok(questions.every(question=>question.module==='logic'));
 assert.ok(questions.every(question=>question.skillId==='logic.truth-table.classify'));
 assert.ok(questions.every(question=>question.skillId!=='logic.proof.direct'));
});

test('assessment skill ids are all declared leaf skills or canonical current skills',()=>{
 const covered=new Set(assessmentCoverage().flatMap(entry=>entry.supportedSkillIds.map(canonicalSkillId)));
 for(const skill of ['logic.truth-values','probability.counting','finance.interest','linear.operations','applications.game-theory'])assert.ok(covered.has(skill));
});

test('skill hierarchy resolves parents and legacy game ids normalize',()=>{
 assert.deepEqual(masteryHierarchyIds('applications.lp.corner-point'),['applications.lp.corner-point','applications.lp']);
 assert.deepEqual(masteryHierarchyIds('logic.truth-values'),['logic.truth-values']);
 assert.equal(canonicalSkillId('games.saddle'),'applications.game.security');
 assert.deepEqual(canonicalizeSkillIds(['games.saddle','applications.game.security']),['applications.game.security']);
 assert.equal(moduleForSkill('games.saddle'),'applications');
});


test('parent progress can aggregate historical leaf-only evidence without duplicating storage',()=>{
 const records=[
  {skillId:'logic.truth-table.classify',evidenceScore:.9,attempts:2,independentSuccesses:1,lastPracticed:'2026-08-26'},
  {skillId:'logic.truth-table.evaluate',evidenceScore:.7,attempts:1,independentSuccesses:1,lastPracticed:'2026-08-27'}
 ];
 const parent=aggregateMasteryForCourseSkill('logic.truth-values',records);
 assert.equal(parent?.attempts,3);assert.equal(parent?.independentSuccesses,2);assert.equal(parent?.lastPracticed,'2026-08-27');
 assert.ok(Math.abs((parent?.evidenceScore??0)-(2.5/3))<1e-12);
});

test('canonical mastery map merges legacy aliases into the canonical leaf id',()=>{
 const map=canonicalMasteryMap([
  {skillId:'games.saddle',evidenceScore:.8,attempts:1,lastPracticed:'2026-08-26'},
  {skillId:'applications.game.security',evidenceScore:1,attempts:1,independentSuccesses:1,lastPracticed:'2026-08-27'}
 ]);
 const record=map.get('applications.game.security');
 assert.equal(record?.attempts,2);assert.equal(record?.lastPracticed,'2026-08-27');assert.equal(map.has('games.saddle'),false);
});

test('assessment count is bounded',()=>{
 assert.throws(()=>generateMixedAssessment('bad',0),/1 to 100/);
 assert.throws(()=>generateMixedAssessment('bad',101),/1 to 100/);
});
