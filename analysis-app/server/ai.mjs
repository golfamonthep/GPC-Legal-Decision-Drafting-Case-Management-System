import {createAiHarness,getAiHarnessStatus} from '../../shared/ai-harness.mjs';
import {allowedSources,analyze,sections,validateProposal} from './analysis.mjs';

const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const schema={type:'object',properties:{text:{type:'string'},citations:{type:'array',items:{type:'string'}},gaps:{type:'array',items:{type:'string'}}},required:['text','citations','gaps'],additionalProperties:false};

function buildInstructions(section) {
  const base = 'คุณเป็นผู้ช่วยจัดทำร่างคำวินิจฉัยเรื่องร้องทุกข์ ก.พ.ค.ตร. (ระดับนายพล วาระประจำปี ๒๕๖๙) ตามแบบแผนคำวินิจฉัยบรรทัดฐานของ ก.พ.ค.ตร. (คดี พล.ต.ต.วิวัฒน์ คำชำนาญ และ พล.ต.ท.พิทักษ์ อุทัยธรรม) ใช้ภาษาทางการ/ภาษากฎหมายไทยที่ถูกต้องแม่นยำ ใช้เฉพาะ allowed_sources และข้อมูลของงานนี้เป็นหลักฐาน ห้ามใช้เว็บหรือความจำนอกเหนือจากข้อมูลที่ให้ อ้างรหัส [source_id] ทุกข้อความสาระสำคัญ ห้ามเติมมาตรา วันที่ หรือผลคดีเองโดยไม่มีแหล่งอ้างอิง ส่งเฉพาะส่วนที่ร้องขอ ส่ง JSON ตาม schema เท่านั้น';

  const sectionGuides = {
    'ประเด็นที่พิจารณา': 'กำหนดประเด็นวินิจฉัยตามแบบ ก.พ.ค.ตร.: ๑. ประเด็นเงื่อนไขการร้องทุกข์ (สิทธิและกรอบระยะเวลาตาม พ.ร.บ.ตำรวจแห่งชาติ ๒๕๖๕ และ กฎ ก.พ.ค.ตร. ว่าด้วยการร้องทุกข์ ๒๕๖๗) ๒. ประเด็นเนื้อหาของเรื่องร้องทุกข์ (การไม่คัดเลือกแต่งตั้งผู้ร้องทุกข์เป็นไปตามหลักเกณฑ์ของกฎหมายและกฎ ก.ตร. หรือไม่)',
    'กฎหมายและหลักเกณฑ์': 'สรุปบทบัญญัติข้อกฎหมายที่เกี่ยวข้องโดยตรง: พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๖, ๗๗, ๗๘, ๘๑, ๘๒ (การจัดสรรกลุ่มอาวุโสไม่น้อยกว่าร้อยละห้าสิบ และกลุ่มความรู้ความสามารถ) และ กฎ ก.ตร. ว่าด้วยการแต่งตั้งข้าราชการตำรวจ พ.ศ. ๒๕๖๗ ข้อ ๘, ๑๓, ๒๖, ๓๓, ๓๙, ๔๗ อย่างครบถ้วนรัดกุม',
    'การวิเคราะห์': 'วิเคราะห์ตามแบบแผนคำวินิจฉัย ก.พ.ค.ตร.: เริ่มด้วย "พิเคราะห์แล้วเห็นว่า..." วินิจฉัยเปรียบเทียบสัดส่วนตำแหน่งว่าง การจัดลำดับอาวุโส ความรู้ความสามารถและผลงานเชิงประจักษ์ของผู้ร้องทุกข์กับผู้ได้รับการแต่งตั้งข้ามลำดับ หากไม่มีพยานหลักฐานว่าผู้ได้รับการแต่งตั้งข้ามลำดับมีความรู้ความสามารถโดดเด่นกว่าผู้ร้องทุกข์อย่างเห็นได้ชัดเจน ให้สรุปตามบรรทัดฐานว่า "แม้ไม่ปรากฏว่าเป็นการใช้ดุลพินิจที่ไม่สุจริต แต่เป็นการใช้ดุลพินิจที่ไม่เหมาะสม"',
    'ข้อเสนอเบื้องต้น': 'ร่างคำวินิจฉัยส่วนท้ายตามแบบ ก.พ.ค.ตร.: "จึงวินิจฉัยให้คณะกรรมการข้าราชการตำรวจ คู่กรณีในการร้องทุกข์ที่ ๑ และผู้บัญชาการตำรวจแห่งชาติ คู่กรณีในการร้องทุกข์ที่ ๒ ดำเนินการคัดเลือกแต่งตั้งให้ผู้ร้องทุกข์ดำรงตำแหน่ง... ในวาระการแต่งตั้งประจำปี... ทั้งนี้ หากไม่พอใจมีสิทธิฟ้องต่อศาลปกครองสูงสุดภายในเก้าสิบวันนับแต่วันที่ได้รับแจ้งผล"'
  };

  return `${base}\nแนวทางเฉพาะส่วน "${section}": ${sectionGuides[section] || 'จัดทำข้อความตามโครงสร้างและสำนวนภาษาราชการ ก.พ.ค.ตร.'}`;
}

export const localAiStatus=(env=process.env)=>getAiHarnessStatus(env);

export async function proposeLocalSection({job,documents,knowledge,section,userId='local_user',env=process.env,fetchImpl=globalThis.fetch}){
 if(!sections.includes(section))fail('ส่วนร่างไม่ถูกต้อง');
 if(job.data.bundle_fingerprint!==knowledge.summary.fingerprint)fail('ฐานเปลี่ยน ต้องตรวจแหล่งและเริ่มงานด้วยรุ่นปัจจุบัน',409);
 const allowed=allowedSources(job,documents);
 if(!allowed.some(source=>source.kind!=='assertion'))fail('ต้องตรวจและอนุมัติแหล่งก่อนเรียก AI');
 if(section==='กฎหมายและหลักเกณฑ์'&&!allowed.some(source=>source.kind==='law'))fail('ยังไม่มีข้อความกฎหมายที่ตรวจและอนุมัติ หยุดร่างส่วนนี้จนยืนยันแหล่งครบ');
 const result=analyze(job,documents,knowledge);
 const snapshot={job_id:job.id,job_version:job.version,section,case_context:{title:job.data.title,external_case_ref:job.data.external_case_ref,subject_name:job.data.subject_name,rank_position:job.data.rank_position},claims:result.claims,facts:result.facts,issues:job.data.issues,person:result.person,quota:result.quota,gaps:result.gaps,allowed_sources:allowed};
 const instructions=buildInstructions(section);
 const generated=await createAiHarness({env,fetchImpl}).generateStructured({instructions,input:snapshot,schemaName:'section_proposal',schema,approvedSourceIds:allowed.map(source=>source.id),sensitiveValues:[{kind:'PERSON',value:job.data.subject_name||''},{kind:'CASE',value:job.data.external_case_ref||''}],userId});
 const proposal=validateProposal(generated.data,allowed);
 return {...proposal,section,job_version:job.version,bundle_fingerprint:job.data.bundle_fingerprint,provider:generated.meta.provider,model:generated.meta.model,response_id:generated.meta.responseId,usage:generated.meta.usage,input_hash:generated.meta.inputHash,redacted_count:generated.meta.redactedCount,source_ids:allowed.map(source=>source.id),source_snapshot:allowed,citation_status:'IDS_VALIDATED_SEMANTIC_REVIEW_REQUIRED'};
}
