import test from 'node:test';
import assert from 'node:assert/strict';
import {REQUEST_FORMAT,RESULT_FORMAT,sealRequest,validateRequest,validateResult,hash} from '../../shared/analysis-transfer.mjs';
import {registryAnalysisService,checkAssignment} from '../../shared/registry-analysis-service.mjs';
const actor={id:'owner-1',name:'เจ้าของสำนวนทดสอบ',role:'COMMISSIONER'};
const c={id:'case-test',blackNumber:'ทดสอบ-1/2569',subject:'สำนวนจำลองสำหรับ QA',petitionerName:'บุคคลจำลอง',ownerId:actor.id,currentStatus:'UNCHANGED',legalOfficerId:'legal-1'};
const request=()=>sealRequest({format:REQUEST_FORMAT,transfer_id:'transfer-test',created_at:new Date().toISOString(),registry:{case_id:c.id,black_number:c.blackNumber,origin:'http://127.0.0.1:3000'},input:{title:c.subject,external_case_ref:c.blackNumber,subject_name:c.petitionerName,rank_position:'',level:'',account:'',claim:'ข้อกล่าวอ้างจำลอง',response:'',issues:''},documents:[{registry_document_id:'doc-test',name:'proof.txt',mime:'text/plain',sha256:hash('หลักฐานจำลอง'),base64:Buffer.from('หลักฐานจำลอง').toString('base64')}]});
const result=()=>({format:RESULT_FORMAT,status:'DRAFT_REQUIRES_REVIEW',transfer_id:'transfer-test',request_hash:request().request_hash,registry:request().registry,analysis_job_id:'job-test',revision_id:'rev-test',created_at:new Date().toISOString(),draft:{title:c.subject,external_case_ref:c.blackNumber,sections:{'ข้อเสนอเบื้องต้น':'ข้อความมนุษย์สำหรับ QA'}},word:{name:'analysis-draft.docx',base64:Buffer.from('504b030461626364','hex').toString('base64'),sha256:hash(Buffer.from('504b030461626364','hex'))}});
function harness(){
 const receipts=new Map();const records=new Map();const files=new Map();let attachFails=false;let attachCalls=0;
 const docs=[{id:'doc-test',title:'proof.txt',fileName:'proof.txt',fileUrl:'cases/case-test/file.txt',mimeType:'text/plain',fileSize:5,storageProvider:'supabase_storage'}];
 const repo={case:async()=>c,documents:async(_,ids)=>docs.filter(d=>ids.includes(d.id)),recordRequest:async(_,__,r)=>receipts.set(r.transfer_id,r),receipt:async id=>receipts.get(id),result:async id=>records.get(id),attach:async p=>{attachCalls++;if(attachFails)throw new Error('db failure');const d={id:p.docId,caseId:p.caseId,fileName:p.packet.word.sha256+'.docx'};records.set(p.docId,d);return d;}};
 const storage={download:async()=>Buffer.from('หลักฐานจำลอง'),upload:async(p,b)=>files.set(p,b),remove:async paths=>paths.forEach(p=>files.delete(p))};
 return {service:registryAnalysisService({repo,storage}),receipts,files,docs,setFailure:()=>attachFails=true,count:()=>attachCalls};
}
test('transfer rejects tampered payloads, foreign MIME and duplicate documents',()=>{
 const p=request();assert.equal(validateRequest(p).documents.length,1);
 assert.throws(()=>validateRequest({...p,input:{...p.input,claim:'changed'}}),/Hash/);
 assert.throws(()=>validateRequest(sealRequest({...p,documents:[{...p.documents[0],mime:'text/html'}]})),/ชนิดไฟล์/);
 assert.throws(()=>validateRequest(sealRequest({...p,documents:[p.documents[0],p.documents[0]]})),/ซ้ำ/);
});
test('ownership does not permit another commissioner or officer',()=>{
 checkAssignment(actor,c);assert.throws(()=>checkAssignment({...actor,id:'foreign'},c),/เฉพาะสำนวน/);
 assert.throws(()=>checkAssignment({id:'foreign',role:'LEGAL_OFFICER'},c),/เฉพาะสำนวน/);
 assert.throws(()=>checkAssignment({id:'viewer',role:'VIEWER'},c),/เฉพาะสำนวน/);
});
test('registry projection exports only selected files, not ownership or official status',async()=>{
 const h=harness();const p=await h.service.request(c.id,{document_ids:['doc-test'],claim:'คำร้อง'},actor,'http://127.0.0.1:3000');assert.equal(p.documents.length,1);assert.equal(p.input.claim,'คำร้อง');assert.equal(p.currentStatus,undefined);assert.equal(p.ownerId,undefined);assert.equal(p.input.respondentName,undefined);
 await assert.rejects(h.service.request(c.id,{document_ids:['foreign']},actor,'http://127.0.0.1:3000'),/สำนวนอื่น/);
});
test('registry refuses paths outside the selected case and external link fetching',async()=>{
 const h=harness();h.docs[0].fileUrl='cases/foreign/file.txt';await assert.rejects(h.service.request(c.id,{document_ids:['doc-test']},actor,'http://127.0.0.1:3000'),/ไม่ตรงสำนวน/);
 h.docs[0].storageProvider='microsoft_graph';await assert.rejects(h.service.request(c.id,{document_ids:['doc-test']},actor,'http://127.0.0.1:3000'),/ลิงก์ภายนอก/);
});
test('results require the exact case, request receipt and Word hash',async()=>{
 const h=harness();const p=result();await assert.rejects(h.service.preview(c.id,p,actor),/ประวัติส่งงาน/);
 h.receipts.set(p.transfer_id,{request_hash:p.request_hash,origin:p.registry.origin,transfer_id:p.transfer_id});await h.service.preview(c.id,p,actor);
 assert.throws(()=>validateResult(p,{case_id:'foreign',black_number:c.blackNumber}),/สำนวนอื่น/);
 await assert.rejects(h.service.preview(c.id,{...p,request_hash:hash('wrong')},actor),/ชุดต้นทาง/);
 await assert.rejects(h.service.preview(c.id,{...p,word:{...p.word,sha256:hash('wrong')}},actor),/Hash ไฟล์/);
});
test('attachment is idempotent and does not change official case data',async()=>{
 const h=harness();const p=result();h.receipts.set(p.transfer_id,{request_hash:p.request_hash,origin:p.registry.origin,transfer_id:p.transfer_id});const before=JSON.stringify(c);
 assert.equal((await h.service.attach(c.id,p,actor)).reused,false);assert.equal((await h.service.attach(c.id,p,actor)).reused,true);assert.equal(h.count(),1);assert.equal(h.files.size,2);assert.equal(JSON.stringify(c),before);
});
test('failed registry transaction cleans only the files created by that attempt',async()=>{
 const h=harness();const p=result();h.receipts.set(p.transfer_id,{request_hash:p.request_hash,origin:p.registry.origin,transfer_id:p.transfer_id});h.files.set('existing-case-file',Buffer.from('keep'));h.setFailure();await assert.rejects(h.service.attach(c.id,p,actor),/db failure/);assert.equal(h.files.size,1);assert.ok(h.files.has('existing-case-file'));
});
