import type { Case } from "../types";
import Link from "next/link";
import { IconEye, IconEdit, IconNotes } from "@tabler/icons-react";
import { getRegistryRedText, getRegistryCaseStatus } from "@/lib/caseStatus";
import { CaseCompletionBadge } from './CaseCompletionBadge';

export function CaseTable({ cases, caption, canEdit = false }: { cases: Case[]; caption?: string; canEdit?: boolean }) {
  return <div className="gpc-tabler case-table-region" role="region" aria-label={caption || "ตารางรายการคดี"}>
    <table className="table table-vcenter card-table case-table">
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead><tr>
        <th scope="col">เรื่องดำ / เรื่องแดง</th>
        <th scope="col">ผู้ร้องทุกข์ / ผู้อุทธรณ์</th>
        <th scope="col">การดำเนินการล่าสุด</th>
        <th scope="col">ผู้รับผิดชอบ / สถานะ</th>
        <th scope="col"><span className="sr-only">จัดการข้อมูล</span></th>
      </tr></thead>
      <tbody>{cases.map(c => {
        const red = getRegistryRedText(c);
        const note = c.proceedingNote?.trim() ? c.proceedingNote : undefined;
        return <tr key={c.id}>
          <td data-label="เรื่องดำ / เรื่องแดง" className="case-number">
            <Link href={`/cases/${c.id}`} className="case-number-link">{c.blackNumber}</Link>
            {red && <div className="case-red">เรื่องแดง: {red}</div>}
          </td>
          <td className="case-person">
            <span className="case-party-label">{c.type === "อุทธรณ์" ? "ผู้อุทธรณ์" : "ผู้ร้องทุกข์"}</span>
            <strong>{c.petitionerName}</strong>
            <div className="case-subject">{c.subject}</div>
            <details className="case-more"><summary>คู่กรณีและเรื่องทั้งหมด</summary>
              <p>{c.subject}</p><p>คู่กรณี: {c.respondentName || "ยังไม่ระบุ"}</p>
            </details>
          </td>
          <td data-label="การดำเนินการล่าสุด" className="case-proceeding">
            {note ? <>
              <div className="case-note-preview">{note.length > 160 ? `${note.slice(0, 160)}…` : note}</div>
              {note.length > 160 && <details className="case-more"><summary>อ่านการดำเนินการทั้งหมด</summary><p>{note}</p></details>}
            </> : <span className="case-missing">ยังไม่มีการบันทึกการดำเนินการ</span>}
          </td>
          <td data-label="ผู้รับผิดชอบ / สถานะ" className="case-responsibility">
            <div className="case-officer">{c.legalOfficer && !["-", "ไม่ระบุ"].includes(c.legalOfficer) ? c.legalOfficer : "ยังไม่มอบหมายนิติกร"}</div>
            <CaseCompletionBadge record={c} /><div className="mt-1 text-xs text-slate-600">{getRegistryCaseStatus(c)}</div>
          </td>
          <td className="case-actions">
            <div className="btn-list">
              {canEdit && <><Link href={`/cases/${c.id}/update`} className="btn btn-sm btn-primary" aria-label={`อัปเดตการดำเนินการ เรื่องดำ ${c.blackNumber}`}><IconNotes aria-hidden="true" className="icon" />อัปเดต</Link>
                <Link href={`/cases/${c.id}/edit`} className="btn btn-sm" aria-label={`แก้ไขข้อมูล เรื่องดำ ${c.blackNumber}`}><IconEdit aria-hidden="true" className="icon" />แก้ไข</Link></>}
              <Link href={`/cases/${c.id}`} className="btn btn-sm btn-ghost-secondary" aria-label={`รายละเอียด เรื่องดำ ${c.blackNumber}`}><IconEye aria-hidden="true" className="icon" />รายละเอียด</Link>
            </div>
          </td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}
