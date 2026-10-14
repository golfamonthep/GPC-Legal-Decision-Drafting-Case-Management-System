import Link from "next/link";
import type { DashboardSnapshot } from "../../lib/dashboard/types";
import { CompletionRing, RankedBars, YearOutcomeBars, type RegistryAccent } from "./BacklogCharts";
import { OfficerPerformance } from "./OfficerPerformance";
import { IconClockHour4 } from '@tabler/icons-react';

const number = new Intl.NumberFormat("th-TH");

export function RegistryOverview({ title, snapshot, canViewDetails, accent, yearMax, officerMax, responsibilityMax }: {
  title: string; snapshot: DashboardSnapshot; canViewDetails: boolean; accent: RegistryAccent;
  yearMax: number; officerMax: number; responsibilityMax: number;
}) {
  return <section id={accent === "teal" ? "registry-complaint" : "registry-appeal"} aria-label={title} className="min-w-0 scroll-mt-5 rounded-[1.75rem] border border-white/80 bg-[#f2f6fa] p-4 shadow-[0_12px_30px_-22px_rgba(15,42,70,0.45)] sm:p-5">
    <div className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
      <div><p className={`text-xs font-semibold ${accent === "teal" ? "text-cyan-800" : "text-blue-800"}`}>ทะเบียนคุม · {accent === "teal" ? "01" : "02"}</p><h2 className="mt-1 text-2xl font-bold text-[#102b46]">{title}</h2></div>
      <dl className="flex flex-wrap gap-6">
        <div><dt className="text-xs text-slate-600">คงเหลือที่ค้าง</dt><dd className={`mt-1 text-3xl font-bold tabular-nums ${accent === "teal" ? "text-cyan-800" : "text-blue-800"}`}>{number.format(snapshot.kpis.active)} <span className="text-sm">เรื่อง</span></dd></div>
        <div><dt className="text-xs text-slate-500">เสร็จสิ้น</dt><dd className="mt-2 text-xl font-semibold text-slate-700">{number.format(snapshot.totalCases - snapshot.kpis.active)}</dd></div>
        <div><dt className="text-xs text-slate-500">ทะเบียนทั้งหมด</dt><dd className="mt-2 text-xl font-semibold text-slate-700">{number.format(snapshot.totalCases)}</dd></div>
      </dl>
    </div>
    <div className="grid min-w-0 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.15fr)_minmax(0,1.05fr)]">
      <div className="min-w-0 rounded-[1.25rem] border border-white/10 bg-[#102b46] p-5 text-white shadow-[0_8px_20px_-10px_rgba(15,42,70,0.55)]"><CompletionRing total={snapshot.totalCases} pending={snapshot.kpis.active} accent={accent} tone="dark" /></div>
      <YearOutcomeBars data={snapshot.backlog.byYearCompletion} scaleMax={yearMax} type={accent === 'teal' ? 'ร้องทุกข์' : 'อุทธรณ์'} />
      <div className="min-w-0 md:col-span-2 xl:col-span-1">
      <RankedBars title="เรื่องค้างแยกตามนิติกร" note="หน่วย: ภาระรับผิดชอบ · เรื่องร่วมอาจนับให้หลายคน" data={snapshot.backlog.byOfficer} total={snapshot.kpis.active} scaleMax={officerMax} accent={accent} />
      </div>
    </div>
    <details className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white px-4 py-1 shadow-[0_4px_14px_-10px_rgba(15,42,70,0.3)]">
      <summary className="min-h-11 cursor-pointer rounded py-3 text-sm font-bold text-[#102b46] focus-visible:outline-2 focus-visible:outline-cyan-700">รายละเอียดเรื่องค้าง · {number.format(snapshot.kpis.active)} เรื่อง</summary>
      {!canViewDetails ? <p className="mt-4 text-sm text-slate-500">บัญชีนี้ไม่มีสิทธิ์ดูรายละเอียดเรื่อง</p>
        : snapshot.backlog.cases.length ? <div className="mt-4 space-y-3">{snapshot.backlog.cases.map(item => <article key={item.id} className="min-w-0 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/80">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="text-[11px] text-slate-600">{accent === 'teal' ? 'ผู้ร้องทุกข์' : 'ผู้อุทธรณ์'}</p><h3 className="mt-0.5 break-words text-base font-bold text-[#102b46]">{item.petitionerName || 'ยังไม่ระบุชื่อผู้ร้อง'}</h3></div><span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-950 ring-1 ring-inset ring-amber-600/35"><IconClockHour4 size={14} aria-hidden="true" />ยังไม่เสร็จสิ้น</span></div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600"><Link href={`/cases/${item.id}`} className="font-bold text-teal-800 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-teal-600">เรื่องดำ {item.blackNumber}</Link><span>{item.year}</span><span>นิติกร: {item.officer}</span></div>
          <p className="mt-2 break-words text-sm text-slate-700">{item.subject}</p><p className="mt-2 text-xs font-semibold text-slate-600">การดำเนินการล่าสุด</p><p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 [overflow-wrap:anywhere]">{item.proceeding}</p>
        </article>)}</div> : <p className="mt-4 rounded-xl bg-teal-50 p-5 text-sm font-medium text-teal-800">ไม่มีเรื่องค้างในทะเบียนนี้</p>}
    </details>
    <details data-testid={`officer-performance-${accent}`} className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white px-4 py-1 shadow-[0_4px_14px_-10px_rgba(15,42,70,0.3)]">
      <summary className="min-h-11 cursor-pointer rounded py-3 text-sm font-bold text-[#102b46] focus-visible:outline-2 focus-visible:outline-cyan-700">ความรับผิดชอบและความสำเร็จรายนิติกร · {title}</summary>
      <div className="mb-4 mt-4 space-y-3">
        <p className="text-xs leading-5 text-slate-600">% สำเร็จ = เสร็จแล้ว ÷ รับทั้งหมด × 100 · เรื่องร่วมคิดหนึ่งเรื่องต่อผู้รับผิดชอบแต่ละคน · ยศและชื่อสะกดใกล้เคียงถูกรวมเมื่อระบุตัวบุคคลได้ ไม่ใช่คะแนนความเร็ว</p>
        <OfficerPerformance title={title} snapshot={snapshot} accent={accent} scaleMax={responsibilityMax} />
        <p className="text-xs leading-5 text-slate-500">เสร็จสิ้นเมื่อมีข้อความในช่องเรื่องแดง · ช่องว่างคือยังไม่เสร็จสิ้น · ไม่จัดอันดับเรื่องที่ยังไม่ระบุนิติกร · กราฟสองทะเบียนใช้มาตราส่วนจำนวนเรื่องร่วมกัน</p>
      </div>
    </details>
    </div>
  </section>;
}
