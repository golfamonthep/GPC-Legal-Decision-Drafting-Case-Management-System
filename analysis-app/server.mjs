import http from 'node:http';
import { createServer as createViteServer } from 'vite';
import { randomUUID } from 'node:crypto';
import { readFileSync,writeFileSync,mkdirSync,existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadKnowledge,sha,normalizeName } from './server/knowledge.mjs';
import { openStore } from './server/store.mjs';
import { analyze,sections } from './server/analysis.mjs';
import { localAiStatus,proposeLocalSection } from './server/ai.mjs';
import { transferService } from './server/transfers.mjs';
import { dashboardSnapshot } from './server/dashboard.mjs';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
for(const p of [path.join(ROOT,".env.local"),path.resolve(ROOT,"../.env.local"),path.join(ROOT,".env"),path.resolve(ROOT,"../.env")]){
  if(existsSync(p)&&typeof process.loadEnvFile==="function"){try{process.loadEnvFile(p);}catch{}}
}
const PORT=Number(process.env.ANALYSIS_PORT||4318);
const knowledge=loadKnowledge(path.resolve(ROOT,'../data/police-appointments-2569'));
const store=openStore(process.env.ANALYSIS_STATE_DIR||path.join(ROOT,'.state'));
const {db}=store;
const transfers=transferService({store,knowledge,runWorker,detail});
const registryOrigins=(process.env.ANALYSIS_REGISTRY_ORIGINS||'http://127.0.0.1:3000,http://localhost:3000').split(',').map(x=>x.trim()).filter(Boolean);
const PY=process.env.ANALYSIS_PYTHON||'C:\\Users\\polic\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';
const id=()=>randomUUID();
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
function send(res,data,status=200){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
function binary(res,bytes,mime,name){res.writeHead(200,{'Content-Type':mime,'Content-Length':bytes.length,'Content-Disposition':`${name?'attachment':'inline'}${name?`; filename="${name}"`:''}`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(Buffer.from(bytes));}
async function body(req){let size=0;const buffers=[];for await(const b of req){size+=b.length;if(size>30*1024*1024)fail('ไฟล์ใหญ่เกิน 20 MB',413);buffers.push(b);}try{return JSON.parse(Buffer.concat(buffers).toString('utf8'));}catch{fail('ข้อมูล JSON ไม่ถูกต้อง');}}
function runWorker(mode,payload){return new Promise((resolve,reject)=>{const proc=spawn(PY,[path.join(ROOT,'server/worker.py'),mode],{windowsHide:true,stdio:['pipe','pipe','pipe']});let out='';proc.stdout.on('data',x=>{out+=x.toString();if(out.length>2e6)proc.kill();});proc.stderr.on('data',()=>{});const timer=setTimeout(()=>{proc.kill();reject(new Error('อ่านเอกสารเกินเวลา โปรดตรวจและถอดข้อความเอง'));},60000);proc.on('error',e=>{clearTimeout(timer);reject(e);});proc.on('close',()=>{clearTimeout(timer);try{const r=JSON.parse(out);if(r.error)reject(new Error(r.error));else resolve(r);}catch{reject(new Error('อ่านหรือส่งออกเอกสารไม่สำเร็จ'));}});proc.stdin.end(JSON.stringify(payload));});}
function documents(jobId){return db.prepare('SELECT id,name,mime,sha256,data FROM documents WHERE job_id=?').all(jobId).map(d=>({...d,data:JSON.parse(d.data)}));}
function collection(table,jobId){return db.prepare(`SELECT id,created_at,data FROM ${table} WHERE job_id=? ORDER BY created_at DESC`).all(jobId).map(r=>({...r,data:JSON.parse(r.data)}));}
function detail(jobId){const j=store.job(jobId);return {...j,documents:documents(jobId),revisions:collection('revisions',jobId),runs:collection('runs',jobId),proposals:collection('proposals',jobId),exports:db.prepare('SELECT id,revision_id,created_at,sha256 FROM exports WHERE job_id=? ORDER BY created_at DESC').all(jobId)};}
function saveJob(j,data,expected){if(j.data.registry_transfer&&data.external_case_ref!==j.data.registry_transfer.black_number)fail('งานที่รับจากทะเบียนต้องคงเลขอ้างอิงเดิม');if(j.version!==expected)fail('ข้อมูลถูกแก้ในหน้าต่างอื่น กรุณาโหลดงานใหม่ก่อนบันทึก',409);const changed=db.prepare('UPDATE jobs SET data=?,title=?,version=version+1,updated_at=? WHERE id=? AND version=?').run(JSON.stringify(data),data.title||'งานวิเคราะห์',store.now(),j.id,expected);if(!changed.changes)fail('รุ่นข้อมูลเปลี่ยน กรุณาโหลดใหม่',409);}
function cleanInput(p,j){const fields=['title','external_case_ref','subject_name','rank_position','level','account','claim','response','issues'];const data={...j};for(const f of fields)if(f in p){if(typeof p[f]!=='string'||p[f].length>60000)fail('ข้อมูลช่อง '+f+' ไม่ถูกต้อง');data[f]=p[f].trim();}if(!data.title)fail('โปรดระบุชื่อเรื่อง');return data;}
function validateRefs(citations,j,docs){const ids=new Set([...(j.data.references||[]).filter(r=>r.reviewed&&r.role!=='reference_only').map(r=>r.id),...docs.filter(d=>d.data.reviewed).map(d=>'doc-'+d.id)]);if(!Array.isArray(citations)||citations.some(x=>!ids.has(x)))fail('แหล่งข้อเท็จจริงต้องเป็นเอกสารที่ตรวจแล้วของงานนี้ ห้ามใช้ข้อเท็จจริงจากคำวินิจฉัยตัวอย่าง');}
async function api(req,res,url){
 const parts=url.pathname.split('/').filter(Boolean);const method=req.method;
 if(parts[1]==='transfers'&&method==='POST'){
   const p=await body(req);
   if(parts[2]==='preview')return send(res,transfers.preview(p.packet));
   if(parts[2]==='import'){if(p.confirmed!==true)fail('ตรวจชุดข้อมูลและยืนยันรับงานก่อน');return send(res,await transfers.import(p.packet));}
   fail('ไม่พบเส้นทางส่งงาน',404);
 }
 if(parts[1]==='health')return send(res,{status:'ok',mode:'analysis_only'});
 if(parts[1]==='dashboard'&&parts.length===2&&method==='GET'){
  try{return send(res,dashboardSnapshot(db));}catch{fail('ยังไม่สามารถอ่านฐานงานวิเคราะห์ได้',503);}
 }
 if(parts[1]==='settings'){const ai=localAiStatus();return send(res,{ai_enabled:ai.enabled,key_configured:ai.configured,provider:ai.provider,model:ai.model,registry_origins:registryOrigins,storage:'ฐานแยกของส่วนวิเคราะห์',host:'127.0.0.1',ai_policy:'ปกปิดชื่อและเลขสำนวนก่อนส่งเฉพาะข้อมูลของงานและแหล่งที่ผู้ใช้ตรวจและอนุมัติ ไม่ใช้เว็บหรือสำนวนอื่น'});}
 if(parts[1]==='knowledge'){
   if(parts[2]==='source'){const name=url.searchParams.get('name');const bytes=knowledge.source(name);if(!bytes)fail('ไม่พบต้นฉบับในชุดอนุมัติ',404);return binary(res,bytes,'application/pdf');}
   if(parts[2]==='search')return send(res,{results:knowledge.search(url.searchParams.get('q'),url.searchParams.get('kind'))});
   return send(res,knowledge.summary);
 }
 if(parts[1]!=='jobs')fail('ไม่พบเส้นทาง',404);
 if(parts.length===2){
   if(method==='GET')return send(res,{jobs:db.prepare('SELECT id,title,version,created_at,updated_at FROM jobs ORDER BY updated_at DESC').all()});
   if(method==='POST'){const p=await body(req);const data=cleanInput(p,{references:[],facts:[],bundle_version:knowledge.summary.version,bundle_fingerprint:knowledge.summary.fingerprint});const jobId=id();db.prepare('INSERT INTO jobs VALUES(?,?,?,?,?,?)').run(jobId,data.title,1,JSON.stringify(data),store.now(),store.now());store.event(jobId,'JOB_CREATED',{});return send(res,detail(jobId),201);}
 }
 const jobId=parts[2];const j=store.job(jobId);const action=parts[3];
 if(action==='return-package'&&method==='POST'){const p=await body(req);return send(res,await transfers.result(jobId,p.revision_id));}
 if(!action){if(method==='GET')return send(res,detail(jobId));if(method==='PUT'){const p=await body(req);saveJob(j,cleanInput(p,j.data),p.version);store.event(jobId,'INPUT_SAVED',{previous_version:j.version});return send(res,detail(jobId));}}
 if(action==='documents'){
   if(method==='GET'&&parts[4]){const d=db.prepare('SELECT * FROM documents WHERE id=? AND job_id=?').get(parts[4],jobId);if(!d)fail('ไม่พบเอกสารของงานนี้',404);return binary(res,d.bytes,d.mime);}
   if(method==='POST'){const p=await body(req);if(j.version!==p.version)fail('รุ่นงานเปลี่ยน กรุณาโหลดใหม่',409);const name=String(p.name||'').replace(/[\\/\x00-\x1f]/g,'_').slice(0,180);const ext=path.extname(name).toLowerCase();const mimes={'.pdf':'application/pdf','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8','.csv':'text/plain; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'};if(!mimes[ext])fail('รับ PDF, Word, Excel, ข้อความ และภาพ PNG/JPG');if(typeof p.base64!=='string'||!/^[A-Za-z0-9+/=\r\n]+$/.test(p.base64))fail('ไฟล์ไม่ถูกต้อง');const bytes=Buffer.from(p.base64,'base64');if(bytes.length>20*1024*1024||!bytes.length)fail('รับไฟล์ขนาดไม่เกิน 20 MB');const docId=id();const loc=path.join(store.dir,docId+ext);writeFileSync(loc,bytes);let data;try{data=await runWorker('extract',{path:loc,extension:ext});}catch(e){data={text:'',pages:[],reviewed:false,status:'UNRESOLVED_NEEDS_TRANSCRIPTION',error:e.message};}data.version=1;db.prepare('INSERT INTO documents VALUES(?,?,?,?,?,?,?)').run(docId,jobId,name,mimes[ext],sha(bytes),bytes,JSON.stringify(data));saveJob(j,j.data,p.version);store.event(jobId,'DOCUMENT_UPLOADED',{doc_id:docId,sha256:sha(bytes)});return send(res,detail(jobId));}
   if(method==='PUT'&&parts[4]){const p=await body(req);const d=db.prepare('SELECT * FROM documents WHERE id=? AND job_id=?').get(parts[4],jobId);if(!d)fail('ไม่พบเอกสารของงานนี้',404);if(typeof p.text!=='string'||p.text.length>160000)fail('ข้อความไม่ถูกต้อง');const previous=JSON.parse(d.data);const data={...previous,text:p.text,reviewed:p.reviewed===true,status:p.reviewed?'HUMAN_REVIEWED':'EXTRACTED_NEEDS_REVIEW',version:previous.version+1,reviewed_at:p.reviewed?store.now():null};if(data.reviewed&&!data.text.trim())fail('ต้องมีข้อความก่อนยืนยัน');saveJob(j,{...j.data,references:j.data.references.map(r=>r.document_id===parts[4]?{...r,reviewed:false}:r),vacancies:j.data.references.some(r=>r.document_id===parts[4])?null:j.data.vacancies,facts:j.data.facts.map(f=>f.citations.includes('doc-'+parts[4])?{...f,status:'unresolved',review_reason:'ข้อความหลักฐานเปลี่ยน ต้องตรวจข้อเท็จจริงใหม่'}:f)},p.version);db.prepare('UPDATE documents SET data=? WHERE id=? AND job_id=?').run(JSON.stringify(data),parts[4],jobId);store.event(jobId,'DOCUMENT_REVIEWED',{doc_id:parts[4],version:data.version});return send(res,detail(jobId));}
 }
 if(action==='references'&&method==='POST'){
   const p=await body(req);const r=knowledge.all.get(p.source_id);if(!r)fail('ไม่พบแหล่งในชุดปัจจุบัน');if(!Number.isInteger(Number(p.page||r.page))||Number(p.page||r.page)<1)fail('ระบุหน้า PDF ให้ถูกต้อง');const pdf=knowledge.summary.sources.find(s=>s.filename===r.source_pdf);if(Number(p.page||r.page)>pdf.page_count)fail('หน้าเกินต้นฉบับ');if(typeof p.text!=='string'||!p.text.trim()||p.text.length>50000)fail('ต้องตรวจข้อความก่อนเพิ่ม');if(p.reviewed!==true)fail('ต้องตรวจต้นฉบับและอนุมัติข้อความก่อนใช้');if(r.kind==='seniority'&&normalizeName(r.label)!==normalizeName(j.data.subject_name)&&p.comparison!==true)fail('ชื่อในบัญชีไม่ตรงบุคคลของงาน ต้องยืนยันว่าเป็นบุคคลที่ใช้เปรียบเทียบ');const ref={...r,text:p.text.trim(),page:Number(p.page||r.page),reviewed:true,reviewed_at:store.now(),role:r.kind==='precedent'?'reference_only':r.kind==='law'?'law':'reference_data',source_sha256:pdf.sha256,bundle_fingerprint:knowledge.summary.fingerprint};const refs=[...(j.data.references||[]).filter(x=>x.id!==r.id),ref];saveJob(j,{...j.data,references:refs},p.version);store.event(jobId,'SOURCE_APPROVED',{source_id:r.id,page:ref.page});return send(res,detail(jobId));
 }
 if(action==='references'&&method==='DELETE') {const p=await body(req);saveJob(j,{...j.data,references:j.data.references.filter(r=>r.id!==p.source_id),facts:j.data.facts.map(f=>({...f,citations:f.citations.filter(x=>x!==p.source_id),status:f.citations.includes(p.source_id)?'unresolved':f.status}))},p.version);return send(res,detail(jobId));}
 if(action==='manual-seniority'&&method==='POST'){
   const p=await body(req);const account=knowledge.accounts.find(a=>a.source_level===p.level&&a.source_account===p.account);if(!account)fail('ระดับ/ประเภทบัญชีนี้ไม่มีจำนวนยืนยันในฐานปัจจุบัน');if(p.verified!==true||!normalizeName(j.data.subject_name)||normalizeName(p.name)!==normalizeName(j.data.subject_name))fail('ตรวจชื่อบุคคลและยืนยันจากภาพ PDF ก่อน');if(!Number.isInteger(p.order)||p.order<1||p.order>account.total_suitable_population)fail('ลำดับเกินจำนวนในบัญชี');if(!Number.isInteger(p.page)||p.page<account.source_page_start||p.page>account.source_page_end)fail('หน้าไม่ตรงระดับ/ประเภทบัญชีปัจจุบัน');const r={id:'manual-seniority-'+jobId,kind:'seniority',role:'reference_data',label:p.name,text:`${p.name} ${p.position||''} ลำดับที่ ${p.order} จากทั้งหมด ${account.total_suitable_population}`,source_pdf:knowledge.summary.exclusive_seniority_source,page:p.page,source_pdf_page:p.page,source_level:p.level,source_account:p.account,seniority_order:p.order,total_suitable_population:account.total_suitable_population,verified:true,reviewed:true,reviewed_at:store.now(),verification_status:'HUMAN_VISUAL_VERIFIED',source_sha256:knowledge.summary.sources.find(s=>s.filename===knowledge.summary.exclusive_seniority_source).sha256};saveJob(j,{...j.data,manual_seniority:r,references:[...j.data.references.filter(x=>x.id!==r.id),r]},p.version);store.event(jobId,'MANUAL_SENIORITY_VERIFIED',{page:p.page,account:p.account});return send(res,detail(jobId));
 }
 if(action==='facts'&&method==='POST'){
   const p=await body(req);if(!Array.isArray(p.facts)||p.facts.length>200)fail('ตารางข้อเท็จจริงไม่ถูกต้อง');const facts=p.facts.map(f=>{if(typeof f.text!=='string'||!f.text.trim()||f.text.length>10000||!['assertion','established','unresolved'].includes(f.status))fail('ข้อเท็จจริงไม่ถูกต้อง');validateRefs(f.citations,j,documents(jobId));if(f.status==='established'&&!f.citations.length)fail('ข้อเท็จจริงยืนยันต้องมีแหล่งหลักฐาน');return {id:typeof f.id==='string'?f.id:id(),text:f.text.trim(),status:f.status,citations:f.citations};});saveJob(j,{...j.data,facts},p.version);store.event(jobId,'FACTS_SAVED',{count:facts.length});return send(res,detail(jobId));
 }
 if(action==='vacancies'&&method==='POST'){
   const p=await body(req);if(!Number.isSafeInteger(p.value)||p.value<0||p.value>10000)fail('จำนวนตำแหน่งว่างไม่ถูกต้อง');const refs=j.data.references;const vacancy=refs.find(r=>r.id===p.vacancy_reference&&r.reviewed&&r.kind==='vacancy');const rule=refs.find(r=>r.id===p.rule_reference&&r.reviewed&&r.kind==='law');if(!vacancy||!rule||p.applies!==true)fail('ต้องมีแหล่งตำแหน่งว่างจริงและข้อความหลักเกณฑ์ที่ตรวจแล้ว');saveJob(j,{...j.data,vacancies:{value:p.value,vacancy_reference:vacancy.id,rule_reference:rule.id,applies:true}},p.version);return send(res,detail(jobId));
 }
 if(action==='vacancy-source'&&method==='POST'){
   const p=await body(req);const d=documents(jobId).find(d=>'doc-'+d.id===p.document_id&&d.data.reviewed);if(!d||typeof p.text!=='string'||!p.text.trim()||!p.page||p.reviewed!==true)fail('ตรวจเอกสารตำแหน่งว่างของงานนี้และระบุหน้า/เซลล์ก่อน');const r={id:'vacancy-'+d.id,kind:'vacancy',role:'reference_data',label:d.name+' ตำแหน่งว่างจริง',text:p.text.slice(0,10000),page:p.page,source_pdf:d.name,document_id:d.id,source_sha256:d.sha256,reviewed:true,reviewed_at:store.now()};saveJob(j,{...j.data,references:[...j.data.references.filter(x=>x.id!==r.id),r]},p.version);return send(res,detail(jobId));
 }
 if(action==='analyze'&&method==='POST'){
   const result=analyze(j,documents(jobId),knowledge);const runId=id();db.prepare('INSERT INTO runs VALUES(?,?,?,?)').run(runId,jobId,store.now(),JSON.stringify({...result,input_snapshot:j.data,document_snapshot:documents(jobId).map(d=>({id:d.id,sha256:d.sha256,version:d.data.version,reviewed:d.data.reviewed,text:d.data.text}))}));store.event(jobId,'ANALYSIS_RUN',{run_id:runId,job_version:j.version});return send(res,detail(jobId));
 }
 if(action==='drafts'&&method==='POST'){
   const p=await body(req);if(p.version!==j.version)fail('ข้อมูลต้นทางเปลี่ยน กรุณาโหลดใหม่',409);const text={};for(const s of sections){if(typeof p.sections?.[s]!=='string'||p.sections[s].length>60000)fail('ข้อความส่วนร่างไม่ถูกต้อง');text[s]=p.sections[s];}const docs=documents(jobId);const result=analyze(j,docs,knowledge);const draft={registry_transfer:j.data.registry_transfer||null,sections:text,job_version:j.version,bundle_version:j.data.bundle_version,bundle_fingerprint:j.data.bundle_fingerprint,title:j.data.title,external_case_ref:j.data.external_case_ref,references:[...j.data.references,...docs.map(d=>({id:'doc-'+d.id,label:d.name,page:'ตามข้อความที่ตรวจ',source_pdf:d.name,reviewed:d.data.reviewed,sha256:d.sha256,document_version:d.data.version,text:d.data.text}))],gaps:result.gaps,created_by:'local_user',template_version:'analysis-draft-v1'};const revId=id();db.prepare('INSERT INTO revisions VALUES(?,?,?,?)').run(revId,jobId,store.now(),JSON.stringify(draft));store.event(jobId,'DRAFT_REVISION_SAVED',{revision_id:revId});return send(res,detail(jobId));
 }
 if(action==='propose'&&method==='POST'){
   const p=await body(req);if(p.version!==j.version)fail('ข้อมูลต้นทางเปลี่ยน กรุณาโหลดใหม่',409);const proposal=await proposeLocalSection({job:j,documents:documents(jobId),knowledge,section:p.section});if(store.job(jobId).version!==j.version)fail('ข้อมูลเปลี่ยนระหว่าง AI ร่าง ยกเลิกข้อเสนอและเริ่มใหม่',409);const proposalId=id();db.prepare('INSERT INTO proposals VALUES(?,?,?,?)').run(proposalId,jobId,store.now(),JSON.stringify(proposal));store.event(jobId,'AI_PROPOSAL_CREATED',{proposal_id:proposalId,section:p.section,provider:proposal.provider,model:proposal.model,usage:proposal.usage,input_hash:proposal.input_hash,redacted_count:proposal.redacted_count});return send(res,detail(jobId));
 }
 if(action==='export'&&method==='POST'){
   const p=await body(req);const row=db.prepare('SELECT * FROM revisions WHERE id=? AND job_id=?').get(p.revision_id,jobId);if(!row)fail('ไม่พบฉบับร่างของงานนี้',404);const draft=JSON.parse(row.data);const exportId=id();const file=path.join(store.dir,exportId+'.docx');await runWorker('export',{...draft,path:file,job_id:jobId,revision_id:row.id});const bytes=readFileSync(file);db.prepare('INSERT INTO exports VALUES(?,?,?,?,?,?)').run(exportId,jobId,row.id,store.now(),sha(bytes),JSON.stringify({path:file,job_version:draft.job_version,bundle_fingerprint:draft.bundle_fingerprint,template_version:draft.template_version}));store.event(jobId,'DOCX_EXPORTED',{revision_id:row.id,export_id:exportId,sha256:sha(bytes)});return send(res,{export_id:exportId,url:`/api/jobs/${jobId}/export/${exportId}`,sha256:sha(bytes)});
 }
 if(action==='export'&&method==='GET'&&parts[4]){const row=db.prepare('SELECT * FROM exports WHERE id=? AND job_id=?').get(parts[4],jobId);if(!row)fail('ไม่พบไฟล์ของงานนี้',404);return binary(res,readFileSync(JSON.parse(row.data).path),'application/vnd.openxmlformats-officedocument.wordprocessingml.document','analysis-draft.docx');}
 fail('วิธีหรือเส้นทางไม่รองรับ',404);
}
const production=process.argv.includes('--production');
const vite=production?null:await createViteServer({root:ROOT,server:{middlewareMode:true,hmr:{port:PORT+100}},appType:'spa'});
const server=http.createServer(async(req,res)=>{
 try{
  const hosts=new Set([`127.0.0.1:${PORT}`,`localhost:${PORT}`]);if(!hosts.has(req.headers.host))fail('Host ไม่ได้รับอนุญาต',403);
  if(req.headers.origin&&!new Set([`http://127.0.0.1:${PORT}`,`http://localhost:${PORT}`]).has(req.headers.origin))fail('Origin ไม่ได้รับอนุญาต',403);
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
  const url=new URL(req.url,`http://127.0.0.1:${PORT}`);
  if(/\.(?:state|private|qa|env)(?:[/.]|$)|\/(?:server(?:\.mjs|\/)|tests\/|scripts\/)/i.test(decodeURIComponent(url.pathname)))fail('เส้นทางไฟล์ภายในไม่เปิดให้ Browser',403);
  if(url.pathname.startsWith('/api/'))return await api(req,res,url);
  if(production){const dist=path.join(ROOT,'dist');let loc=path.resolve(dist,'.'+decodeURIComponent(url.pathname));if(!loc.startsWith(dist+path.sep)&&loc!==dist)fail('เส้นทางไม่ถูกต้อง',403);if(loc===dist||!existsSync(loc))loc=path.join(dist,'index.html');const extension=path.extname(loc);const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'}[extension];if(!mime)fail('ไม่พบไฟล์',404);return binary(res,readFileSync(loc),mime);}
  vite.middlewares(req,res,()=>{res.writeHead(404);res.end();});
 }catch(e){if(!res.headersSent)send(res,{error:e.message||'ดำเนินการไม่สำเร็จ'},e.status||500);else res.end();}
});
server.listen(PORT,'127.0.0.1',()=>console.log(`Analysis-only app: http://127.0.0.1:${PORT} | bundle ${knowledge.summary.version} | sources ${knowledge.summary.sources.length}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close();db.close();knowledge.db.close();vite?.close();process.exit();});
