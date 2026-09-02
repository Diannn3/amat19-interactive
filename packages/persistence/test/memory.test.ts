import assert from 'node:assert/strict';
import test from 'node:test';
import { MemoryPersistence } from '../src/memory.ts';
import { CURRENT_SCHEMA_VERSION, type MasteryRecord } from '../src/types.ts';
import { validateSnapshot } from '../src/validation.ts';
import { projectSnapshotForScope } from '../src/snapshot.ts';

test('memory persistence supports v3 snapshot roundtrip', async () => {
  const db = new MemoryPersistence();
  await db.saveLabDraft({ labId: 'logic.truth-table', contentVersion: '2', updatedAt: '2026', state: { expression: 'P' } });
  await db.saveAttempt({ attemptId: 'a', exerciseId: 'e', module: 'logic', startedAt: '2026', updatedAt: '2026', finalState: 'correct', payload: {}, skillIds:['logic.truth-table.evaluate'] });
  await db.saveMastery({ skillId: 'logic.truth-values', evidenceScore: .8, attempts: 3, independentSuccesses:2, lastPracticed: '2026' });
  await db.saveSession({sessionId:'s',exerciseId:'e',module:'logic',skillIds:['logic.truth-values'],startedAt:'2026',updatedAt:'2026',outcome:'active',payload:{row:2}});
  await db.saveItem({id:'saved-1',kind:'lesson',title:'Truth tables',href:'/lessons/logic/truth-tables',createdAt:'2026',updatedAt:'2026',payload:{}});
  await db.setSetting('motion', 'reduced', '2026');
  const snap = await db.exportSnapshot('2026');
  assert.equal(snap.schemaVersion, CURRENT_SCHEMA_VERSION);
  const next = new MemoryPersistence();
  await next.importSnapshot(snap);
  assert.equal((await next.getLabDraft<{ expression: string }>('logic.truth-table'))?.state.expression, 'P');
  assert.equal((await next.listSessions()).length,1);
  assert.equal((await next.listSavedItems()).length,1);
  assert.equal(await next.getSetting('motion'), 'reduced');
  await next.clearAll();
  assert.equal((await next.listAttempts()).length, 0);
});

test('atomic mastery updater preserves every increment',async()=>{
 const db=new MemoryPersistence();
 const update=()=>db.updateMastery('logic.truth-values',(previous):MasteryRecord=>({
   skillId:'logic.truth-values',evidenceScore:1,attempts:(previous?.attempts??0)+1,independentSuccesses:(previous?.independentSuccesses??0)+1,lastPracticed:'2026'
 }));
 await Promise.all(Array.from({length:40},()=>update()));
 const record=await db.getMastery('logic.truth-values');
 assert.equal(record?.attempts,40);assert.equal(record?.independentSuccesses,40);
});

test('atomic mastery updater cannot mutate the record key',async()=>{
 const db=new MemoryPersistence();
 await assert.rejects(()=>db.updateMastery('logic.truth-values',()=>({skillId:'other',evidenceScore:1,attempts:1,lastPracticed:'2026'})),/cannot change/i);
});

test('snapshot validator migrates compatible v2 exports',()=>{
 const migrated=validateSnapshot({exportedAt:'2026',schemaVersion:2,drafts:[],attempts:[],mastery:[],settings:[]});
 assert.equal(migrated.schemaVersion,3);assert.deepEqual(migrated.sessions,[]);assert.deepEqual(migrated.savedItems,[]);
});

test('snapshot validator rejects incompatible schema', () => {
  assert.throws(() => validateSnapshot({ exportedAt: 'now', schemaVersion: 99, drafts: [], attempts: [], mastery: [], settings: [],sessions:[],savedItems:[] }), /not supported/);
});

test('snapshot validator rejects malformed optional counters, settings, and content metadata',()=>{
 const base={exportedAt:'2026',schemaVersion:3,drafts:[],attempts:[],mastery:[],settings:[],sessions:[],savedItems:[]};
 assert.throws(()=>validateSnapshot({...base,mastery:[{skillId:'x',evidenceScore:.8,attempts:2,lastPracticed:'2026',streak:-1}]}),/mastery/i);
 assert.throws(()=>validateSnapshot({...base,settings:[{key:'motion',updatedAt:'2026'}]}),/settings/i);
 assert.throws(()=>validateSnapshot({...base,contentMeta:{id:'wrong',courseVersion:'x',schemaVersion:3,updatedAt:'2026'}}),/metadata/i);
});


