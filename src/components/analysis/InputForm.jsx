import React from 'react';
import { Field } from './components';

const GENERAL_LEVEL_LABELS = {
  'ผู้ช่วย ผบ.ตร. / รอง จตช. / เทียบเท่า': 'ผู้ช่วย ผบ.ตร. / รอง จตช. (เลื่อนเป็น รอง ผบ.ตร. / จตช.)',
  'ผบช. / จตร. / เทียบเท่า': 'ผบช. / จตร. (เลื่อนเป็น ผู้ช่วย ผบ.ตร. / รอง จตช.)',
  'รอง ผบช. / รอง จตร. / เทียบเท่า': 'รอง ผบช. / รอง จตร. (เลื่อนเป็น ผบช. / จตร.)',
  'รอง ผบช. / เทียบเท่า': 'รอง ผบช. / เทียบเท่า (เฉพาะทาง — เลื่อนเป็น ผบช. / เทียบเท่า)',
  'ผบก. / เทียบเท่า': 'ผบก. / เทียบเท่า (เลื่อนเป็น รอง ผบช. / รอง จตร.)',
  'รอง ผบก. / เทียบเท่า': 'รอง ผบก. / เทียบเท่า (เลื่อนเป็น ผบก.)',
};

const GENERAL_MOTION_OPTIONS = [
  { value: '', label: 'เลือกประเภทการแต่งตั้ง (หรือให้ระบบตรวจอัตโนมัติ)' },
  {
    value: 'promotion',
    label: 'เลื่อนตำแหน่งสูงขึ้น (ระดับ ผบก. ขึ้นไป)',
  },
  {
    value: 'rotation_same_unit',
    label: 'สับเปลี่ยนหมุนเวียนในระดับตำแหน่งเท่าเดิม (ระดับ ผบก. ขึ้นไป)',
  },
  {
    value: 'general_bch_nomination_diff',
    label: 'กรณีความเห็นแตกต่างจากข้อมูลเสนอแต่งตั้งของหัวหน้าส่วนราชการระดับ บช. (ม.๗๘(๔), กฎ ก.ตร.ฯ ข้อ ๔๐(๑))',
  },
  {
    value: 'april_senior_advisor',
    label: 'วาระเดือนเมษายน (ที่ปรึกษาพิเศษ ตร. / ผู้ทรงคุณวุฒิพิเศษ ตร. / ผู้ทรงคุณวุฒิ ตร.)',
  },
];

const SUB_GENERAL_MOTION_OPTIONS = [
  { value: '', label: 'เลือกประเภทการแต่งตั้ง (หรือให้ระบบตรวจอัตโนมัติ)' },
  {
    value: 'promotion',
    label: 'เลื่อนตำแหน่งสูงขึ้นภายในหน่วย (ระดับ รอง ผบก. ลงมาถึง สว.)',
  },
  {
    value: 'rotation_same_unit',
    label: 'สับเปลี่ยนหมุนเวียนภายในหน่วย (ระดับตำแหน่งเท่าเดิม)',
  },
  {
    value: 'rotation_cross_unit',
    label: 'สับเปลี่ยนหมุนเวียนระหว่างหน่วย / ข้ามหน่วย',
  },
  {
    value: 'investigator_adjustable',
    label: 'สายงานสืบสวนสอบสวน ตำแหน่งควบปรับระดับเพิ่มลดได้ในตัวเอง',
  },
  {
    value: 'station_chief_transfer',
    label: 'ย้าย ผกก. หัวหน้าสถานีตำรวจ/หัวหน้างาน ไปตำแหน่งที่มิใช่หัวหน้าสถานี/หัวหน้างาน',
  },
  {
    value: 'first_time_station_chief',
    label: 'เลื่อนดำรงตำแหน่งหัวหน้าสถานีตำรวจระดับ ผกก. เป็นครั้งแรก',
  },
  {
    value: 'urgent_policy_defect',
    label: 'สับเปลี่ยนหมุนเวียนเนื่องจากบกพร่องตามนโยบายเร่งด่วนของรัฐบาลและ ตร.',
  },
];

const GENERAL_UNIT_TYPE_OPTIONS = [
  { value: 'tr_hq', label: 'ระดับ ตร. (คณะกรรมการพิจารณาการแต่งตั้งระดับ ตร. เสนอ ก.ตร.)' },
];

const SUB_GENERAL_UNIT_TYPE_OPTIONS = [
  { value: '', label: 'เลือกกลุ่มสังกัดหน่วยงาน' },
  {
    value: 'non_opb_bch',
    label: 'บช. หรือเทียบเท่าที่มิได้สังกัด สง.ผบ.ตร. (ผบช. เป็นผู้สั่งแต่งตั้ง)',
  },
  {
    value: 'opb_unit',
    label: 'หน่วยงานในสังกัด สง.ผบ.ตร. (ผบ.ตร. เป็นผู้สั่งแต่งตั้ง)',
  },
  {
    value: 'direct_tr_unit',
    label: 'ข้าราชการตำรวจที่มิได้สังกัดหน่วยงานใดใน สง.ผบ.ตร. ที่ขึ้นตรงต่อ ผบ.ตร.',
  },
];

