import { randomUUID } from 'node:crypto';
import { readFileSync,writeFileSync,rmSync } from 'node:fs';
import path from 'node:path';
import { validateRequest,RESULT_FORMAT,hash } from '../../shared/analysis-transfer.mjs';

export function transferService({store,knowledge,runWorker,detail}) {
  const {db}=store;
  db.exec('CREATE TABLE IF NOT EXISTS transfers(id TEXT PRIMARY KEY,request_hash TEXT NOT NULL,job_id TEXT NOT NULL UNIQUE REFERENCES jobs(id),data TEXT NOT NULL,created_at TEXT NOT NULL)');
  const existing=p=>{
    const row=db.prepare('SELECT * FROM transfers WHERE id=?').get(p.transfer_id);
    if(row&&row.request_hash!==p.request_hash) throw Object.assign(new Error('รหัสส่งงานซ้ำแต่ข้อมูลต่างกัน ต้องสร้างรายการส่งใหม่'),{status:409});
    return row;
  };
  return {
    preview(value) {
      const p=validateRequest(value);const old=existing(p);
      return {registry:p.registry,title:p.input.title,subject_name:p.input.subject_name,claim:p.input.claim,response:p.input.response,issues:p.input.issues,documents:p.documents.map(d=>({name:d.name,sha256:d.sha256})),transfer_id:p.transfer_id,request_hash:p.request_hash,existing_job_id:old?.job_id||null};
    },
    async import(value) {
      const p=validateRequest(value);const old=existing(p);
      if(old)return {job:detail(old.job_id),reused:true};
      const files=[];const prepared=[];
      try {
        for(const d of p.documents){
          const docId=randomUUID();const ext=path.extname(d.name).toLowerCase();const loc=path.join(store.dir,docId+ext);
          const bytes=Buffer.from(d.base64,'base64');writeFileSync(loc,bytes);files.push(loc);
          let extracted;try{extracted=await runWorker('extract',{path:loc,extension:ext});}catch(e){extracted={text:'',status:'UNRESOLVED_NEEDS_TRANSCRIPTION',error:e.message};}
          prepared.push({id:docId,...d,bytes,data:{...extracted,reviewed:false,version:1,status:extracted.text?'EXTRACTED_NEEDS_REVIEW':'UNRESOLVED_NEEDS_TRANSCRIPTION',registry_document_id:d.registry_document_id,transfer_id:p.transfer_id}});
        }
        // Recheck after extraction; concurrent imports must not duplicate jobs.
        const again=existing(p);if(again){for(const f of files)rmSync(f,{force:true});return {job:detail(again.job_id),reused:true};}
        const jobId=randomUUID();const provenance={...p.registry,transfer_id:p.transfer_id,request_hash:p.request_hash,created_at:p.created_at};
        const data={...p.input,references:[],facts:[],bundle_version:knowledge.summary.version,bundle_fingerprint:knowledge.summary.fingerprint,registry_transfer:provenance};
        db.exec('BEGIN IMMEDIATE');
        try {
          db.prepare('INSERT INTO jobs VALUES(?,?,?,?,?,?)').run(jobId,p.input.title,1,JSON.stringify(data),store.now(),store.now());
          for(const d of prepared)db.prepare('INSERT INTO documents VALUES(?,?,?,?,?,?,?)').run(d.id,jobId,d.name,d.mime,d.sha256,d.bytes,JSON.stringify(d.data));
          db.prepare('INSERT INTO transfers VALUES(?,?,?,?,?)').run(p.transfer_id,p.request_hash,jobId,JSON.stringify({registry:p.registry,document_hashes:p.documents.map(d=>({id:d.registry_document_id,sha256:d.sha256})),input:p.input}),store.now());
          store.event(jobId,'REGISTRY_TRANSFER_IMPORTED',{transfer_id:p.transfer_id,request_hash:p.request_hash});db.exec('COMMIT');
        } catch(e){db.exec('ROLLBACK');throw e;}
        return {job:detail(jobId),reused:false};
      }catch(e){for(const f of files)rmSync(f,{force:true});throw e;}
    },
    async result(jobId,revisionId) {
      const row=db.prepare('SELECT * FROM revisions WHERE id=? AND job_id=?').get(revisionId,jobId);
      if(!row)throw Object.assign(new Error('ไม่พบฉบับร่างของงานนี้'),{status:404});
      const draft=JSON.parse(row.data);const provenance=draft.registry_transfer;
      if(!provenance)throw Object.assign(new Error('ฉบับร่างนี้ไม่ได้รับจากทะเบียน ไม่สามารถผูกกลับสำนวนได้'),{status:400});
      const fileId=randomUUID();const file=path.join(store.dir,fileId+'.docx');
      await runWorker('export',{...draft,path:file,job_id:jobId,revision_id:row.id});const bytes=readFileSync(file);
      const packet={format:RESULT_FORMAT,status:'DRAFT_REQUIRES_REVIEW',transfer_id:provenance.transfer_id,request_hash:provenance.request_hash,registry:{case_id:provenance.case_id,black_number:provenance.black_number,origin:provenance.origin},analysis_job_id:jobId,revision_id:row.id,created_at:store.now(),draft,word:{name:'analysis-draft.docx',sha256:hash(bytes),base64:bytes.toString('base64')}};
      db.prepare('INSERT INTO exports VALUES(?,?,?,?,?,?)').run(fileId,jobId,row.id,store.now(),hash(bytes),JSON.stringify({path:file,transfer_id:packet.transfer_id,template_version:draft.template_version}));
      store.event(jobId,'REGISTRY_RESULT_PREPARED',{transfer_id:packet.transfer_id,revision_id:row.id,sha256:hash(bytes)});return packet;
    }
  };
}
