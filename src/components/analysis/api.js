export async function api(url,method='GET',data){const r=await fetch('/api/analysis'+url,{method,headers:data?{'Content-Type':'application/json'}:undefined,body:data?JSON.stringify(data):undefined});const json=await r.json();if(!r.ok)throw new Error(json.error||'ดำเนินการไม่สำเร็จ');return json;}
export const sourceUrl=(name,page=1)=>`/api/analysis/knowledge/source?name=${encodeURIComponent(name)}#page=${page}`;
export const emptyInput={analysis_tier:'general',title:'',external_case_ref:'',subject_name:'',rank_position:'',level:'',account:'',appointment_motion:'',unit_type:'',unit_name:'',annex_status:'',claim:'',response:'',issues:''};
export function normalizeTierParam(raw){
 if(!raw)return null;
 const v=String(raw).trim();
 if(v==='sub_general'||v==='sub_general_to_inspector'||v==='2')return 'sub_general_to_inspector';
 if(v==='general'||v==='1')return 'general';
 return null;
}
export function inferJobTier(data={}){
 if(data.analysis_tier==='sub_general_to_inspector'||data.analysis_tier==='sub_general')return 'sub_general_to_inspector';
 if(data.analysis_tier==='general')return 'general';
 if(/\(เลื่อนจาก|สับเปลี่ยนหมุนเวียน/.test(String(data.level||'')))return 'sub_general_to_inspector';
 if(data.annex_status||['non_opb_bch','opb_unit','direct_tr_unit'].includes(data.unit_type))return 'sub_general_to_inspector';
 return 'general';
}
export const SECTIONS=['ข้อมูลเรื่องและบุคคล','คำร้องและคำขอ','คำชี้แจง','ข้อเท็จจริงและหลักฐาน','ประเด็นที่พิจารณา','กฎหมายและหลักเกณฑ์','การวิเคราะห์','ข้อเสนอเบื้องต้น'];
export const blankSections=()=>Object.fromEntries(SECTIONS.map(s=>[s,'']));
export const statusLabel=x=>({assertion:'ข้อกล่าวอ้าง',established:'ยืนยันจากหลักฐาน',unresolved:'ยังไม่ยืนยัน',HUMAN_REVIEWED:'ตรวจข้อความแล้ว',EXTRACTED_NEEDS_REVIEW:'รอตรวจข้อความ',UNRESOLVED_NEEDS_TRANSCRIPTION:'ต้องถอดข้อความ',INHERITED_OLD_BUNDLE_NOT_REVERIFIED:'รับจากฐานเดิม รอตรวจต้นฉบับ',VISUAL_SENIORITY_PDF_VERIFIED:'ตรวจภาพอาวุโสแล้ว',UNIT_SENIORITY_ACCOUNT_BY_CIRCULAR_2456:'เกณฑ์ระดับ รอง ผบก. – สว. (ว ๒๔๕๖)',NEEDS_REVIEW:'มีข้อมูลรอตรวจ',READY_FOR_REVIEW:'พร้อมให้ผู้รับผิดชอบตรวจ'}[x]||x);
export const WORKFLOW_STAGES=['รับข้อมูลแล้ว','กำลังตรวจหลักฐาน','พร้อมวิเคราะห์','วิเคราะห์แล้ว','ร่างแล้ว','ส่งออกแล้ว'];
export function jobStatus(job){
 if(!job)return 'รับข้อมูลแล้ว';
 if(job.exports?.length)return 'ส่งออกแล้ว';
 if(job.revisions?.length)return 'ร่างแล้ว';
 if(job.runs?.length)return 'วิเคราะห์แล้ว';
 if((job.data?.references?.length||0)+(job.documents?.filter(d=>d.data.reviewed).length||0)>0)return 'พร้อมวิเคราะห์';
 if(job.documents?.length)return 'กำลังตรวจหลักฐาน';
 return 'รับข้อมูลแล้ว';
}
