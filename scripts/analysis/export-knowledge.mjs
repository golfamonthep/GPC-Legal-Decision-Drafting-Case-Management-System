// Generates PRIVATE artifacts. Do not commit the output or upload to a public bucket.
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {loadKnowledge,sha} from './local-knowledge.mjs';
const root=process.argv[2],out=process.argv[3];
if(!root||!out)throw new Error('Usage: node scripts/analysis/export-knowledge.mjs <verified-local-bundle-root> <private-output-directory>');
const k=loadKnowledge(path.resolve(root));
try{
 mkdirSync(out,{recursive:true});
 const sources=k.summary.sources.map(s=>{const bytes=k.source(s.filename);if(!bytes||sha(bytes)!==s.sha256)throw new Error('SOURCE_HASH_MISMATCH');const object_key='knowledge/'+k.summary.fingerprint+'/'+s.sha256+'.pdf';writeFileSync(path.join(out,s.sha256+'.pdf'),bytes);return {...s,object_key};});
 const snapshot={format:'gpc-analysis-knowledge-v1',summary:{...k.summary,sources},records:[...k.all.values()],seniority:k.seniority,accounts:k.accounts};
 const bytes=Buffer.from(JSON.stringify(snapshot),'utf8');writeFileSync(path.join(out,'knowledge.json'),bytes);
 writeFileSync(path.join(out,'upload-manifest.json'),JSON.stringify({bucket:'analysis-private',private_required:true,files:[{file:'knowledge.json',object_key:'knowledge/'+k.summary.fingerprint+'/knowledge.json',sha256:sha(bytes)},...sources.map(s=>({file:s.sha256+'.pdf',object_key:s.object_key,sha256:s.sha256}))]},null,2));
 console.log(JSON.stringify({verified:true,sources:sources.length,records:snapshot.records.length,snapshot_bytes:bytes.length,knowledge_sha256:sha(bytes),knowledge_object:'knowledge/'+k.summary.fingerprint+'/knowledge.json'}));
}finally{k.db.close();}
