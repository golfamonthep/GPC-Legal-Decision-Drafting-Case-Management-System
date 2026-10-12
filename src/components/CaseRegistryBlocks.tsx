import { CaseTable } from "./CaseTable";
import { groupCasesByRegistry } from "@/lib/caseList";
import type { Case } from "@/types";

const number = new Intl.NumberFormat("th-TH");

export function CaseRegistryBlocks({ cases }: { cases: Case[] }) {
  const groups = groupCasesByRegistry(cases);
  const blocks = [
    { id: "complaint-cases", title: "ร้องทุกข์", items: groups.complaint, tone: "border-teal-200 bg-teal-50 text-teal-950" },
    { id: "appeal-cases", title: "อุทธรณ์", items: groups.appeal, tone: "border-blue-200 bg-blue-50 text-blue-950" },
    ...(groups.unknown.length ? [{ id: "unknown-cases", title: "ยังไม่ระบุประเภท", items: groups.unknown, tone: "border-slate-200 bg-slate-50 text-slate-900" }] : []),
  ];
  return <div className="min-w-0 space-y-5">
    <nav aria-label="ข้ามไปทะเบียนคดี" className="grid min-w-0 gap-3 sm:grid-cols-2">
      {blocks.map(block => <a key={block.id} href={`#${block.id}`} className={`flex min-w-0 items-center justify-between gap-3 rounded-xl border px-4 py-3 focus-visible:outline-2 focus-visible:outline-slate-700 ${block.tone}`}>
        <span className="text-sm font-bold">{block.title}</span>
        <span className="text-sm tabular-nums">{number.format(block.items.length)} เรื่อง <span aria-hidden="true">↓</span></span>
      </a>)}
    </nav>
    <p className="text-xs text-slate-500">จำนวนเรื่องตามตัวกรองที่เลือก · แยกรายการตามประเภททะเบียน</p>
    {blocks.map(block => <section key={block.id} id={block.id} aria-labelledby={`${block.id}-heading`} className="min-w-0 scroll-mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-4 sm:px-5 ${block.tone}`}>
        <h2 id={`${block.id}-heading`} className="text-lg font-bold">เรื่อง{block.title}</h2>
        <span className="rounded-full border border-current/15 bg-white/70 px-3 py-1 text-sm font-semibold tabular-nums">{number.format(block.items.length)} เรื่อง</span>
      </header>
      {block.items.length ? <CaseTable cases={block.items} caption={`รายการคดี${block.title}`} />
        : <p className="px-5 py-8 text-center text-sm text-slate-500">ไม่พบเรื่อง{block.title}ตามตัวกรองที่เลือก</p>}
    </section>)}
  </div>;
}
