import React from 'react';
import { Field } from './components';

const GENERAL_LEVEL_LABELS = {
  'รอง ผบช. / รอง จตร.': 'รอง ผบช. / รอง จตร. (เลื่อนเป็น ผบช. / จตร. · ม.๗๗(๔) ครองตำแหน่ง ≥ ๒ ปี)',
  'ผบก. / เทียบเท่า': 'ผบก. / เทียบเท่า (เลื่อนเป็น รอง ผบช. / รอง จตร. · ม.๗๗(๕) ครองตำแหน่ง ≥ ๓ ปี)',
  'รอง ผบก. / เทียบเท่า': 'รอง ผบก. / เทียบเท่า (เลื่อนเป็น ผบก. ระดับนายพล · ม.๗๗(๖) ครองตำแหน่ง ≥ ๔ ปี)',
};

const GENERAL_MOTION_OPTIONS = [
  { value: '', label: 'เลือกประเภทการแต่งตั้ง / ประเด็นหลักระดับนายพล (หรือให้ระบบตรวจอัตโนมัติ)' },
  {
    value: 'promotion',
    label: 'เลื่อนตำแหน่งสูงขึ้นระดับ ผบก. ขึ้นไป (พ.ร.บ.ฯ ม.๗๗(๑)–(๖), ๗๘, ๘๒(๑)–(๒) · กฎ ก.ตร.ฯ ข้อ ๑๗(๑)–(๖), ๒๖, ๓๙, ๔๗(๑)–(๒))',
  },
  {
    value: 'rotation_same_unit',
    label: 'สับเปลี่ยนหมุนเวียนในระดับตำแหน่งเท่าเดิมระดับ ผบช. – ผบก. (พ.ร.บ.ฯ ม.๗๘ · กฎ ก.ตร.ฯ ข้อ ๒๑, ๓๙)',
  },
  {
    value: 'april_senior_advisor',
    label: 'วาระเดือนเมษายน: ที่ปรึกษาพิเศษ ตร. / ผู้ทรงคุณวุฒิพิเศษ ตร. / ผู้ทรงคุณวุฒิ ตร. (กฎ ก.ตร.ฯ ข้อ ๗(๒), ๑๘, ๔๗(๕))',
  },
];

const SUB_GENERAL_MOTION_OPTIONS = [
  { value: '', label: 'เลือกประเภทการแต่งตั้ง / ประเด็นหลักระดับ รอง ผบก. – สว. (หรือให้ระบบตรวจอัตโนมัติ)' },
  {
    value: 'promotion',
    label: 'เลื่อนตำแหน่งสูงขึ้นภายในหน่วย (ม.๗๗(๗)–(๑๐), ๘๐, ๘๒(๓)–(๔) · กฎ ก.ตร.ฯ ข้อ ๑๗(๗)–(๑๐), ๒๖, ๔๐, ๔๗(๓) อาวุโส ≥ ร้อยละ ๓๓ / ผนวก ก–ข, จ)',
  },
  {
    value: 'rotation_same_unit',
    label: 'สับเปลี่ยนหมุนเวียนภายในหน่วย ระดับตำแหน่งเท่าเดิม (กฎ ก.ตร.ฯ ข้อ ๒๑ ดำรงตำแหน่งเดิม ≥ ๒ ปี หรือเข้าข้อยกเว้น ๖ กรณี)',
  },
  {
    value: 'rotation_cross_unit',
    label: 'สับเปลี่ยนหมุนเวียนระหว่างหน่วย / ข้ามหน่วย (พ.ร.บ.ฯ ม.๘๐ · กฎ ก.ตร.ฯ ข้อ ๒๒, ๔๓ · ว ๒๔๕๖ ข้อ ๕ ผบช.ทำความตกลงกัน)',
  },
  {
    value: 'investigator_adjustable',
    label: 'สายงานสืบสวนสอบสวน ตำแหน่งควบปรับระดับเพิ่มลดได้ในตัวเอง (พ.ร.บ.ฯ ม.๖๒ วรรคสาม, ๘๔ วรรคสี่ · ว ๒๔๕๖ ข้อ ๔, ๗, ๑๐)',
  },
  {
    value: 'station_chief_transfer',
    label: 'ย้าย ผกก. หัวหน้าสถานีตำรวจ/หัวหน้างาน ไปตำแหน่งที่มิใช่หัวหน้าสถานี/หัวหน้างาน (กฎ ก.ตร.ฯ ข้อ ๒๑ วรรคสอง, ๒๓ · ว ๒๔๕๖ ข้อ ๑๑)',
  },
  {
    value: 'first_time_station_chief',
    label: 'แต่งตั้งดำรงตำแหน่งหัวหน้าสถานีตำรวจระดับ ผกก. เป็นครั้งแรกในสถานีตำรวจระดับกลาง (พ.ร.บ.ฯ ม.๘๕ · ว ๒๔๕๖ ข้อ ๑๒)',
  },
  {
    value: 'urgent_policy_defect',
    label: 'สับเปลี่ยนหมุนเวียนเนื่องจากบกพร่องตามนโยบายเร่งด่วนของรัฐบาลและ ตร. (ว ๒๔๕๖ ข้อ ๖)',
  },
];

