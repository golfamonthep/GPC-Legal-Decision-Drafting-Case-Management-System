import { CaseTable } from "./CaseTable";
import { groupCasesByRegistry } from "@/lib/caseList";
import type { Case } from "@/types";
import Link from 'next/link';

const number = new Intl.NumberFormat("th-TH");

export function CaseRegistryBlocks({ cases, canEdit = false, canCreate = false }: { cases: Case[]; canEdit?: boolean; canCreate?: boolean }) {
  const groups = groupCasesByRegistry(cases);
  const blocks = [
    { id: "complaint-cases", title: "ร้องทุกข์", items: groups.complaint, tone: "border-teal-200 bg-teal-50 text-teal-950" },
    { id: "appeal-cases", title: "อุทธรณ์", items: groups.appeal, tone: "border-blue-200 bg-blue-50 text-blue-950" },
    ...(groups.unknown.length ? [{ id: "unknown-cases", title: "ยังไม่ระบุประเภท", items: groups.unknown, tone: "border-slate-200 bg-slate-50 text-slate-900" }] : []),
  ];
  return <div className="gpc-tabler case-registry-stack">
    <nav aria-label="ข้ามไปทะเบียนคดี" className="case-registry-links">
      {blocks.map(block => <a key={block.id} href={`#${block.id}`}>
        <span className="text-sm font-bold">{block.title}</span>
        <span className="text-sm tabular-nums">{number.format(block.items.length)} เรื่อง <span aria-hidden="true">↓</span></span>
      </a>)}
    </nav>
    <p className="text-xs text-slate-500">จำนวนเรื่องตามตัวกรองที่เลือก · แยกรายการตามประเภททะเบียน</p>
    {blocks.map(block => <section key={block.id} id={block.id} aria-labelledby={`${block.id}-heading`} className={`card min-w-0 scroll-mt-4 overflow-hidden ${block.title === 'อุทธรณ์' ? 'case-registry-appeal' : ''}`}>
      <header className="card-header case-registry-header">
        <h2 id={`${block.id}-heading`} className="text-lg font-bold">เรื่อง{block.title}</h2>
        <div className="btn-list"><span className="text-secondary text-sm">{number.format(block.items.length)} เรื่อง</span>
          {canCreate && block.title !== 'ยังไม่ระบุประเภท' && <Link href={`/cases/new?type=${encodeURIComponent(block.title)}`} className="btn btn-sm">เพิ่มเรื่อง{block.title}</Link>}
        </div>
      </header>
      {block.items.length ? <CaseTable cases={block.items} caption={`รายการคดี${block.title}`} canEdit={canEdit} />
        : <p className="px-5 py-8 text-center text-sm text-slate-500">ไม่พบเรื่อง{block.title}ตามตัวกรองที่เลือก</p>}
    </section>)}
  </div>;
}
