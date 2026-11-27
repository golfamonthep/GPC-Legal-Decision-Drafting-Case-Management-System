import { evaluateCircular2456Rules, resolveJobTier, resolveSeniorityQuotaSpec } from './subGeneralToInspectorData.mjs';
import { evaluateDisciplineAppealRules } from './disciplineAppealData.mjs';

const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';
export const normalizeSearchText = (x) =>
  String(x || '')
    .normalize('NFC')
    .replace(/[๐-๙]/g, (d) => String(THAI_DIGITS.indexOf(d)))
    .replace(/\s+/g, '')
    .toLowerCase();

export const normalizeName = (x) =>
  String(x || '')
    .normalize('NFC')
    .replace(
      /^(?:ว่าที่\s*)?(?:พล\.?\s*ต\.?\s*[อทต]\.?|พ\.?\s*ต\.?\s*[อทต]\.?|ร\.?\s*ต\.?\s*[อทต]\.?|ด\.?\s*ต\.?|จ\.?\s*ส\.?\s*ต\.?|ส\.?\s*ต\.?\s*[อทต]\.?|พลตำรวจ(?:เอก|โท|ตรี)|พันตำรวจ(?:เอก|โท|ตรี)|ร้อยตำรวจ(?:เอก|โท|ตรี)|ดาบตำรวจ|จ่าสิบตำรวจ|สิบตำรวจ(?:เอก|โท|ตรี))(?:\s*หญิง|\s*\(หญิง\))?\s*/,
      '',
    )
    .replace(/\s+/g, '');

export const sections = [
  'ข้อมูลเรื่องและบุคคล',
  'คำร้องและคำขอ',
  'คำชี้แจง',
  'ข้อเท็จจริงและหลักฐาน',
  'ประเด็นที่พิจารณา',
  'กฎหมายและหลักเกณฑ์',
  'การวิเคราะห์',
  'ข้อเสนอเบื้องต้น',
];

