import 'server-only';
import { storageRead,storageSignedRead } from './storage.mjs';
import { hash,fail } from './safety.mjs';
let cached;
export async function knowledge(){const key=process.env.ANALYSIS_KNOWLEDGE_OBJECT;const expected=process.env.ANALYSIS_KNOWLEDGE_SHA256;if(!key||!expected||!/^[a-f0-9]{64}$/.test(expected))fail('ฐานอ้างอิงส่วนวิเคราะห์ยังไม่ได้ย้ายเข้าพื้นที่ส่วนตัวบนเว็บ',503);
 if(cached?.key===key&&cached?.hash===expected)return cached.value;
 const bytes=await storageRead(key);if(bytes.length>30*1024*1024||hash(bytes)!==expected)fail('ฐานอ้างอิงไม่ผ่านการตรวจความครบถ้วน หยุดใช้แหล่งนี้',503);const p=JSON.parse(bytes.toString('utf8'));if(p.format!=='gpc-analysis-knowledge-v1'||p.summary.integrity!=='VERIFIED'||!Array.isArray(p.records)||!Array.isArray(p.seniority)||!Array.isArray(p.accounts))fail('รูปแบบฐานอ้างอิงไม่ถูกต้อง',503);
 const all=new Map(p.records.map(r=>[r.id,r]));const value={...p,all,search(q,kind){const text=String(q||'').replace(/\s+/g,'').toLowerCase();return p.records.filter(r=>(!kind||r.kind===kind)&&(text?(r.label+r.text).replace(/\s+/g,'').toLowerCase().includes(text):r.kind==='law')).slice(0,60);},async source(name){const s=p.summary.sources.find(x=>x.filename===name);if(!s||!s.object_key)fail('ไม่พบต้นฉบับ',404);const result=await storageRead(s.object_key);if(hash(result)!==s.sha256)fail('ต้นฉบับไม่ผ่านการตรวจ hash',503);return result;}};cached={key,hash:expected,value};return value;
}
export const missingKnowledge={version:null,fingerprint:null,integrity:'UNAVAILABLE',sources:[],appointments:null,seniority:null,accounts:[],chunk_count:null,exclusive_seniority_source:null};
