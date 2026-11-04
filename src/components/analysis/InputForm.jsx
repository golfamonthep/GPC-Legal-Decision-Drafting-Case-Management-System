import React from 'react';
import { Field } from './components';

const MOTION_OPTIONS = [
  { value: '', label: 'เลือกประเภทการแต่งตั้ง / ประเด็นหลัก (หรือให้ระบบตรวจอัตโนมัติ)' },
  { value: 'promotion', label: 'เลื่อนตำแหน่งสูงขึ้น (พิจารณาอาวุโสและความรู้ความสามารถ · กฎ ก.ตร.ฯ ข้อ ๒๖, ๔๐ / ผนวก ก-ข, จ)' },
  { value: 'rotation_same_unit', label: 'สับเปลี่ยนหมุนเวียนภายในหน่วย (ระดับตำแหน่งเท่าเดิม · กฎ ก.ตร.ฯ ข้อ ๒๐-๒๑)' },
  { value: 'rotation_cross_unit', label: 'สับเปลี่ยนหมุนเวียนระหว่างหน่วย / ข้ามหน่วย (พ.ร.บ.ฯ ม.๘๐ / กฎ ก.ตร.ฯ ข้อ ๒๒, ๔๓ / ว ๒๔๕๖ ข้อ ๕)' },
  { value: 'investigator_adjustable', label: 'สายงานสืบสวนสอบสวน ตำแหน่งควบปรับระดับเพิ่มลดได้ในตัวเอง (ว ๒๔๕๖ ข้อ ๔, ๗, ๑๐ / มติ ก.ตร. ๒/๒๕๖๙)' },
  { value: 'station_chief_transfer', label: 'ย้าย ผกก. หัวหน้าสถานีตำรวจ/หัวหน้างาน ไปตำแหน่งที่มิใช่หัวหน้าสถานี/หัวหน้างาน (ว ๒๔๕๖ ข้อ ๑๑ / กฎ ก.ตร.ฯ ข้อ ๒๐ วรรคสอง)' },
  { value: 'first_time_station_chief', label: 'เลื่อนดำรงตำแหน่งหัวหน้าสถานีตำรวจระดับ ผกก. เป็นครั้งแรกในสถานีตำรวจระดับกลาง (ว ๒๔๕๖ ข้อ ๑๒ / พ.ร.บ.ฯ ม.๘๕)' },
  { value: 'urgent_policy_defect', label: 'สับเปลี่ยนหมุนเวียนเนื่องจากบกพร่องตามนโยบายเร่งด่วนของรัฐบาลและ ตร. (ว ๒๔๕๖ ข้อ ๖)' },
];

const UNIT_TYPE_OPTIONS = [
  { value: '', label: 'เลือกกลุ่มสังกัดหน่วยงาน' },
  { value: 'non_opb_bch', label: 'บช. หรือเทียบเท่าที่มิได้สังกัด สง.ผบ.ตร. (ว ๒๔๕๖ ข้อ ๘ · คำสั่ง ๓๐ พ.ย. ๖๙ / มีผล ๗ ธ.ค. ๖๙)' },
  { value: 'opb_unit', label: 'หน่วยงานในสังกัด สง.ผบ.ตร. (ว ๒๔๕๖ ข้อ ๙ · ส่ง ผนวก ก-จ ผ่าน ทพ. ภายใน ๑๒ พ.ย. ๖๙ + QR Code)' },
  { value: 'direct_tr_unit', label: 'ข้าราชการตำรวจที่มิได้สังกัดหน่วยงานใดใน สง.ผบ.ตร. ที่ขึ้นตรงต่อ ผบ.ตร. (ว ๒๔๕๖ ข้อ ๙.๓ · สกพ. ประสานงาน)' },
  { value: 'tr_hq', label: 'ระดับ ตร. (การแต่งตั้งระดับนายพล ผบก. ขึ้นไป · กฎ ก.ตร.ฯ ข้อ ๗ (๑) (ข))' },
];

const ANNEX_STATUS_OPTIONS = [
  { value: '', label: 'เลือกสถานะข้อมูลตามแบบฟอร์ม ว ๒๔๕๖ (ผนวก ก – ช)' },
  { value: 'suitable_annex_a_b', label: 'อยู่ในบัญชีผู้เหมาะสมเลื่อนตำแหน่งสูงขึ้น (ผนวก ก – ผนวก ข · เรียงตาม กฎ ก.ตร.ฯ ข้อ ๒๖ (๑))' },
  { value: 'unsuitable_annex_c_d', label: 'ถูกจัดอยู่ในบัญชีผู้ที่ยังไม่เหมาะสมเลื่อนตำแหน่งสูงขึ้น (ผนวก ค – ผนวก ง · ต้องมีพยานหลักฐานเป็นรูปธรรม)' },
  { value: 'nominated_annex_e', label: 'ได้รับการเสนอชื่อแต่งตั้งในรูปคณะกรรมการ (ผนวก จ · กฎ ก.ตร.ฯ ข้อ ๔๐)' },
  { value: 'missing_performance_annex_f_g', label: 'มีชื่อในบัญชีผู้ไม่ส่งผลการปฏิบัติงาน / บันทึกสรุปผลงาน (ผนวก ฉ – ผนวก ช)' },
];