const GENERAL_UNIT_TYPE_OPTIONS = [
  { value: 'tr_hq', label: 'ระดับ ตร. (คณะกรรมการพิจารณาการแต่งตั้งระดับ ตร. ตาม ม.๘๑(๑)(ก) เสนอ ก.ตร. และโปรดเกล้าฯ · ข้อ ๗(๑)(ก)–(ข))' },
];

const SUB_GENERAL_UNIT_TYPE_OPTIONS = [
  { value: '', label: 'เลือกกลุ่มสังกัดหน่วยงาน (ระดับ รอง ผบก. ลงมาถึง สว.)' },
  {
    value: 'non_opb_bch',
    label: 'บช. หรือเทียบเท่าที่มิได้สังกัด สง.ผบ.ตร. (ผบช. สั่งแต่งตั้งผ่านคณะกรรมการ ม.๘๑(๒) · ว ๒๔๕๖ ข้อ ๘ คำสั่ง ๓๐ พ.ย. ๖๙ / มีผล ๗ ธ.ค. ๖๙)',
  },
  {
    value: 'opb_unit',
    label: 'หน่วยงานในสังกัด สง.ผบ.ตร. (ผบ.ตร. สั่งแต่งตั้งผ่านคณะกรรมการ ม.๘๑(๑)(ข) · ว ๒๔๕๖ ข้อ ๙ ส่ง ผนวก ก–จ ผ่าน ทพ. ภายใน ๑๒ พ.ย. ๖๙)',
  },
  {
    value: 'direct_tr_unit',
    label: 'ข้าราชการตำรวจที่มิได้สังกัดหน่วยงานใดใน สง.ผบ.ตร. ที่ขึ้นตรงต่อ ผบ.ตร. (ว ๒๔๕๖ ข้อ ๙.๓ · สกพ. ประสานงาน)',
  },
];

const GENERAL_STATUS_OPTIONS = [
  { value: '', label: 'เลือกสถานะในบัญชีผู้เหมาะสม / การคัดเลือกระดับนายพล' },
  {
    value: 'suitable_annex_a_b',
    label: 'อยู่ในบัญชีผู้เหมาะสมเลื่อนตำแหน่งสูงขึ้นระดับนายพล (เรียงตามลำดับอาวุโส กฎ ก.ตร.ฯ ข้อ ๒๖, ๓๓)',
  },
  {
    value: 'unsuitable_annex_c_d',
    label: 'ถูกจัดอยู่ในบัญชีผู้ที่ยังไม่เหมาะสมเลื่อนตำแหน่งสูงขึ้น (กฎ ก.ตร.ฯ ข้อ ๓๔ วรรคหนึ่ง — คณะกรรมการระดับ ตร. พิจารณา)',
  },
  {
    value: 'nominated_annex_e',
    label: 'ได้รับการเสนอชื่อต่อคณะกรรมการกลั่นกรองระดับ ตร. / ก.ตร. (พ.ร.บ.ฯ ม.๘๑(๑)(ก) · กฎ ก.ตร.ฯ ข้อ ๓๙)',
  },
];

