import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {canonicalSkillId,moduleForSkill} from '../../apps/web/src/lib/mastery-targets.ts';

async function filesUnder(directory:string):Promise<string[]>{
 const entries=await readdir(directory,{withFileTypes:true});const files:string[]=[];
 for(const entry of entries){const full=path.join(directory,entry.name);if(entry.isDirectory())files.push(...await filesUnder(full));else if(/\.(ts|tsx|astro)$/.test(entry.name))files.push(full);}
 return files;
}

test('literal progress instrumentation uses declared or explicitly aliased skill ids',async()=>{
 const files=await filesUnder('apps/web/src');const found=new Set<string>();
 const patterns = [
   /recordSkillEvidence\(\s*['"]([^'"]+)['"]/g,
   /skillIds\s*:\s*\[\s*['"]([^'"]+)['"]/g,
   /skillId\s*:\s*['"]([^'"]+)['"]/g,
 ];
 for(const file of files){const source=await readFile(file,'utf8');for(const pattern of patterns){for(const match of source.matchAll(pattern))found.add(match[1]!);}}
 const unknown=[...found].filter(id=>!moduleForSkill(canonicalSkillId(id)));
 assert.deepEqual(unknown,[],`Unknown instrumentation skill ids: ${unknown.join(', ')}`);
});