export default function InputForm({ input, setInput, knowledge }) {
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
          <strong>ความพร้อมข้อมูลตั้งต้น ({completedCount}/{checklist.length} รายการ)</strong>
          {matchedAccount ? (
            matchedAccount.total_suitable_population ? (
              <span className="badge-pill verified-pill">
                บัญชีระดับนายพล: ผู้เหมาะสมทั้งหมด {matchedAccount.total_suitable_population} ราย (หน้า PDF{' '}
                {matchedAccount.source_page_start}–{matchedAccount.source_page_end})
              </span>
            ) : (
              <span className="badge-pill verified-pill">
                เกณฑ์ระดับ รอง ผบก. ลงมาถึง สว. (ว ๒๔๕๖) · ระยะเวลาขั้นต่ำในระดับไม่น้อยกว่า{' '}
                {matchedAccount.min_years_in_level || 2} ปี (ระบุจำนวนผู้เหมาะสมของหน่วยได้ในแท็บผลวิเคราะห์)
              </span>
            )
          ) : (
            <span className="muted">
              รองรับทั้งระดับนายพลขึ้นไป (ผบช. – ผบก.) และระดับ รอง ผบก. ลงมาถึง สว. (ตาม ว ๒๔๕๖ ลง ๒๒ ต.ค. ๒๕๖๙)
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
            placeholder="เช่น ร้องทุกข์การแต่งตั้งข้าราชการตำรวจ ระดับ รอง ผบก. ลงมาถึง สว. วาระประจำปี 2569"
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
            placeholder="ระบุชื่อ-นามสกุล (รองรับยศ พล.ต.อ. ลงมาถึง ร.ต.ต. / ว่าที่ / หญิง)"
          />
        </Field>
        <Field label="ยศ / ตำแหน่ง">
          <input
            value={input.rank_position}
            onChange={(e) => update('rank_position', e.target.value)}
            placeholder="เช่น พ.ต.อ. ผกก.สภ.เมือง... หรือ พ.ต.ท. รอง ผกก.(สอบสวน)..."
          />
        </Field>
        <Field label="ระดับ / ประเภทบัญชี (นายพล ลงมาถึง สว.)">
          <div className="paired">
            <select
              aria-label="ระดับบัญชี"
              value={input.level}
              onChange={(e) => setInput({ ...input, level: e.target.value, account: '' })}
            >
              <option value="">เลือกระดับ (นายพล – สว.)</option>
              {generalLevels.length > 0 ? (
                <optgroup label="๑. ระดับนายพลขึ้นไป (ผบช./จตร. ลงมาถึง ผบก. — กฎ ก.ตร.ฯ ข้อ ๗ (๑) (ข))">
                  {generalLevels.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {subGeneralPromotionLevels.length > 0 ? (
                <optgroup label="๒. ระดับ รอง ผบก. ลงมาถึง สว. — เลื่อนตำแหน่งสูงขึ้น (ว ๒๔๕๖ ผนวก ก-จ)">
                  {subGeneralPromotionLevels.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {subGeneralRotationLevels.length > 0 ? (
                <optgroup label="๓. ระดับ รอง ผบก. ลงมาถึง สว. — สับเปลี่ยนหมุนเวียนระดับเท่าเดิม (ว ๒๔๕๖ ข้อ ๔-๖, ๑๑)">
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
              <option value="">เลือกประเภทตำแหน่ง</option>
              {accounts.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </Field>

        <Field label="กลุ่มสังกัดหน่วย (ตาม ว ๒๔๕๖ ข้อ ๘ – ๙)">
          <select
            aria-label="กลุ่มสังกัดหน่วย"
            value={input.unit_type || ''}
            onChange={(e) => update('unit_type', e.target.value)}
          >
            {UNIT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="ชื่อหน่วย / สังกัด (เช่น บช.น., ภ.1, สทส.)">
          <input
            value={input.unit_name || ''}
            onChange={(e) => update('unit_name', e.target.value)}
            placeholder="ระบุชื่อ บช. / ภ. / บก. / หน่วยงานในสังกัด สง.ผบ.ตร."
          />
        </Field>

        <Field label="ประเภทการแต่งตั้ง / ประเด็นหลัก">
          <select
            aria-label="ประเภทการแต่งตั้ง"
            value={input.appointment_motion || ''}
            onChange={(e) => update('appointment_motion', e.target.value)}
          >
            {MOTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="สถานะตามแบบฟอร์ม ผนวก ก – ช (ว ๒๔๕๖)">
          <select
            aria-label="สถานะตามแบบฟอร์ม ผนวก ก ถึง ช"
            value={input.annex_status || ''}
            onChange={(e) => update('annex_status', e.target.value)}
          >
            {ANNEX_STATUS_OPTIONS.map((opt) => (
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