const SUB_GENERAL_ANNEX_OPTIONS = [
  { value: '', label: 'เลือกสถานะข้อมูลตามแบบฟอร์ม ว ๒๔๕๖ (ผนวก ก – ช)' },
  {
    value: 'suitable_annex_a_b',
    label: 'อยู่ในบัญชีผู้เหมาะสมเลื่อนตำแหน่งสูงขึ้นของหน่วย (ผนวก ก – ผนวก ข · เรียงตาม กฎ ก.ตร.ฯ ข้อ ๒๖(๑), ๓๓)',
  },
  {
    value: 'unsuitable_annex_c_d',
    label: 'ถูกจัดอยู่ในบัญชีผู้ที่ยังไม่เหมาะสมเลื่อนตำแหน่งสูงขึ้น (ผนวก ค – ผนวก ง · กฎ ก.ตร.ฯ ข้อ ๓๔ วรรคสอง ต้องมีหลักฐานเป็นรูปธรรม)',
  },
  {
    value: 'nominated_annex_e',
    label: 'ได้รับการเสนอชื่อแต่งตั้งในรูปคณะกรรมการพิจารณาการแต่งตั้ง (ผนวก จ · พ.ร.บ.ฯ ม.๘๑(๑)(ข)/(๒) · กฎ ก.ตร.ฯ ข้อ ๔๐)',
  },
  {
    value: 'missing_performance_annex_f_g',
    label: 'มีชื่อในบัญชีผู้ไม่ส่งผลการปฏิบัติงาน / บันทึกสรุปผลงาน (ผนวก ฉ – ผนวก ช · กฎ ก.ตร.ฯ ข้อ ๓๓)',
  },
];

