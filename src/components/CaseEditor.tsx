'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { notifyCaseChanged } from './CaseDataRefresh';

export type CaseEditorValues = {
  type: string; blackNumber: string; registryRedText: string; petitionerName: string; respondentName: string;
  subject: string; legalCategory: string; legalOfficerName: string; currentStatus: string; proceedingNote: string; decisionResult: string;
};
const empty: CaseEditorValues = { type: 'ร้องทุกข์', blackNumber: '', registryRedText: '', petitionerName: '', respondentName: '', subject: '', legalCategory: '', legalOfficerName: '', currentStatus: 'รับเรื่อง', proceedingNote: '', decisionResult: '' };
export function CaseEditor({ initial, id, expectedUpdatedAt, onSaved }: { initial?: Partial<CaseEditorValues>; id?: string; expectedUpdatedAt?: string; onSaved?: () => void }) {
  const values = { ...empty, ...initial };
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    setSaving(true); setError('');
    try {
      const response = await fetch(id ? `/api/cases/${id}` : '/api/cases', { method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, ...(id ? { expectedUpdatedAt } : {}) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'ไม่สามารถบันทึกข้อมูลได้');
      notifyCaseChanged();
      if (onSaved) onSaved();
      else router.push(`/cases/${result.case.id}`);
      router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'ไม่สามารถบันทึกข้อมูลได้'); }
    finally { setSaving(false); }
  }
  return <div className="gpc-tabler">
    <form onSubmit={submit} className="card" aria-label={id ? 'แก้ไขข้อมูลคดี' : 'เพิ่มเรื่องใหม่'} aria-busy={saving}>
      <div className="card-body">
        <p className="text-secondary mb-4">ช่องที่มี * จำเป็นต้องกรอก · การบันทึกจะเก็บประวัติผู้แก้ไขไว้ในระบบ</p>
        <fieldset disabled={saving} className="case-editor-grid">
          <div><label className="form-label" htmlFor="editor-type">ประเภททะเบียน *</label><select id="editor-type" name="type" className="form-select" defaultValue={values.type}><option>ร้องทุกข์</option><option>อุทธรณ์</option></select></div>
          <div><label className="form-label" htmlFor="editor-black">เรื่องดำ *</label><input id="editor-black" name="blackNumber" className="form-control" defaultValue={values.blackNumber} required maxLength={100} placeholder="เช่น 123/69" /></div>
          <div className="case-editor-wide"><label className="form-label" htmlFor="editor-person">ชื่อผู้ร้องทุกข์ / ผู้อุทธรณ์ *</label><input id="editor-person" name="petitionerName" className="form-control" defaultValue={values.petitionerName} required maxLength={500} /></div>
          <div className="case-editor-wide"><label className="form-label" htmlFor="editor-subject">เรื่อง *</label><textarea id="editor-subject" name="subject" className="form-control" rows={2} defaultValue={values.subject} required maxLength={2000} /></div>
          <div className="case-editor-wide"><label className="form-label" htmlFor="editor-respondent">คู่กรณี</label><input id="editor-respondent" name="respondentName" className="form-control" defaultValue={values.respondentName} maxLength={500} /></div>
          <div><label className="form-label" htmlFor="editor-red">เรื่องแดง (เลขหรือข้อความ)</label><input id="editor-red" name="registryRedText" className="form-control" defaultValue={values.registryRedText} maxLength={500} aria-describedby="editor-red-hint" placeholder="เช่น 45/69 หรือ แดงแล้ว" /><p className="form-hint" id="editor-red-hint">มีข้อความ = เสร็จสิ้น · เว้นว่าง = ยังดำเนินการ</p></div>
          <div><label className="form-label" htmlFor="editor-status">สถานะการดำเนินการ</label><input id="editor-status" name="currentStatus" className="form-control" defaultValue={values.currentStatus} list="editor-statuses" maxLength={500} /><datalist id="editor-statuses">{['รับเรื่อง','ตรวจสอบคำร้อง','รอคำชี้แจง','แสวงหาข้อเท็จจริง','รอตรวจร่าง','รอเข้าประชุม','มีมติแล้ว','แจ้งผลแล้ว'].map(status => <option key={status} value={status} />)}</datalist></div>
          <div className="case-editor-wide"><label className="form-label" htmlFor="editor-note">การดำเนินการล่าสุด</label><textarea id="editor-note" name="proceedingNote" className="form-control" rows={5} defaultValue={values.proceedingNote} maxLength={10000} placeholder="บันทึกผลล่าสุด งานที่รอ และขั้นตอนถัดไป" /></div>
          <div><label className="form-label" htmlFor="editor-officer">นิติกรในทะเบียน</label><input id="editor-officer" name="legalOfficerName" className="form-control" defaultValue={values.legalOfficerName} maxLength={500} /></div>
          <div><label className="form-label" htmlFor="editor-category">หมวดหมู่กฎหมาย</label><input id="editor-category" name="legalCategory" className="form-control" defaultValue={values.legalCategory} maxLength={500} /></div>
          <div className="case-editor-wide"><label className="form-label" htmlFor="editor-result">ผลคำวินิจฉัย</label><textarea id="editor-result" name="decisionResult" className="form-control" rows={2} defaultValue={values.decisionResult} maxLength={2000} /></div>
        </fieldset>
        {error && <div className="alert alert-danger mt-4" role="alert">{error} {id && <button type="button" className="btn btn-sm" onClick={() => window.location.reload()}>เปิดข้อมูลล่าสุด</button>}</div>}
      </div>
      <div className="card-footer btn-list">
        <button type="submit" className="btn btn-primary" disabled={saving}><IconDeviceFloppy className="icon" aria-hidden="true" />{saving ? 'กำลังบันทึก…' : id ? 'บันทึกการแก้ไข' : 'เพิ่มเรื่อง'}</button>
        <Link href={id ? `/cases/${id}` : '/cases'} className="btn">ยกเลิก</Link>
      </div>
    </form>
  </div>;
}
