import React from 'react';
import { Field } from './components';

export default function InputForm({ input, setInput, knowledge }) {
  const update = (k, v) => setInput({ ...input, [k]: v });
  const levels = [...new Set(knowledge?.accounts?.map((a) => a.source_level) || [])];
  const accounts = [
    ...new Set(
      (knowledge?.accounts || [])
        .filter((a) => !input.level || a.source_level === input.level)
        .map((a) => a.source_account),
    ),
  ];
  const matchedAccount = (knowledge?.accounts || []).find(
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
            <span className="badge-pill verified-pill">
              บัญชีที่เลือก: ผู้เหมาะสมทั้งหมด {matchedAccount.total_suitable_population} ราย (หน้า PDF{' '}
              {matchedAccount.source_page_start}–{matchedAccount.source_page_end})
            </span>
          ) : (
            <span className="muted">เลือกระดับและประเภทบัญชีเพื่อเทียบจำนวนผู้เหมาะสมในบัญชีครั้งที่ 4</span>
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
            placeholder="เช่น ร้องทุกข์การแต่งตั้งข้าราชการตำรวจ วาระประจำปี 2569"
            required
          />
        </Field>
        <Field label="เลขอ้างอิงจากภายนอก">
          <input
            value={input.external_case_ref}
            onChange={(e) => update('external_case_ref', e.target.value)}
            placeholder="เช่น รท. 123/2568 (หากมี)"
          />
        </Field>
        <Field wide label="ชื่อบุคคลที่ใช้วิเคราะห์">
          <input
            value={input.subject_name}
            onChange={(e) => update('subject_name', e.target.value)}
            placeholder="ระบุชื่อ-นามสกุล เพื่อค้นในฐานข้อมูลการแต่งตั้งและอาวุโสตรวจภาพ"
          />
        </Field>
        <Field label="ยศ / ตำแหน่ง">
          <input
            value={input.rank_position}
            onChange={(e) => update('rank_position', e.target.value)}
            placeholder="เช่น พ.ต.อ. ผกก.สภ.เมือง..."
          />
        </Field>
        <Field label="ระดับ / ประเภทบัญชี">
          <div className="paired">
            <select
              aria-label="ระดับบัญชี"
              value={input.level}
              onChange={(e) => setInput({ ...input, level: e.target.value, account: '' })}
            >
              <option value="">เลือกระดับ</option>
              {levels.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <select
              aria-label="ประเภทบัญชี"
              value={input.account}
              onChange={(e) => update('account', e.target.value)}
            >
              <option value="">เลือกประเภท</option>
              {accounts.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
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