const FALLBACK_TIER_INFO = {
  general: {
    title: 'ระดับที่ ๑: ระดับ ผบก. ขึ้นไป หรือระดับนายพล',
    appointing_authority:
      'ผบ.ตร. คัดเลือกรายชื่อผ่านคณะกรรมการระดับ ตร. (ม.๘๑(๑)(ก) มีผู้แทน ก.พ. ร่วม) เสนอ ก.ตร. ให้ความเห็นชอบ และนำความกราบบังคมทูลเพื่อทรงพระกรุณาโปรดเกล้าฯ แต่งตั้ง (ม.๗๘)',
    timeframe:
      'วาระประจำปี: ๑ ก.ค. – ๓๑ ส.ค. (ข้อ ๗(๑)(ข)) · ผบ.ตร. ภายใน ๓๑ ก.ค. (ข้อ ๗(๑)(ก)) · วาระเมษายน: ๑ ก.พ. – ๓๑ มี.ค. (ข้อ ๗(๒))',
    seniority_quota_rule:
      'รอง ผบ.ตร./ผู้ช่วย ผบ.ตร. พิจารณาเรียงตามลำดับอาวุโสร้อยละ ๑๐๐ (ม.๘๒(๑), ข้อ ๔๗(๑)) · ผบช./จตร. ลงมาถึง ผบก. คำนึงถึงอาวุโสไม่น้อยกว่าร้อยละ ๕๐ ของจำนวนตำแหน่งว่างในแต่ละระดับในภาพรวม ตร. (ม.๘๒(๒), ข้อ ๔๗(๒))',
    positions: [
      { position: 'ผบ.ตร.', target_rank: 'พล.ต.อ.', eligibility: 'รอง ผบ.ตร. หรือ จตช. (ม.๗๗(๑))', seniority_quota: 'ตาม ม.๗๘(๑)' },
      { position: 'รอง ผบ.ตร. / จตช.', target_rank: 'พล.ต.อ.', eligibility: 'ผู้ช่วย ผบ.ตร. หรือ รอง จตช. ≥ ๑ ปี (ม.๗๗(๒))', seniority_quota: 'อาวุโส ๑๐๐% (ม.๘๒(๑), ข้อ ๔๗(๑))' },
      { position: 'ผู้ช่วย ผบ.ตร. / รอง จตช.', target_rank: 'พล.ต.ท.', eligibility: 'ผบช. หรือ จตร. ≥ ๑ ปี (ม.๗๗(๓))', seniority_quota: 'อาวุโส ๑๐๐% (ม.๘๒(๑), ข้อ ๔๗(๑))' },
      { position: 'ผบช. / จตร.', target_rank: 'พล.ต.ท.', eligibility: 'รอง ผบช. หรือ รอง จตร. ≥ ๒ ปี (ม.๗๗(๔), ข้อ ๑๗)', seniority_quota: 'อาวุโส ≥ ๕๐% ของตำแหน่งว่าง ตร. (ม.๘๒(๒), ข้อ ๔๗(๒))' },
      { position: 'รอง ผบช. / รอง จตร.', target_rank: 'พล.ต.ต.', eligibility: 'ผบก. ≥ ๓ ปี (ม.๗๗(๕), ข้อ ๑๗)', seniority_quota: 'อาวุโส ≥ ๕๐% ของตำแหน่งว่าง ตร. (ม.๘๒(๒), ข้อ ๔๗(๒))' },
      { position: 'ผบก.', target_rank: 'พ.ต.อ.(พิเศษ) / พล.ต.ต.', eligibility: 'รอง ผบก. ≥ ๔ ปี (ม.๗๗(๖), ข้อ ๑๗)', seniority_quota: 'อาวุโส ≥ ๕๐% ของตำแหน่งว่าง ตร. (ม.๘๒(๒), ข้อ ๔๗(๒))' },
    ],
  },
  sub_general_to_inspector: {
    title: 'ระดับที่ ๒: ระดับ รอง ผบก. ลงมา หรือระดับรองผู้บังคับการ – สารวัตร',
    appointing_authority:
      'ผบ.ตร. (สำหรับสังกัด สง.ผบ.ตร. ผ่านคณะกรรมการ ม.๘๑(๑)(ข)) หรือ ผบช. (สำหรับ บช. ที่มิได้สังกัด สง.ผบ.ตร. ผ่านคณะกรรมการ ม.๘๑(๒)) โดยเลื่อนตำแหน่งสูงขึ้นเฉพาะภายในหน่วย (ม.๗๙, ๘๐)',
    timeframe:
      'วาระประจำปี: ๑ ต.ค. – ๓๐ พ.ย. (กฎ ก.ตร.ฯ ข้อ ๗(๑)(ค) · ว ๒๔๕๖ กำหนดออกคำสั่งพร้อมกัน ๓๐ พ.ย. ๒๕๖๙ และมีผลใช้บังคับพร้อมกัน ๗ ธ.ค. ๒๕๖๙)',
    seniority_quota_rule:
      'เลื่อนตำแหน่งสูงขึ้นคำนึงถึงอาวุโสไม่น้อยกว่าร้อยละ ๓๓ ของจำนวนตำแหน่งว่างในแต่ละระดับของหน่วยนั้น (ม.๘๒(๓), ข้อ ๔๗(๓)) ส่วนที่เหลือร้อยละ ๖๗ พิจารณาอาวุโสประกอบความรู้ความสามารถ (ม.๘๒(๔), ข้อ ๔๗(๔))',
    positions: [
      { position: 'รอง ผบก.', target_rank: 'พ.ต.อ.', eligibility: 'ผกก. ≥ ๔ ปี (ม.๗๗(๗), ข้อ ๑๗)', seniority_quota: 'อาวุโส ≥ ๓๓% ของตำแหน่งว่างในหน่วย (ม.๘๒(๓), ข้อ ๔๗(๓))' },
      { position: 'ผกก.', target_rank: 'พ.ต.ท. / พ.ต.อ.', eligibility: 'รอง ผกก. หรือ สวญ. ≥ ๔ ปี (ม.๗๗(๘), ข้อ ๑๗ · หน.สภ.ครั้งแรกต้องระดับกลาง ม.๘๕)', seniority_quota: 'อาวุโส ≥ ๓๓% ของตำแหน่งว่างในหน่วย (ม.๘๒(๓), ข้อ ๔๗(๓))' },
      { position: 'รอง ผกก. / สวญ.', target_rank: 'พ.ต.ท.', eligibility: 'สว. ≥ ๕ ปี (ม.๗๗(๙), ข้อ ๑๗)', seniority_quota: 'อาวุโส ≥ ๓๓% ของตำแหน่งว่างในหน่วย (ม.๘๒(๓), ข้อ ๔๗(๓))' },
      { position: 'สว.', target_rank: 'ร.ต.อ. – พ.ต.ท.', eligibility: 'รอง สว. ≥ ๗ ปี (ม.๗๗(๑๐), ข้อ ๑๗)', seniority_quota: 'อาวุโส ≥ ๓๓% ของตำแหน่งว่างในหน่วย (ม.๘๒(๓), ข้อ ๔๗(๓))' },
      { position: 'สับเปลี่ยนหมุนเวียน (รอง ผบก. – สว.)', target_rank: 'ระดับเท่าเดิม', eligibility: 'ดำรงตำแหน่งเดิม ≥ ๒ ปี (ข้อ ๒๑ วรรคหนึ่ง) · ห้ามย้าย ผกก. หน.สภ. ไปมิใช่ หน.สภ. เว้นสมัครใจ/เสียหายราชการ (ข้อ ๒๑ วรรคสอง)', seniority_quota: 'สับเปลี่ยนภายในหน่วย หรือข้ามหน่วยตามข้อตกลง ผบช. (ม.๘๐, ข้อ ๒๒)' },
    ],
  },
};

