import type{ContentMeta,LabDraft,LocalSetting,LocalSnapshot,MasteryRecord,PersistedAttempt,PersistencePort}from'./types.ts';
import{CURRENT_SCHEMA_VERSION}from'./types.ts';import{validateSnapshot}from'./validation.ts';
export class MemoryPersistence implements PersistencePort{
 private drafts=new Map<string,LabDraft>();private attempts=new Map<string,PersistedAttempt>();private mastery=new Map<string,MasteryRecord>();private settings=new Map<string,LocalSetting>();private contentMeta?:ContentMeta;
 async getLabDraft<T=unknown>(id:string){return this.drafts.get(id) as LabDraft<T>|undefined;} async listLabDrafts(){return[...this.drafts.values()].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
 async saveLabDraft<T=unknown>(d:LabDraft<T>){this.drafts.set(d.labId,d as LabDraft);} async deleteLabDraft(id:string){this.drafts.delete(id);}
 async saveAttempt<T=unknown>(a:PersistedAttempt<T>){this.attempts.set(a.attemptId,a as PersistedAttempt);} async listAttempts(e?:string){return[...this.attempts.values()].filter(a=>!e||a.exerciseId===e).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
 async getMastery(id:string){return this.mastery.get(id);} async listMastery(){return[...this.mastery.values()].sort((a,b)=>a.skillId.localeCompare(b.skillId));} async saveMastery(r:MasteryRecord){this.mastery.set(r.skillId,r);}
 async getSetting<T=unknown>(k:string){return this.settings.get(k)?.value as T|undefined;} async listSettings(){return[...this.settings.values()].sort((a,b)=>a.key.localeCompare(b.key));} async setSetting<T=unknown>(k:string,v:T,u:string){this.settings.set(k,{key:k,value:v,updatedAt:u});}
 async getContentMeta(){return this.contentMeta;} async setContentMeta(m:ContentMeta){this.contentMeta=m;}
 async exportSnapshot(now:string):Promise<LocalSnapshot>{return{exportedAt:now,schemaVersion:CURRENT_SCHEMA_VERSION,drafts:await this.listLabDrafts(),attempts:await this.listAttempts(),mastery:await this.listMastery(),settings:await this.listSettings(),contentMeta:this.contentMeta};}
 async importSnapshot(s:LocalSnapshot){const v=validateSnapshot(s);await this.clearAll();for(const x of v.drafts)this.drafts.set(x.labId,x);for(const x of v.attempts)this.attempts.set(x.attemptId,x);for(const x of v.mastery)this.mastery.set(x.skillId,x);for(const x of v.settings)this.settings.set(x.key,x);this.contentMeta=v.contentMeta;}
 async clearAll(){this.drafts.clear();this.attempts.clear();this.mastery.clear();this.settings.clear();this.contentMeta=undefined;}
}
