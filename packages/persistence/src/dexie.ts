import Dexie,{type EntityTable}from'dexie';import type{ContentMeta,LabDraft,LocalSetting,LocalSnapshot,MasteryRecord,PersistedAttempt,PersistencePort}from'./types.ts';import{CURRENT_SCHEMA_VERSION}from'./types.ts';import{validateSnapshot}from'./validation.ts';
const DB_NAME='amat19-local';
class AmatDatabase extends Dexie{
 labDrafts!:EntityTable<LabDraft,'labId'>;attempts!:EntityTable<PersistedAttempt,'attemptId'>;mastery!:EntityTable<MasteryRecord,'skillId'>;settings!:EntityTable<LocalSetting,'key'>;contentMeta!:EntityTable<ContentMeta,'id'>;
 constructor(){super(DB_NAME);
  this.version(1).stores({labDrafts:'labId, updatedAt, contentVersion',attempts:'attemptId, exerciseId, module, updatedAt, finalState',mastery:'skillId, lastPracticed',settings:'key, updatedAt',contentMeta:'id, courseVersion, schemaVersion, updatedAt'});
  this.version(2).stores({labDrafts:'labId, updatedAt, contentVersion',attempts:'attemptId, exerciseId, module, startedAt, updatedAt, finalState',mastery:'skillId, attempts, lastPracticed',settings:'key, updatedAt',contentMeta:'id, courseVersion, schemaVersion, updatedAt'}).upgrade(tx=>tx.table('contentMeta').put({id:'current',courseVersion:'amat19-2026-pass3-full-course',schemaVersion:CURRENT_SCHEMA_VERSION,updatedAt:new Date().toISOString()}));
 }}
export class DexiePersistence implements PersistencePort{
 private db=new AmatDatabase();
 async getLabDraft<T=unknown>(id:string){return await this.db.labDrafts.get(id) as LabDraft<T>|undefined;} async listLabDrafts(){return this.db.labDrafts.orderBy('updatedAt').reverse().toArray();} async saveLabDraft<T=unknown>(d:LabDraft<T>){await this.db.labDrafts.put(d as LabDraft);} async deleteLabDraft(id:string){await this.db.labDrafts.delete(id);}
 async saveAttempt<T=unknown>(a:PersistedAttempt<T>){await this.db.attempts.put(a as PersistedAttempt);} async listAttempts(e?:string){return e?this.db.attempts.where('exerciseId').equals(e).reverse().sortBy('updatedAt'):this.db.attempts.orderBy('updatedAt').reverse().toArray();}
 async getMastery(id:string){return this.db.mastery.get(id);} async listMastery(){return this.db.mastery.orderBy('skillId').toArray();} async saveMastery(r:MasteryRecord){await this.db.mastery.put(r);}
 async getSetting<T=unknown>(k:string){return (await this.db.settings.get(k))?.value as T|undefined;} async listSettings(){return this.db.settings.orderBy('key').toArray();} async setSetting<T=unknown>(k:string,v:T,u:string){await this.db.settings.put({key:k,value:v,updatedAt:u});}
 async getContentMeta(){return this.db.contentMeta.get('current');} async setContentMeta(m:ContentMeta){await this.db.contentMeta.put(m);}
 async exportSnapshot(now:string):Promise<LocalSnapshot>{return{exportedAt:now,schemaVersion:CURRENT_SCHEMA_VERSION,drafts:await this.listLabDrafts(),attempts:await this.listAttempts(),mastery:await this.listMastery(),settings:await this.listSettings(),contentMeta:await this.getContentMeta()};}
 async importSnapshot(s:LocalSnapshot){const v=validateSnapshot(s);await this.db.transaction('rw',this.db.labDrafts,this.db.attempts,this.db.mastery,this.db.settings,this.db.contentMeta,async()=>{await Promise.all([this.db.labDrafts.clear(),this.db.attempts.clear(),this.db.mastery.clear(),this.db.settings.clear(),this.db.contentMeta.clear()]);if(v.drafts.length)await this.db.labDrafts.bulkPut(v.drafts);if(v.attempts.length)await this.db.attempts.bulkPut(v.attempts);if(v.mastery.length)await this.db.mastery.bulkPut(v.mastery);if(v.settings.length)await this.db.settings.bulkPut(v.settings);if(v.contentMeta)await this.db.contentMeta.put(v.contentMeta);});}
 async clearAll(){await Promise.all([this.db.labDrafts.clear(),this.db.attempts.clear(),this.db.mastery.clear(),this.db.settings.clear(),this.db.contentMeta.clear()]);}
}