const GENERAL_STATUS_OPTIONS = [
  { value: '', label: 'เลือกสถานะในบัญชีผู้เหมาะสม / การคัดเลือก' },
  {
    value: 'suitable_annex_a_b',
    label: 'อยู่ในบัญชีผู้เหมาะสมเลื่อนตำแหน่งสูงขึ้น',
  },
  {
    value: 'unsuitable_annex_c_d',
    label: 'ถูกจัดอยู่ในบัญชีผู้ที่ยังไม่เหมาะสมเลื่อนตำแหน่งสูงขึ้น (ข้อ ๓๔ วรรคหนึ่ง)',
  },
  {
    value: 'nominated_annex_e',
    label: 'ได้รับการเสนอชื่อในบัญชีคัดเลือกหรือแต่งตั้ง (ข้อ ๓๙, ๔๐(๑))',
  },
];

const SUB_GENERAL_ANNEX_OPTIONS = [
  { value: '', label: 'เลือกสถานะตามแบบฟอร์ม ว ๒๔๕๖ (ผนวก ก – ช)' },
  {
    value: 'suitable_annex_a_b',
    label: 'อยู่ในบัญชีผู้เหมาะสมเลื่อนตำแหน่งสูงขึ้น (ผนวก ก – ข)',
  },
  {
    value: 'unsuitable_annex_c_d',
    label: 'ถูกจัดอยู่ในบัญชีผู้ที่ยังไม่เหมาะสมเลื่อนตำแหน่งสูงขึ้น (ผนวก ค – ง)',
  },
  {
    value: 'nominated_annex_e',
    label: 'ได้รับการเสนอชื่อแต่งตั้งในรูปคณะกรรมการ (ผนวก จ)',
  },
  {
    value: 'missing_performance_annex_f_g',
    label: 'มีชื่อในบัญชีผู้ไม่ส่งผลการปฏิบัติงาน / บันทึกสรุปผลงาน (ผนวก ฉ – ช)',
  },
];

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
      <div className="intake-readiness" aria-label="ความครบถ้วนของข้อมูลเบื้องต้น">
        <div className="intake-readiness-head">
          <strong>
            ความพร้อมข้อมูลตั้งต้น ({completedCount}/{checklist.length} รายการ) · กรอกเท่าที่มีข้อมูลได้ทันที ระบบช่วยจับคู่ทะเบียนและข้อกฎหมายให้อัตโนมัติ
          </strong>
          {matchedAccount && matchedAccount.total_suitable_population ? (
            <span className="badge-pill verified-pill">
              ผู้เหมาะสมในบัญชีนี้ {matchedAccount.total_suitable_population} ราย (หน้า PDF{' '}
              {matchedAccount.source_page_start}–{matchedAccount.source_page_end})
            </span>
          ) : null}
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
        <Field label="ชื่อเรื่อง (เว้นว่างให้ระบบตั้งชื่ออัตโนมัติได้)">
          <input
            value={input.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder={
              isSubGenTier
                ? 'เช่น ร้องทุกข์การแต่งตั้งข้าราชการตำรวจ ระดับ รอง ผบก. ลงมาถึง สว. วาระประจำปี 2569'
                : 'เช่น ร้องทุกข์การแต่งตั้งข้าราชการตำรวจ ระดับ ผบก. ขึ้นไป วาระประจำปี 2569'
            }
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
        <Field label="ระดับ / ประเภทบัญชี">
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
                <optgroup label="ระดับ ผบก. ขึ้นไป (ระดับนายพล)">
                  {generalLevels.map((l) => (
                    <option key={l} value={l}>
                      {GENERAL_LEVEL_LABELS[l] || l}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {isSubGenTier && subGeneralPromotionLevels.length > 0 ? (
                <optgroup label="๑. เลื่อนตำแหน่งสูงขึ้น (รอง ผบก. ลงมาถึง สว.)">
                  {subGeneralPromotionLevels.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {isSubGenTier && subGeneralRotationLevels.length > 0 ? (
                <optgroup label="๒. สับเปลี่ยนหมุนเวียนระดับเท่าเดิม (รอง ผบก. – สว.)">
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

        <Field label={isSubGenTier ? 'กลุ่มสังกัดหน่วยที่มีอำนาจแต่งตั้ง' : 'ขอบเขตการพิจารณา'}>
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
        <Field label="หน่วย / สังกัด">
          <input
            value={input.unit_name || ''}
            onChange={(e) => update('unit_name', e.target.value)}
            placeholder="เช่น บช.น., ภ.1, บช.ก., สพฐ.ตร., สทส."
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
        <Field label={isSubGenTier ? 'สถานะในบัญชี (ผนวก ก – ช)' : 'สถานะในบัญชีผู้เหมาะสม / การคัดเลือก'}>
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