export default function InputForm({ input, setInput, knowledge, activeTier = 'general' }) {
  const isSubGenTier = activeTier === 'sub_general_to_inspector';
  const update = (k, v) => setInput({ ...input, [k]: v });
  const allAccounts = knowledge?.accounts || [];

  const generalLevels = [
    ...new Set(allAccounts.filter((a) => a.tier !== 'sub_general_to_inspector').map((a) => a.source_level)),
  ];
  const subGeneralPromotionLevels = [
    ...new Set(
      allAccounts
        .filter((a) => a.tier === 'sub_general_to_inspector' && a.motion === 'promotion')
        .map((a) => a.source_level),
    ),
  ];
  const subGeneralRotationLevels = [
    ...new Set(
      allAccounts
        .filter((a) => a.tier === 'sub_general_to_inspector' && a.motion === 'rotation')
        .map((a) => a.source_level),
    ),
  ];

  const accounts = [
    ...new Set(allAccounts.filter((a) => !input.level || a.source_level === input.level).map((a) => a.source_account)),
  ];
  const matchedAccount = allAccounts.find(
    (a) => a.source_level === input.level && a.source_account === input.account,
  );

  const tierInfo = knowledge?.tier_definitions?.[activeTier] || FALLBACK_TIER_INFO[activeTier] || FALLBACK_TIER_INFO.general;
  const motionOptions = isSubGenTier ? SUB_GENERAL_MOTION_OPTIONS : GENERAL_MOTION_OPTIONS;
  const unitTypeOptions = isSubGenTier ? SUB_GENERAL_UNIT_TYPE_OPTIONS : GENERAL_UNIT_TYPE_OPTIONS;
  const statusOptions = isSubGenTier ? SUB_GENERAL_ANNEX_OPTIONS : GENERAL_STATUS_OPTIONS;

  const checklist = [
    { key: 'title', label: 'ชื่อเรื่อง', done: Boolean(input.title?.trim()) },
    { key: 'subject_name', label: 'ชื่อบุคคลที่วิเคราะห์', done: Boolean(input.subject_name?.trim()) },
    { key: 'rank_position', label: 'ยศ / ตำแหน่ง', done: Boolean(input.rank_position?.trim()) },
    { key: 'account', label: 'ระดับ / ประเภทบัญชี', done: Boolean(input.level && input.account) },
    { key: 'claim', label: 'คำร้อง / ข้อกล่าวอ้าง', done: Boolean(input.claim?.trim()) },
    { key: 'response', label: 'คำชี้แจงคู่กรณี', done: Boolean(input.response?.trim()) },
    { key: 'issues', label: 'ประเด็นและคำขอ', done: Boolean(input.issues?.trim()) },
  ];
  const completedCount = checklist.filter((c) => c.done).length;

  return (
    <div>
      <details className="review-form statutory-tier-panel" open>
        <summary>
          หลักเกณฑ์กฎหมายประจำโหมด: {tierInfo.title} (พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ และ กฎ ก.ตร.ฯ พ.ศ. ๒๕๖๗)
        </summary>
        <div className="statutory-summary-grid">
          <div>
            <small>ผู้มีอำนาจสั่งแต่งตั้งและคณะกรรมการกลั่นกรอง</small>
            <p>{tierInfo.appointing_authority}</p>
          </div>
          <div>
            <small>ห้วงเวลาดำเนินการตามกฎ ก.ตร.ฯ ข้อ ๗</small>
            <p>{tierInfo.timeframe}</p>
          </div>
          <div>
            <small>สัดส่วนการแต่งตั้งตามอาวุโส (พ.ร.บ.ฯ ม.๘๒ / กฎ ก.ตร.ฯ ข้อ ๔๗)</small>
            <p>{tierInfo.seniority_quota_rule}</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ตำแหน่งที่แต่งตั้ง</th>
                <th>ยศตามเกณฑ์</th>
                <th>คุณสมบัติระยะเวลาดำรงตำแหน่งขั้นต่ำ (พ.ร.บ.ฯ ม.๗๗ / กฎ ก.ตร.ฯ ข้อ ๑๗)</th>
                <th>สัดส่วนอาวุโสและขอบเขตหน่วย</th>
              </tr>
            </thead>
            <tbody>
              {(tierInfo.positions || []).map((pos) => (
                <tr key={pos.position}>
                  <td>
                    <strong>{pos.position}</strong>
                  </td>
                  <td>{pos.target_rank}</td>
                  <td>{pos.eligibility}</td>
                  <td>{pos.seniority_quota}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <div className="intake-readiness" aria-label="ความครบถ้วนของข้อมูลเบื้องต้น">
        <div className="intake-readiness-head">
          <strong>ความพร้อมข้อมูลตั้งต้น ({completedCount}/{checklist.length} รายการ)</strong>
          {matchedAccount ? (
            matchedAccount.total_suitable_population ? (
              <span className="badge-pill verified-pill">
                บัญชีระดับนายพล (ม.๗๗(๑)–(๖)): ผู้เหมาะสมทั้งหมด {matchedAccount.total_suitable_population} ราย (หน้า PDF{' '}
                {matchedAccount.source_page_start}–{matchedAccount.source_page_end})
              </span>
            ) : (
              <span className="badge-pill verified-pill">
                เกณฑ์ระดับ รอง ผบก. ลงมาถึง สว. ({matchedAccount.statutory_ref || 'ม.๗๗(๗)–(๑๐), ข้อ ๑๗'}) · ครองตำแหน่งเดิมไม่น้อยกว่า{' '}
                {matchedAccount.min_years_in_level || 4} ปี · สัดส่วนอาวุโสภายในหน่วยไม่น้อยกว่าร้อยละ ๓๓
              </span>
            )
          ) : (
            <span className="muted">
              {isSubGenTier
                ? 'โหมดระดับ รอง ผบก. ลงมาถึง สว. · พิจารณาภายในหน่วย (ม.๘๐) · อาวุโส ≥ ร้อยละ ๓๓ (ม.๘๒(๓), ข้อ ๔๗(๓))'
                : 'โหมดระดับ ผบก. ขึ้นไป (นายพล) · พิจารณาระดับ ตร. เสนอ ก.ตร. และโปรดเกล้าฯ · อาวุโส ≥ ร้อยละ ๕๐ / ๑๐๐ (ม.๘๒(๑)–(๒))'}
            </span>
          )}
        </div>
        <div className="checklist-pills">
          {checklist.map((item) => (
            <span key={item.key} className={'check-pill' + (item.done ? ' done' : '')}>
              {item.done ? '✓ ' : '○ '}
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="form-grid">
        <Field label="ชื่อเรื่อง">
          <input
            value={input.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder={
              isSubGenTier
                ? 'เช่น ร้องทุกข์การแต่งตั้งข้าราชการตำรวจ ระดับ รอง ผบก. ลงมาถึง สว. วาระประจำปี 2569'
                : 'เช่น ร้องทุกข์การแต่งตั้งข้าราชการตำรวจ ระดับ ผบก. ขึ้นไป วาระประจำปี 2569'
            }
            required
          />
        </Field>
        <Field label="เลขอ้างอิงจากภายนอก">
          <input
            value={input.external_case_ref}
            onChange={(e) => update('external_case_ref', e.target.value)}
            placeholder="เช่น รท. 123/2569 (หากมี)"
          />
        </Field>
        <Field wide label="ชื่อบุคคลที่ใช้วิเคราะห์">
          <input
            value={input.subject_name}
            onChange={(e) => update('subject_name', e.target.value)}
            placeholder={
              isSubGenTier
                ? 'ระบุชื่อ-นามสกุล (เช่น พ.ต.อ. ..., พ.ต.ท. ..., ร.ต.อ. ...)'
                : 'ระบุชื่อ-นามสกุล (เช่น พล.ต.ท. ..., พล.ต.ต. ..., พ.ต.อ. ...)'
            }
          />
        </Field>
        <Field label="ยศ / ตำแหน่งปัจจุบัน">
          <input
            value={input.rank_position}
            onChange={(e) => update('rank_position', e.target.value)}
            placeholder={
              isSubGenTier
                ? 'เช่น พ.ต.อ. ผกก.สภ.เมือง... หรือ พ.ต.ท. รอง ผกก.(สอบสวน)...'
                : 'เช่น พล.ต.ต. ผบก.ภ.จว.... หรือ พ.ต.อ. รอง ผบก.ภ.จว....'
            }
          />
        </Field>
        <Field
          label={
            isSubGenTier
              ? 'ระดับ / ประเภทบัญชี (ระดับ รอง ผบก. ลงมาถึง สว. — ม.๗๗(๗)–(๑๐))'
              : 'ระดับ / ประเภทบัญชี (ระดับ ผบก. ขึ้นไป / นายพล — ม.๗๗(๑)–(๖))'
          }
        >
          <div className="paired">
            <select
              aria-label="ระดับบัญชี"
              value={input.level}
              onChange={(e) => setInput({ ...input, level: e.target.value, account: '' })}
            >
              <option value="">
                {isSubGenTier
                  ? 'เลือกระดับ (รอง ผบก. ลงมาถึง สว.)'
                  : 'เลือกระดับ (ผบช./จตร. ลงมาถึง ผบก.)'}
              </option>
              {!isSubGenTier && generalLevels.length > 0 ? (
                <optgroup label="ระดับ ผบก. ขึ้นไป (ระดับนายพล — พ.ร.บ.ฯ ม.๗๗(๔)–(๖), กฎ ก.ตร.ฯ ข้อ ๗(๑)(ข))">
                  {generalLevels.map((l) => (
                    <option key={l} value={l}>
                      {GENERAL_LEVEL_LABELS[l] || l}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {isSubGenTier && subGeneralPromotionLevels.length > 0 ? (
                <optgroup label="๑. เลื่อนตำแหน่งสูงขึ้นระดับ รอง ผบก. ลงมาถึง สว. (ม.๗๗(๗)–(๑๐), ข้อ ๑๗, ผนวก ก–จ)">
                  {subGeneralPromotionLevels.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {isSubGenTier && subGeneralRotationLevels.length > 0 ? (
                <optgroup label="๒. สับเปลี่ยนหมุนเวียนระดับเท่าเดิม รอง ผบก. – สว. (ข้อ ๒๑, ๒๓, ว ๒๔๕๖ ข้อ ๔–๖, ๑๑)">
                  {subGeneralRotationLevels.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
            <select
              aria-label="ประเภทบัญชี"
              value={input.account}
              onChange={(e) => update('account', e.target.value)}
            >
              <option value="">เลือกประเภทตำแหน่ง / สายงาน</option>
              {accounts.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </Field>

        <Field
          label={
            isSubGenTier
              ? 'กลุ่มสังกัดหน่วยที่มีอำนาจแต่งตั้ง (ม.๗๙, ๘๑ และ ว ๒๔๕๖ ข้อ ๘–๙)'
              : 'ขอบเขตคณะกรรมการกลั่นกรอง (ม.๗๘, ๘๑(๑)(ก))'
          }
        >
          <select
            aria-label="กลุ่มสังกัดหน่วย"
            value={input.unit_type || (isSubGenTier ? '' : 'tr_hq')}
            onChange={(e) => update('unit_type', e.target.value)}
          >
            {unitTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={
            isSubGenTier
              ? 'ชื่อหน่วย / สังกัดบัญชีอาวุโสภายในหน่วย (เช่น บช.น., ภ.1, สทส.)'
              : 'หน่วยปัจจุบัน / หน่วยที่เสนอแต่งตั้ง (เช่น ภ.1, บช.ก., สพฐ.ตร.)'
          }
        >
          <input
            value={input.unit_name || ''}
            onChange={(e) => update('unit_name', e.target.value)}
            placeholder={
              isSubGenTier
                ? 'ระบุชื่อ บช. / ภ. / หน่วยงานในสังกัด สง.ผบ.ตร. (การเลื่อนตำแหน่งทำเฉพาะภายในหน่วยตาม ม.๘๐)'
                : 'ระบุชื่อส่วนราชการ (การแต่งตั้งระดับ ผบก. ขึ้นไป พิจารณาในภาพรวมระดับ ตร.)'
            }
          />
        </Field>

        <Field label="ประเภทการแต่งตั้ง / ประเด็นหลัก">
          <select
            aria-label="ประเภทการแต่งตั้ง"
            value={input.appointment_motion || ''}
            onChange={(e) => update('appointment_motion', e.target.value)}
          >
            {motionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={
            isSubGenTier
              ? 'สถานะตามแบบฟอร์ม ผนวก ก – ช (ว ๒๔๕๖ / กฎ ก.ตร.ฯ ข้อ ๓๓–๓๔, ๔๐)'
              : 'สถานะในบัญชีผู้เหมาะสม / การคัดเลือกระดับนายพล (กฎ ก.ตร.ฯ ข้อ ๓๓–๓๔, ๓๙)'
          }
        >
          <select
            aria-label="สถานะตามแบบฟอร์ม ผนวก ก ถึง ช"
            value={input.annex_status || ''}
            onChange={(e) => update('annex_status', e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field wide label="คำร้องหรือข้อกล่าวอ้าง">
          <textarea
            rows="4"
            value={input.claim}
            onChange={(e) => update('claim', e.target.value)}
            placeholder="สรุปสาระสำคัญของคำร้องทุกข์หรือคำอุทธรณ์ (ระบบจะถือเป็นข้อกล่าวอ้างจนกว่าจะผูกหลักฐานที่ตรวจแล้ว)"
          />
        </Field>
        <Field wide label="คำชี้แจง">
          <textarea
            rows="4"
            value={input.response}
            onChange={(e) => update('response', e.target.value)}
            placeholder="สรุปคำชี้แจงของผู้บังคับบัญชาหรือคู่กรณีในสำนวน"
          />
        </Field>
        <Field wide label="ประเด็นและคำขอ">
          <textarea
            rows="4"
            value={input.issues}
            onChange={(e) => update('issues', e.target.value)}
            placeholder="ประเด็นที่ต้องการให้วิเคราะห์และคำขอท้ายคำร้องทุกข์/คำอุทธรณ์"
          />
        </Field>
      </div>
    </div>
  );
}
