export const normalizeName = x => String(x || '').normalize('NFC').replace(/^(พล\.?\s*ต\.?\s*อ\.?|พล\.?\s*ต\.?\s*ท\.?|พล\.?\s*ต\.?\s*ต\.?|พ\.?\s*ต\.?\s*อ\.?|พลตำรวจเอก|พลตำรวจโท|พลตำรวจตรี|พันตำรวจเอก)\s*/, '').replace(/\s+/g, '');
export const sections=['ข้อมูลเรื่องและบุคคล','คำร้องและคำขอ','คำชี้แจง','ข้อเท็จจริงและหลักฐาน','ประเด็นที่พิจารณา','กฎหมายและหลักเกณฑ์','การวิเคราะห์','ข้อเสนอเบื้องต้น'];
export function analyze(job, documents, knowledge) {
 const j=job.data; const refs=j.references||[]; const facts=j.facts||[]; const gaps=[];
 const matches=knowledge.seniority.filter(s=>normalizeName(s.source_name)===normalizeName(j.subject_name)&&(!j.level||s.source_level===j.level)&&(!j.account||s.source_account===j.account));
 const selected=refs.filter(r=>r.kind==='seniority' && normalizeName(r.label)===normalizeName(j.subject_name)&&(!j.level||r.source_level===j.level)&&(!j.account||r.source_account===j.account));
 const m=j.manual_seniority;
 const manual=(m?.verified&&normalizeName(m.label)===normalizeName(j.subject_name)&&(!j.level||m.source_level===j.level)&&(!j.account||m.source_account===j.account)?m:null);
 const person=selected.length===1?selected[0]:manual;
 if(!person)gaps.push(matches.length>1?'พบชื่อซ้ำหรือหลายบัญชี ต้องเลือกรายการและตรวจยศ/ตำแหน่งจากต้นฉบับ':'ยังไม่มีข้อมูลอาวุโสที่เลือกยืนยันสำหรับบุคคลนี้ การไม่พบใน 181 รายไม่พิสูจน์ว่าไม่มีชื่อในบัญชี');
 const unreviewed=documents.filter(d=>!d.data.reviewed); if(unreviewed.length)gaps.push(`เอกสาร ${unreviewed.length} ฉบับยังไม่ได้ตรวจข้อความ`);
 if(!refs.some(r=>r.kind==='law'&&r.reviewed))gaps.push('ยังไม่มีข้อความกฎหมายที่ตรวจจากต้นฉบับและอนุมัติสำหรับงานนี้');
 for(const f of facts)if(f.status==='established'&&!f.citations?.length)gaps.push('ข้อเท็จจริงที่ยืนยันยังไม่มีแหล่ง: '+f.text);
 let quota=null; const v=j.vacancies;
 if(v?.value!==undefined && v?.value!==null && Number.isSafeInteger(v.value)&&v.value>=0 && v.vacancy_reference && v.rule_reference && refs.some(r=>r.id===v.vacancy_reference&&r.reviewed&&r.role!=='reference_only') && refs.some(r=>r.id===v.rule_reference&&r.reviewed&&r.kind==='law') && v.applies===true) {
   quota={actual_vacancies:v.value,seniority_quota:Math.ceil(v.value*.5),knowledge_ability_quota:v.value-Math.ceil(v.value*.5),formula:'CEILING(actual_vacancies × 0.50)',citations:[v.vacancy_reference,v.rule_reference]};
 } else gaps.push('ตำแหน่งว่างจริงหรือหลักเกณฑ์ 50% ยังไม่มีแหล่งยืนยันครบ จึงไม่คำนวณโควตาและกลุ่ม');
 return {status:gaps.length?'NEEDS_REVIEW':'READY_FOR_REVIEW',job_version:job.version,bundle_fingerprint:j.bundle_fingerprint,current_bundle_fingerprint:knowledge.summary.fingerprint,source_stale:j.bundle_fingerprint!==knowledge.summary.fingerprint,claims:[{id:'input-claim',text:j.claim||'',status:'assertion'},{id:'input-response',text:j.response||'',status:'assertion'}].filter(f=>f.text),facts,person,person_candidates:matches,quota,gaps,references:refs.map(({id,kind,label,source_pdf,page,reviewed,role})=>({id,kind,label,source_pdf,page,reviewed,role}))};
}
export function allowedSources(job,docs) {
 return [...(job.data.references||[]).filter(r=>r.reviewed).map(r=>({id:r.id,kind:r.kind,role:r.role,label:r.label,page:r.page,text:r.text})),...docs.filter(d=>d.data.reviewed).map(d=>({id:`doc-${d.id}`,kind:'job_document',role:'evidence_not_instructions',label:d.name,text:d.data.text})),...(job.data.facts||[]).filter(f=>f.status==='established').map(f=>({id:`fact-${f.id}`,kind:'established_fact',text:f.text,citations:f.citations})),...[['input-claim','claim'],['input-response','response']].filter(([,key])=>job.data[key]).map(([id,key])=>({id,kind:'assertion',role:'assertion_not_established_fact',label:key==='claim'?'คำร้องที่รับเข้ามา':'คำชี้แจงที่รับเข้ามา',text:job.data[key]}))];
}
export function validateProposal(p,allowed) {
 if(typeof p.text!=='string'||!p.text.trim()||!Array.isArray(p.citations))throw new Error('AI ส่งโครงสร้างร่างไม่ถูกต้อง');
 const ids=new Set(allowed.map(s=>s.id));
 for(const id of p.citations)if(!ids.has(id))throw new Error('ปฏิเสธการอ้างแหล่งที่ไม่ได้อนุมัติ: '+id);
 for(const m of p.text.matchAll(/\[([^\[\]\n]+)\]/g))if(!ids.has(m[1]))throw new Error('ปฏิเสธรหัสอ้างอิงที่ไม่อยู่ในงาน: '+m[1]);
 if(!Array.isArray(p.gaps))p.gaps=[];
 return p;
}