test('progress-only backup restore preserves drafts, settings, sessions, and saved items', async()=>{
 const currentDb=new MemoryPersistence();
 await currentDb.saveLabDraft({labId:'draft',contentVersion:'1',updatedAt:'2026',state:{x:1}});
 await currentDb.saveAttempt({attemptId:'old',exerciseId:'e',module:'logic',startedAt:'2026',updatedAt:'2026',finalState:'incomplete',payload:{}});
 await currentDb.saveMastery({skillId:'logic.truth-table.evaluate',evidenceScore:.2,attempts:1,lastPracticed:'2026'});
 await currentDb.saveSession({sessionId:'session',exerciseId:'e',module:'logic',skillIds:['logic.truth-table.evaluate'],startedAt:'2026',updatedAt:'2026',outcome:'active',payload:{}});
 await currentDb.saveItem({id:'saved',kind:'bookmark',title:'Keep me',createdAt:'2026',updatedAt:'2026',payload:{}});
 await currentDb.setSetting('motion','reduced','2026');
 await currentDb.setContentMeta({id:'current',courseVersion:'current-course',schemaVersion:CURRENT_SCHEMA_VERSION,updatedAt:'2026'});
 const current=await currentDb.exportSnapshot('2026-current');
 const donorDb=new MemoryPersistence();
 await donorDb.setContentMeta({id:'current',courseVersion:'stale-course',schemaVersion:CURRENT_SCHEMA_VERSION,updatedAt:'2025'});
 await donorDb.saveAttempt({attemptId:'new',exerciseId:'e2',module:'logic',startedAt:'2027',updatedAt:'2027',finalState:'correct',payload:{}});
 await donorDb.saveMastery({skillId:'logic.truth-table.evaluate',evidenceScore:1,attempts:3,lastPracticed:'2027'});
 const incoming=projectSnapshotForScope(await donorDb.exportSnapshot('2027'),'progress');
 const restored=currentDb;
 await restored.importSnapshot(incoming);
 assert.equal((await restored.listAttempts())[0]?.attemptId,'new');
 assert.equal((await restored.listMastery())[0]?.evidenceScore,1);
 assert.equal((await restored.listLabDrafts()).length,1);
 assert.equal((await restored.listSessions()).length,1);
 assert.equal((await restored.listSavedItems())[0]?.id,'saved');
 assert.equal(await restored.getSetting('motion'),'reduced');
 assert.equal((await restored.getContentMeta())?.courseVersion,'current-course');
});

test('saved-only backup restore preserves progress and other local collections', async()=>{
 const currentDb=new MemoryPersistence();
 await currentDb.saveAttempt({attemptId:'keep-progress',exerciseId:'e',module:'logic',startedAt:'2026',updatedAt:'2026',finalState:'correct',payload:{}});
 await currentDb.saveMastery({skillId:'logic.truth-table.evaluate',evidenceScore:.8,attempts:2,lastPracticed:'2026'});
 await currentDb.saveItem({id:'old-saved',kind:'bookmark',title:'Old',createdAt:'2026',updatedAt:'2026',payload:{}});
 const current=await currentDb.exportSnapshot('2026');
 const donorDb=new MemoryPersistence();await donorDb.saveItem({id:'new-saved',kind:'lesson',title:'New',createdAt:'2027',updatedAt:'2027',payload:{}});
 const incoming=projectSnapshotForScope(await donorDb.exportSnapshot('2027'),'saved');
 const restored=currentDb;await restored.importSnapshot(incoming);
 assert.equal((await restored.listAttempts())[0]?.attemptId,'keep-progress');
 assert.equal((await restored.listMastery()).length,1);
 assert.deepEqual((await restored.listSavedItems()).map(x=>x.id),['new-saved']);
});

test('snapshot validator rejects unknown scoped restore modes',()=>{
 const base={exportedAt:'2026',schemaVersion:3,drafts:[],attempts:[],mastery:[],settings:[],sessions:[],savedItems:[]};
 assert.throws(()=>validateSnapshot({...base,snapshotScope:'everything'}),/scope/i);
});


test('atomic assessment commit serializes repeat detection with attempt and mastery mutation',async()=>{
 const db=new MemoryPersistence();
 const commit=(id:string)=>db.commitAttemptAndMastery({
  exerciseId:'e',skillId:'skill',priorAttemptMatches:a=>(a.payload as any)?.fingerprint==='same'&&(a.payload as any)?.independent===true,
  buildAttempt:hasPrior=>({attemptId:id,exerciseId:'e',module:'logic',startedAt:'2026',updatedAt:'2026',finalState:'correct',payload:{fingerprint:'same',independent:!hasPrior},skillIds:['skill']}),
  updateMastery:(previous,hasPrior)=>({skillId:'skill',evidenceScore:1,attempts:(previous?.attempts??0)+1,independentSuccesses:(previous?.independentSuccesses??0)+(hasPrior?0:1),assistedSuccesses:(previous?.assistedSuccesses??0)+(hasPrior?1:0),lastPracticed:'2026'})
 });
 const [a,b]=await Promise.all([commit('a'),commit('b')]);
 assert.deepEqual([a.hasPriorMatch,b.hasPriorMatch].sort(),[false,true]);
 const mastery=await db.getMastery('skill');assert.equal(mastery?.independentSuccesses,1);assert.equal(mastery?.assistedSuccesses,1);assert.equal((await db.listAttempts('e')).length,2);
});

test('atomic assessment commit validates all mutations before changing memory state',async()=>{
 const db=new MemoryPersistence();
 await assert.rejects(()=>db.commitAttemptAndMastery({exerciseId:'e',skillId:'skill',priorAttemptMatches:()=>false,buildAttempt:()=>({attemptId:'a',exerciseId:'wrong',module:'logic',startedAt:'2026',updatedAt:'2026',finalState:'correct',payload:{}})}),/mismatch/i);
 assert.equal((await db.listAttempts()).length,0);
});