export function buildAutoDraftSections(job, documents, knowledge, analysisResult = null) {
  const j = job.data || {};
  const res = analysisResult || analyze(job, documents, knowledge, false);
  const isDisciplineAppeal = res.tier === 'discipline_appeal' || res.is_discipline_appeal;
  const isSubGen = res.is_sub_general;
  const person = res.person || (res.person_candidates?.length === 1 ? res.person_candidates[0] : null);
  const apptMatches = res.appointment_matches || [];
  const subj =
    [j.rank_position, j.subject_name].filter(Boolean).join(' ').trim() ||
    (isDisciplineAppeal ? '(ยังไม่ระบุชื่อ-สกุลผู้อุทธรณ์)' : '(ยังไม่ระบุชื่อ-สกุลผู้ร้องทุกข์)');
  const lawRefs = (j.references || []).filter((r) => r.kind === 'law' && r.reviewed);
  const lawCiteTag = lawRefs.length ? ` [${lawRefs[0].id}]` : '';
  const establishedFacts = (j.facts || []).filter((f) => f.status === 'established');
  const reviewedDocs = (documents || []).filter((d) => d.data?.reviewed);
  const ruleSummaryLines = (res.rule_checks || []).map(
    (c, idx) => `${idx + 1}. ${c.title}: ${c.detail}`,
  );

  if (isDisciplineAppeal) {
    return {
      'ข้อมูลเรื่องและบุคคล': [
        `เรื่อง: ${j.title || 'วิเคราะห์อุทธรณ์คำสั่งลงโทษทางวินัย / สั่งให้ออกจากราชการ ต่อ ก.พ.ค.ตร.'}`,
        `เลขสำนวน/อ้างอิง: ${j.external_case_ref || '(ยังไม่ระบุเลขดำ/เลขสำนวนอุทธรณ์)'}`,
        `ผู้อุทธรณ์: ${subj}`,
        `กรอบการพิจารณาวินิจฉัย: เรื่องอุทธรณ์คำสั่งลงโทษทางวินัยหรือสั่งให้ออกจากราชการ ต่อ ก.พ.ค.ตร. (พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ หมวด ๗–๙ ม.๑๐๕–๑๔๖, กฎ ก.พ.ค.ตร. ว่าด้วยการอุทธรณ์ฯ พ.ศ. ๒๕๖๗, กฎ ก.ตร. ว่าด้วยการดำเนินการทางวินัย พ.ศ. ๒๕๖๙ และคำสั่ง ตร. ที่ ๕๑๕/๒๕๖๙ ลง ๒๔ พ.ย. ๒๕๖๙)`,
        `คู่กรณีในอุทธรณ์ / หน่วยผู้สั่งการ: ${j.unit_name || '(ยังไม่ระบุผู้บังคับบัญชาผู้สั่งลงโทษ/คู่กรณีในอุทธรณ์)'}`,
        `ประเภทคำสั่งที่อุทธรณ์: ${j.appointment_motion || j.level || '(ยังไม่ระบุประเภทคำสั่งลงโทษหรือสั่งให้ออกจากราชการ)'}`,
      ]
        .filter(Boolean)
        .join('\n'),

      'คำร้องและคำขอ': j.claim
        ? `ผู้อุทธรณ์ (${subj}) ยื่นหนังสืออุทธรณ์ต่อ ก.พ.ค.ตร. สรุปสาระสำคัญได้ว่า ${j.claim} [input-claim]`
        : `ผู้อุทธรณ์ (${subj}) ยื่นอุทธรณ์คำสั่งลงโทษทางวินัยหรือคำสั่งให้ออกจากราชการต่อ ก.พ.ค.ตร. ตามมาตรา ๑๔๑ แห่ง พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ (โปรดระบุข้อโต้แย้งและคำขอท้ายคำอุทธรณ์เพิ่มเติม)`,

      'คำชี้แจง': j.response
        ? `คู่กรณีในอุทธรณ์ (ผู้บังคับบัญชาผู้สั่งการ) ทำคำแก้อุทธรณ์ชี้แจงสรุปสาระสำคัญได้ว่า ${j.response} [input-response]`
        : `(ยังไม่มีข้อมูลคำแก้อุทธรณ์ของคู่กรณีในอุทธรณ์หรือสำนวนการสอบสวนทางวินัย — อยู่ระหว่างรวบรวมคำแก้อุทธรณ์และเอกสารในสำนวน)`,

      'ข้อเท็จจริงและหลักฐาน': [
        ...establishedFacts.map(
          (f, idx) =>
            `${idx + 1}. ${f.text} ${(f.citations || []).map((c) => `[${c}]`).join(' ')}`.trim(),
        ),
        ...reviewedDocs.map((d) => `- เอกสารประกอบในสำนวนอุทธรณ์ที่ตรวจแล้ว: ${d.name} [doc-${d.id}]`),
        !establishedFacts.length && !reviewedDocs.length
          ? `(อยู่ระหว่างรวบรวมข้อเท็จจริงที่ยืนยันจากคำสั่งลงโทษ/ให้ออกจากราชการ สำนวนการสืบสวนหรือสอบสวนทางวินัย วันทราบคำสั่งเพื่อตรวจกรอบ ๓๐ วัน และคำแก้อุทธรณ์)`
          : '',
      ]
        .filter(Boolean)
        .join('\n'),

      'ประเด็นที่พิจารณา': j.issues
        ? j.issues
        : `๑. อุทธรณ์ของผู้อุทธรณ์ (${subj}) อยู่ในเขตอำนาจและยื่นภายในกำหนดระยะเวลา ๓๐ วันตามมาตรา ๑๔๑ และกฎ ก.พ.ค.ตร. ว่าด้วยการอุทธรณ์ฯ พ.ศ. ๒๕๖๗ หรือไม่\n๒. การดำเนินการทางวินัยและการออกคำสั่งลงโทษหรือสั่งให้ออกจากราชการชอบด้วยกฎหมาย ("ไม่ถูกต้อง" หรือไม่) ตาม พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ หมวด ๗–๘, กฎ ก.ตร. วินัย ๒๕๖๙ และหลักการมอบอำนาจ/สายรายงานตามคำสั่ง ตร. ที่ ๕๑๕/๒๕๖๙ (หรือบทเฉพาะกาลคำสั่ง ตร. ที่ ๔๓๖/๒๕๔๘ ข้อ ๑๙) หรือไม่\n๓. การวินิจฉัยข้อเท็จจริง การชั่งน้ำหนักพยานหลักฐานสนับสนุนกับหักล้าง และดุลพินิจกำหนดระดับโทษเหมาะสมและเป็นธรรม ("ไม่เหมาะสม" หรือไม่) ตามคำสั่ง ตร. ที่ ๕๑๕/๒๕๖๙ ข้อ ๑ และข้อ ๑๘ หรือไม่`,

      'กฎหมายและหลักเกณฑ์': [
        `พิเคราะห์แล้วเห็นว่า หลักกฎหมาย กฎ ก.พ.ค.ตร. กฎ ก.ตร. และคำสั่งสำนักงานตำรวจแห่งชาติที่เกี่ยวข้องกับการพิจารณาวินิจฉัยอุทธรณ์ทางวินัยในเรื่องนี้${lawCiteTag} มีสาระสำคัญดังนี้`,
        ...ruleSummaryLines,
        ...lawRefs.slice(0, 8).map((r) => `- ${r.label}: ${String(r.text || '').slice(0, 320)} [${r.id}]`),
      ]
        .filter(Boolean)
        .join('\n'),

      'การวิเคราะห์': [
        `พิจารณาแล้วเห็นว่า เรื่องนี้เป็นการดำเนินการทางวินัย/สั่งให้ออกจากราชการ จึงอยู่ในกรอบการพิจารณาวินิจฉัย "อุทธรณ์" ของ ก.พ.ค.ตร. ตามมาตรา ๑๔๑–๑๔๖ แห่ง พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕`,
        `- ด้านความชอบด้วยกฎหมายของอำนาจและขั้นตอน ("ไม่ถูกต้อง" หรือไม่): ตรวจสอบอำนาจผู้สั่งแต่งตั้งคณะกรรมการสอบสวนและผู้สั่งลงโทษตาม พ.ร.บ.ตำรวจแห่งชาติฯ ม.๑๐๕, ม.๑๑๗, ม.๑๑๙, ม.๑๒๔–๑๒๖ และคำสั่ง ตร. ที่ ๕๑๕/๒๕๖๙ ข้อ ๒–๖, ข้อ ๙–๑๕ รวมถึงกฎห้าม ผบช. ส่งเรื่องกลับ ผบก. กรณีเห็นว่าผิดวินัยอย่างร้ายแรงตาม ม.๑๒๖ วรรคสาม และบทเฉพาะกาลข้อ ๑๙ (กรณีค้างตามคำสั่ง ๔๓๖/๒๕๔๘)`,
        `- ด้านการใช้ดุลพินิจและระดับโทษ ("ไม่เหมาะสม" หรือไม่): ชั่งน้ำหนักพยานหลักฐานที่สนับสนุนข้อกล่าวหากับพยานหลักฐานที่หักล้างข้อกล่าวหาด้วยความเป็นธรรมตามคำสั่ง ตร. ที่ ๕๑๕/๒๕๖๙ ข้อ ๑ และข้อ ๑๘`,
        j.claim
          ? `- ด้านข้อโต้แย้งของผู้อุทธรณ์: ${j.claim} [input-claim]`
          : `- ด้านข้อโต้แย้งของผู้อุทธรณ์: (รอระบุรายละเอียดคำอุทธรณ์เพิ่มเติม)`,
        j.response
          ? `- ด้านคำแก้อุทธรณ์ของคู่กรณีในอุทธรณ์: ${j.response} [input-response]`
          : `- ด้านคำแก้อุทธรณ์ของคู่กรณีในอุทธรณ์: (รอตรวจสอบคำแก้อุทธรณ์และสำนวนการสอบสวนวินัย)`,
        res.gaps?.length
          ? `- ข้อมูลที่ต้องตรวจสอบเพิ่มเติมก่อนจัดทำคำวินิจฉัยอุทธรณ์:\n${res.gaps.map((g) => `  • ${g}`).join('\n')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n'),

      'ข้อเสนอเบื้องต้น': res.gaps?.length
        ? `เห็นควรตรวจสอบพยานหลักฐานและเอกสารในสำนวนอุทธรณ์เพิ่มเติมในประเด็นที่ยังขาด (${res.gaps.length} รายการ) เพื่อประกอบการพิจารณาวินิจฉัยอุทธรณ์ของ ก.พ.ค.ตร. ว่าควรยกอุทธรณ์ แก้ไข/ลดโทษ หรือเพิกถอนคำสั่งต่อไป (ร่างเบื้องต้นสำหรับตรวจทาน)`
        : `ข้อมูลหลักฐานและข้อกฎหมายอุทธรณ์ทางวินัยครบถ้วนเบื้องต้น เห็นควรนำเสนอผู้รับผิดชอบสำนวนตรวจทานร่างคำวินิจฉัยอุทธรณ์ ก.พ.ค.ตร. ต่อไป`,
    };
  }

  const tierLabel = isSubGen
    ? 'ระดับ รอง ผบก. ลงมาถึง สว. (คำสั่ง ผบ.ตร. สำหรับสังกัด สง.ผบ.ตร. หรือ คำสั่ง ผบช. สำหรับสังกัด บช. ที่มิได้สังกัด สง.ผบ.ตร.)'
    : 'ระดับ ผบก. ขึ้นไป หรือระดับนายพล (คัดเลือกโดย ผบ.ตร. ผ่านคณะกรรมการระดับ ตร. เสนอ ก.ตร. ให้ความเห็นชอบ และทรงพระกรุณาโปรดเกล้าฯ แต่งตั้ง)';

  const seniorityLine = person
    ? `ปรากฏข้อมูลลำดับอาวุโสในบัญชี "${person.source_level || j.level || '-'}" (${person.source_account || j.account || '-'}) ลำดับที่ ${person.seniority_order || '-'} จากจำนวนผู้เหมาะสมทั้งหมด ${person.total_suitable_population || '-'} ราย (อ้างอิง ${person.source_pdf || '-'} หน้า ${person.page || '-'})${person.id ? ` [${person.id}]` : ''}`
    : '(ยังไม่ได้แนบรายการยืนยันลำดับอาวุโสเฉพาะราย — อยู่ระหว่างตรวจสอบบัญชีอาวุโสต้นฉบับ)';
  const apptLine = apptMatches.length
    ? `ปรากฏข้อมูลในบัญชีแต่งตั้ง: ${apptMatches.map((a) => `${a.label || ''} (${a.text || ''})`).join(' ; ')}`
    : '';

  const quotaText = res.quota
    ? `เมื่อคำนวณจากจำนวนตำแหน่งว่างจริง ${res.quota.actual_vacancies} ตำแหน่ง ตามหลักเกณฑ์สัดส่วนอาวุโส (${res.quota.quota_pct_label}) คิดเป็นกลุ่มอาวุโสจำนวน ${res.quota.seniority_quota} ตำแหน่ง และกลุ่มความรู้ความสามารถประกอบอาวุโสจำนวน ${res.quota.knowledge_ability_quota} ตำแหน่ง`
    : isSubGen
      ? '(อยู่ระหว่างตรวจสอบจำนวนตำแหน่งว่างจริงของหน่วย เพื่อคำนวณสัดส่วนอาวุโสไม่น้อยกว่าร้อยละ ๓๓ ตามมาตรา ๘๒ (๓) และกฎ ก.ตร.ฯ ข้อ ๔๗ (๓))'
      : '(อยู่ระหว่างตรวจสอบจำนวนตำแหน่งว่างจริงระดับ ตร. เพื่อคำนวณสัดส่วนอาวุโสตามมาตรา ๘๒ (๑)–(๒) และกฎ ก.ตร.ฯ ข้อ ๔๗ (๑)–(๒))';

  return {
    'ข้อมูลเรื่องและบุคคล': [
      `เรื่อง: ${j.title || 'วิเคราะห์การแต่งตั้งข้าราชการตำรวจ'}`,
      `เลขสำนวน/อ้างอิง: ${j.external_case_ref || '(ยังไม่ระบุเลขสำนวน)'}`,
      `ผู้ร้องทุกข์: ${subj}`,
      `กรอบการวิเคราะห์: ${tierLabel}`,
      `ระดับการแต่งตั้งที่พิจารณา: ${j.level || '(ระบบประมวลผลตามกรอบตำแหน่งเบื้องต้น — โปรดระบุระดับการแต่งตั้งเพิ่มเติมหากมี)'}`,
      `กลุ่มสายงาน/บัญชี/หน่วย: ${[j.account, j.unit_name].filter(Boolean).join(' · ') || '(ยังไม่ระบุกลุ่มสายงานหรือหน่วย)'}`,
      `ข้อมูลลำดับอาวุโส: ${seniorityLine}`,
      apptLine,
    ]
      .filter(Boolean)
      .join('\n'),

    'คำร้องและคำขอ': j.claim
      ? `ผู้ร้องทุกข์ (${subj}) ยื่นหนังสือร้องทุกข์สรุปสาระสำคัญได้ว่า ${j.claim} [input-claim]`
      : `ผู้ร้องทุกข์ (${subj}) ยื่นหนังสือร้องทุกข์เกี่ยวกับการแต่งตั้งข้าราชการตำรวจในกรอบ${isSubGen ? 'ระดับ รอง ผบก. ลงมาถึง สว.' : 'ระดับ ผบก. ขึ้นไป หรือระดับนายพล'} (ข้อมูลคำร้องและคำขอยังระบุไม่ครบถ้วน — โปรดระบุสาระคำร้องและคำขอท้ายคำร้องทุกข์เพิ่มเติม)`,

    'คำชี้แจง': j.response
      ? `คู่กรณีในร้องทุกข์ / หน่วยผู้มีอำนาจสั่งแต่งตั้งชี้แจงสรุปสาระสำคัญได้ว่า ${j.response} [input-response]`
      : `(ยังไม่มีข้อมูลคำชี้แจงของคู่กรณีในร้องทุกข์หรือรายงานการประชุมคณะกรรมการกลั่นกรองการแต่งตั้ง — อยู่ระหว่างรวบรวมคำชี้แจงและเอกสารประกอบ)`,

    'ข้อเท็จจริงและหลักฐาน': [
      person ? `๑. ข้อมูลลำดับอาวุโส: ${seniorityLine}` : '',
      apptLine ? `๒. ข้อมูลคำสั่ง/บัญชีแต่งตั้ง: ${apptLine}` : '',
      ...establishedFacts.map(
        (f, idx) =>
          `${idx + (person ? 2 : 1) + (apptLine ? 1 : 0)}. ${f.text} ${
            (f.citations || []).map((c) => `[${c}]`).join(' ')
          }`.trim(),
      ),
      ...reviewedDocs.map((d) => `- เอกสารประกอบที่ตรวจแล้ว: ${d.name} [doc-${d.id}]`),
      !person && !establishedFacts.length && !reviewedDocs.length
        ? `(อยู่ระหว่างรวบรวมข้อเท็จจริงที่ยืนยันจากต้นฉบับบัญชีอาวุโส ตารางตำแหน่งว่าง และรายงานการประชุมคณะกรรมการแต่งตั้ง)`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),

    'ประเด็นที่พิจารณา': j.issues
      ? j.issues
      : isSubGen
        ? `การแต่งตั้งข้าราชการตำรวจระดับ รอง ผบก. ลงมาถึง สว. ในส่วนที่เกี่ยวกับผู้ร้องทุกข์ (${subj}) ชอบด้วยพระราชบัญญัติตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗ (๗)–(๑๐), มาตรา ๗๙, มาตรา ๘๐, มาตรา ๘๑ (๑)(ข)/(๒), มาตรา ๘๒ (๓)–(๔), มาตรา ๘๕, กฎ ก.ตร. ว่าด้วยการแต่งตั้งข้าราชการตำรวจ พ.ศ. ๒๕๖๗ ข้อ ๗ (๑)(ค), ข้อ ๑๗, ข้อ ๒๑, ข้อ ๓๔ วรรคสอง, ข้อ ๔๐, ข้อ ๔๗ (๓)–(๔) และแนวทางตามหนังสือ ตร. ที่ ๐๐๐๙.๒๓๑/ว ๒๔๕๖ หรือไม่`
        : `การคัดเลือกหรือแต่งตั้งข้าราชการตำรวจระดับ ผบก. ขึ้นไป (ระดับนายพล) ในส่วนที่เกี่ยวกับผู้ร้องทุกข์ (${subj}) ชอบด้วยพระราชบัญญัติตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ มาตรา ๗๗ (๑)–(๖), มาตรา ๗๘, มาตรา ๘๑ (๑)(ก), มาตรา ๘๒ (๑)–(๒),(๔) และกฎ ก.ตร. ว่าด้วยการแต่งตั้งข้าราชการตำรวจ พ.ศ. ๒๕๖๗ ข้อ ๗ (๑)(ข), ข้อ ๑๗, ข้อ ๒๖, ข้อ ๓๔ วรรคหนึ่ง, ข้อ ๓๙ และข้อ ๔๗ (๑)–(๒),(๔) หรือไม่`,

    'กฎหมายและหลักเกณฑ์': [
      `พิเคราะห์แล้วเห็นว่า หลักกฎหมายและหลักเกณฑ์ที่เกี่ยวข้องกับการแต่งตั้งข้าราชการตำรวจในเรื่องนี้${lawCiteTag} มีสาระสำคัญดังนี้`,
      ...ruleSummaryLines,
      ...lawRefs.slice(0, 6).map((r) => `- ${r.label} (หน้า ${r.page}): ${String(r.text || '').slice(0, 320)} [${r.id}]`),
    ]
      .filter(Boolean)
      .join('\n'),

    'การวิเคราะห์': [
      `พิจารณาแล้วเห็นว่า จากข้อมูลเท่าที่ปรากฏในชั้นนี้ ผู้ร้องทุกข์ (${subj}) อยู่ในกรอบการพิจารณา${tierLabel}`,
      person ? `- ด้านลำดับอาวุโสและคุณสมบัติ: ${seniorityLine}` : `- ด้านลำดับอาวุโสและคุณสมบัติ: ${seniorityLine}`,
      `- ด้านสัดส่วนโควตาอาวุโสและตำแหน่งว่าง: ${quotaText}`,
      j.claim
        ? `- ด้านข้อโต้แย้งตามคำร้องทุกข์: ผู้ร้องทุกข์อ้างว่า ${j.claim} [input-claim]`
        : `- ด้านข้อโต้แย้งตามคำร้องทุกข์: (รอระบุรายละเอียดข้อโต้แย้งของผู้ร้องทุกข์เพิ่มเติม)`,
      j.response
        ? `- ด้านเหตุผลและดุลพินิจของหน่วย: ผู้มีอำนาจชี้แจงว่า ${j.response} [input-response]`
        : `- ด้านเหตุผลและดุลพินิจของหน่วย: (รอตรวจสอบคำชี้แจงและรายงานการประชุมคณะกรรมการแต่งตั้งตาม${isSubGen ? 'มาตรา ๘๑ (๑)(ข)/(๒) และข้อ ๔๐' : 'มาตรา ๘๑ (๑)(ก) และข้อ ๓๙'})`,
      res.gaps?.length
        ? `- ข้อมูลที่ต้องตรวจสอบเพิ่มเติมเพื่อให้การวินิจฉัยครบถ้วนสมบูรณ์:\n${res.gaps.map((g) => `  • ${g}`).join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),

    'ข้อเสนอเบื้องต้น': res.gaps?.length
      ? `เห็นควรรวบรวมและตรวจสอบพยานหลักฐานเพิ่มเติมในประเด็นที่ยังขาด (${res.gaps.length} รายการ ได้แก่ ${res.gaps.slice(0, 3).join(' / ')}) เพื่อประกอบการพิจารณาวินิจฉัยว่าการใช้ดุลพินิจแต่งตั้งเป็นไปตามหลักเกณฑ์ที่กฎหมายและกฎ ก.ตร. กำหนดหรือไม่ (ร่างเบื้องต้นสำหรับตรวจทาน)`
      : `ข้อมูลหลักฐานและหลักเกณฑ์ครบถ้วนเบื้องต้น เห็นควรนำเสนอผู้รับผิดชอบสำนวนตรวจทานร่างคำวินิจฉัยตามกรอบ${isSubGen ? 'ระดับ รอง ผบก. ลงมาถึง สว.' : 'ระดับ ผบก. ขึ้นไป'}ต่อไป`,
  };
}

export function analyze(job, documents, knowledge, includeAutoDraft = true) {
  const j = job.data;
  const refs = j.references || [];
  const facts = j.facts || [];
  const gaps = [];
  const tier = resolveJobTier(j);

  if (tier === 'discipline_appeal') {
    const ruleAnalysis = evaluateDisciplineAppealRules(j, refs, facts);
    const unreviewed = documents.filter((d) => !d.data.reviewed);
    if (unreviewed.length) gaps.push(`เอกสารประกอบอุทธรณ์ ${unreviewed.length} ฉบับยังไม่ได้ตรวจข้อความ`);
    if (!refs.some((r) => r.kind === 'law' && r.reviewed)) {
      gaps.push('ยังไม่มีข้อความกฎหมายวินัย/อุทธรณ์ (เช่น พ.ร.บ.ตำรวจ ๒๕๖๕, กฎ ก.พ.ค.ตร. อุทธรณ์ ๒๕๖๗, คำสั่ง ตร. ๕๑๕/๒๕๖๙) ที่อนุมัติสำหรับงานนี้');
    }
    for (const f of facts) {
      if (f.status === 'established' && !f.citations?.length) {
        gaps.push('ข้อเท็จจริงที่ยืนยันยังไม่มีแหล่งอ้างอิง: ' + f.text);
      }
    }
    if (!j.claim?.trim()) gaps.push('ยังไม่ได้ระบุสาระสำคัญของคำอุทธรณ์และคำขอของผู้อุทธรณ์');
    if (!j.response?.trim()) gaps.push('ยังไม่ได้ระบุสาระสำคัญของคำแก้อุทธรณ์จากผู้บังคับบัญชาผู้สั่งการ');

    const baseResult = {
      status: gaps.length ? 'NEEDS_REVIEW' : 'READY_FOR_REVIEW',
      job_version: job.version,
      bundle_fingerprint: j.bundle_fingerprint,
      current_bundle_fingerprint: knowledge.summary.fingerprint,
      source_stale: j.bundle_fingerprint !== knowledge.summary.fingerprint,
      tier: 'discipline_appeal',
      is_sub_general: false,
      is_discipline_appeal: true,
      rule_checks: ruleAnalysis.checks,
      claims: [
        { id: 'input-claim', text: j.claim || '', status: 'assertion' },
        { id: 'input-response', text: j.response || '', status: 'assertion' },
      ].filter((f) => f.text),
      facts,
      person: null,
      person_candidates: [],
      appointment_matches: [],
      quota: null,
      gaps,
      auto_draft_sections: /** @type {Record<string, string> | undefined} */ (undefined),
      references: refs.map(({ id, kind, label, source_pdf, page, reviewed, role }) => ({
        id,
        kind,
        label,
        source_pdf,
        page,
        reviewed,
        role,
      })),
    };
    if (includeAutoDraft) {
      baseResult.auto_draft_sections = buildAutoDraftSections(job, documents, knowledge, baseResult);
    }
    return baseResult;
  }

  const ruleAnalysis = evaluateCircular2456Rules(j, refs, facts);

  const matches = (knowledge.seniority || []).filter(
    (s) =>
      normalizeName(s.source_name) === normalizeName(j.subject_name) &&
      (!j.level || s.source_level === j.level) &&
      (!j.account || s.source_account === j.account),
  );
  const appointment_matches = j.subject_name
    ? (knowledge.appointments || []).filter(
        (a) => normalizeName(a.label || a.source_name || '') === normalizeName(j.subject_name),
      )
    : [];
  const selected = refs.filter(
    (r) =>
      r.kind === 'seniority' &&
      normalizeName(r.label) === normalizeName(j.subject_name) &&
      (!j.level || r.source_level === j.level) &&
      (!j.account || r.source_account === j.account),
  );
  const m = j.manual_seniority;
  const manual =
    m?.verified &&
    normalizeName(m.label) === normalizeName(j.subject_name) &&
    (!j.level || m.source_level === j.level) &&
    (!j.account || m.source_account === j.account)
      ? m
      : null;
  const person = selected.length === 1 ? selected[0] : manual;
  if (!person) {
    if (matches.length > 1) {
      gaps.push('พบชื่อซ้ำหรือหลายบัญชี ต้องเลือกรายการและตรวจยศ/ตำแหน่งจากต้นฉบับ');
    } else if (ruleAnalysis.is_sub_general) {
      gaps.push(
        'ยังไม่มีข้อมูลอาวุโสที่เลือกยืนยันสำหรับบุคคลนี้ (ระดับ รอง ผบก. ลงมาถึง สว. ให้ระบุลำดับอาวุโสและจำนวนผู้เหมาะสมจากประกาศลำดับอาวุโสของหน่วย / ผนวก ก การไม่พบใน 181 รายไม่พิสูจน์ว่าไม่มีชื่อในบัญชี)',
      );
    } else {
      gaps.push('ยังไม่มีข้อมูลอาวุโสที่เลือกยืนยันสำหรับบุคคลนี้ การไม่พบใน 181 รายไม่พิสูจน์ว่าไม่มีชื่อในบัญชี');
    }
  }
  const unreviewed = documents.filter((d) => !d.data.reviewed);
  if (unreviewed.length) gaps.push(`เอกสาร ${unreviewed.length} ฉบับยังไม่ได้ตรวจข้อความ`);
  if (!refs.some((r) => r.kind === 'law' && r.reviewed))
    gaps.push('ยังไม่มีข้อความกฎหมายที่ตรวจจากต้นฉบับและอนุมัติสำหรับงานนี้');
  for (const f of facts)
    if (f.status === 'established' && !f.citations?.length) gaps.push('ข้อเท็จจริงที่ยืนยันยังไม่มีแหล่ง: ' + f.text);

  let quota = null;
  const v = j.vacancies;
  const quotaSpec = resolveSeniorityQuotaSpec(j);
  if (
    v?.value !== undefined &&
    v?.value !== null &&
    Number.isSafeInteger(v.value) &&
    v.value >= 0 &&
    v.vacancy_reference &&
    v.rule_reference &&
    refs.some((r) => r.id === v.vacancy_reference && r.reviewed && r.role !== 'reference_only') &&
    refs.some((r) => r.id === v.rule_reference && r.reviewed && r.kind === 'law') &&
    v.applies === true
  ) {
    const senioritySeats = Math.ceil(v.value * quotaSpec.ratio);
    quota = {
      actual_vacancies: v.value,
      seniority_quota: senioritySeats,
      knowledge_ability_quota: Math.max(0, v.value - senioritySeats),
      quota_pct_label: quotaSpec.pctLabel,
      formula: quotaSpec.formula,
      citations: [v.vacancy_reference, v.rule_reference],
    };
  } else {
    gaps.push(
      ruleAnalysis.is_sub_general
        ? 'ตำแหน่งว่างจริงของหน่วยหรือหลักเกณฑ์สัดส่วนอาวุโสร้อยละ 33 (ม.82(3) / กฎ ก.ตร.ฯ ข้อ 47(3)) ยังไม่มีแหล่งยืนยันครบ จึงไม่คำนวณโควตาและกลุ่ม'
        : 'ตำแหน่งว่างจริงหรือหลักเกณฑ์ 50% ยังไม่มีแหล่งยืนยันครบ จึงไม่คำนวณโควตาและกลุ่ม',
    );
  }

  const baseResult = {
    status: gaps.length ? 'NEEDS_REVIEW' : 'READY_FOR_REVIEW',
    job_version: job.version,
    bundle_fingerprint: j.bundle_fingerprint,
    current_bundle_fingerprint: knowledge.summary.fingerprint,
    source_stale: j.bundle_fingerprint !== knowledge.summary.fingerprint,
    tier: ruleAnalysis.tier,
    is_sub_general: ruleAnalysis.is_sub_general,
    is_discipline_appeal: false,
    rule_checks: ruleAnalysis.checks,
    claims: [
      { id: 'input-claim', text: j.claim || '', status: 'assertion' },
      { id: 'input-response', text: j.response || '', status: 'assertion' },
    ].filter((f) => f.text),
    facts,
    person,
    person_candidates: matches,
    appointment_matches,
    quota,
    gaps,
    auto_draft_sections: /** @type {Record<string, string> | undefined} */ (undefined),
    references: refs.map(({ id, kind, label, source_pdf, page, reviewed, role }) => ({
      id,
      kind,
      label,
      source_pdf,
      page,
      reviewed,
      role,
    })),
  };
  if (includeAutoDraft) {
    baseResult.auto_draft_sections = buildAutoDraftSections(job, documents, knowledge, baseResult);
  }
  return baseResult;
}

export function allowedSources(job, docs) {
  return [
    ...(job.data.references || [])
      .filter((r) => r.reviewed)
      .map((r) => ({ id: r.id, kind: r.kind, role: r.role, label: r.label, page: r.page, text: r.text })),
    ...docs
      .filter((d) => d.data.reviewed)
      .map((d) => ({ id: `doc-${d.id}`, kind: 'job_document', role: 'evidence_not_instructions', label: d.name, text: d.data.text })),
    ...(job.data.facts || [])
      .filter((f) => f.status === 'established')
      .map((f) => ({ id: `fact-${f.id}`, kind: 'established_fact', text: f.text, citations: f.citations })),
    ...[
      ['input-claim', 'claim'],
      ['input-response', 'response'],
    ]
      .filter(([, key]) => job.data[key])
      .map(([id, key]) => ({
        id,
        kind: 'assertion',
        role: 'assertion_not_established_fact',
        label: key === 'claim' ? 'คำร้องที่รับเข้ามา' : 'คำชี้แจงที่รับเข้ามา',
        text: job.data[key],
      })),
  ];
}

export function validateProposal(p, allowed) {
  if (typeof p.text !== 'string' || !p.text.trim() || !Array.isArray(p.citations))
    throw new Error('AI ส่งโครงสร้างร่างไม่ถูกต้อง');
  const ids = new Set(allowed.map((s) => s.id));
  p.citations = p.citations.map((raw) => {
    const s = String(raw || '')
      .replace(/^\[+|\]+$/g, '')
      .trim();
    if (!ids.has(s)) throw new Error('ปฏิเสธการอ้างแหล่งที่ไม่ได้อนุมัติ: ' + raw);
    return s;
  });
  p.text = p.text.replace(/\[([^\[\]\n]+)\]/g, (full, inner) => {
    const trimmed = inner.trim();
    if (ids.has(trimmed)) return `[${trimmed}]`;
    const parts = trimmed
      .split(/\s*[,;]\s*/)
      .map((x) => x.replace(/^\[+|\]+$/g, '').trim())
      .filter(Boolean);
    if (parts.length > 1 && parts.every((pt) => ids.has(pt))) {
      return parts.map((pt) => `[${pt}]`).join(' ');
    }
    if (/[\u0E00-\u0E7F]/.test(trimmed) && !/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      return `(${trimmed})`;
    }
    throw new Error('ปฏิเสธรหัสอ้างอิงที่ไม่อยู่ในงาน: ' + trimmed);
  });
  if (!Array.isArray(p.gaps)) p.gaps = [];
  return p;
}
