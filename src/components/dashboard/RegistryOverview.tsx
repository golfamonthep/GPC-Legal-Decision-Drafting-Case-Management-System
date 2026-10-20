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
  return <section id={accent === "teal" ? "registry-complaint" : "registry-appeal"} aria-label={title} className="min-w-0 scroll-mt-5 rounded-[1.75rem] border border-white/[0.06] bg-[#0e0e11] p-4 sm:p-5">
    <div className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
      <div><p className="text-xs font-semibold text-zinc-400">ทะเบียนคุม · {accent === "teal" ? "01" : "02"}</p><h2 className="mt-1 text-2xl font-bold text-white">{title}</h2></div>
      <dl className="flex flex-wrap gap-6">
        <div><dt className="text-xs text-zinc-400">คงเหลือที่ค้าง</dt><dd className="mt-1 text-3xl font-bold tabular-nums text-white">{number.format(snapshot.kpis.active)} <span className="text-sm font-normal text-zinc-400">เรื่อง</span></dd></div>
        <div><dt className="text-xs text-zinc-400">เสร็จสิ้น</dt><dd className="mt-2 text-xl font-semibold text-white">{number.format(snapshot.totalCases - snapshot.kpis.active)}</dd></div>
        <div><dt className="text-xs text-zinc-400">ทะเบียนทั้งหมด</dt><dd className="mt-2 text-xl font-semibold text-white">{number.format(snapshot.totalCases)}</dd></div>
      </dl>
    </div>
    <div className="grid min-w-0 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.15fr)_minmax(0,1.05fr)]">
      <div className="min-w-0 rounded-[1.25rem] border border-white/[0.08] bg-[#131317] p-5 text-white shadow-[0_12px_28px_-14px_rgba(0,0,0,0.75)]"><CompletionRing total={snapshot.totalCases} pending={snapshot.kpis.active} accent={accent} tone="dark" /></div>
      <YearOutcomeBars data={snapshot.backlog.byYearCompletion} scaleMax={yearMax} type={accent === 'teal' ? 'ร้องทุกข์' : 'อุทธรณ์'} />
      <div className="min-w-0 md:col-span-2 xl:col-span-1">
      <RankedBars title="เรื่องค้างแยกตามนิติกร" note="หน่วย: ภาระรับผิดชอบ · เรื่องร่วมอาจนับให้หลายคน" data={snapshot.backlog.byOfficer} total={snapshot.kpis.active} scaleMax={officerMax} accent={accent} />
      </div>
    </div>
    <details className="group min-w-0 rounded-2xl border border-white/[0.08] bg-[#131317] px-4 py-1">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between rounded py-3 text-sm font-bold text-white transition hover:text-[#d62839] focus-visible:outline-2 focus-visible:outline-[#c81e2b]"><span>รายละเอียดเรื่องค้าง · {number.format(snapshot.kpis.active)} เรื่อง</span><span className="text-xs text-zinc-400 transition-transform duration-200 group-open:rotate-180">▼</span></summary>
      {!canViewDetails ? <p className="mt-4 text-sm text-zinc-400">บัญชีนี้ไม่มีสิทธิ์ดูรายละเอียดเรื่อง</p>
        : snapshot.backlog.cases.length ? <div className="mt-4 space-y-3">{snapshot.backlog.cases.map(item => <article key={item.id} className="min-w-0 rounded-xl border border-white/[0.06] bg-[#17171c] p-4">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="text-[11px] text-zinc-400">{accent === 'teal' ? 'ผู้ร้องทุกข์' : 'ผู้อุทธรณ์'}</p><h3 className="mt-0.5 break-words text-base font-bold text-white">{item.petitionerName || 'ยังไม่ระบุชื่อผู้ร้อง'}</h3></div><span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-zinc-300"><IconClockHour4 size={14} aria-hidden="true" />ยังไม่เสร็จสิ้น</span></div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400"><Link href={`/cases/${item.id}`} className="font-bold text-white underline-offset-2 hover:underline">เรื่องดำ {item.blackNumber}</Link><span>{item.year}</span><span>นิติกร: {item.officer}</span></div>
          <p className="mt-2 break-words text-sm text-zinc-300">{item.subject}</p><p className="mt-2 text-xs font-semibold text-zinc-400">การดำเนินการล่าสุด</p><p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300 [overflow-wrap:anywhere]">{item.proceeding}</p>
        </article>)}</div> : <p className="mt-4 rounded-xl bg-[#17171c] p-5 text-sm font-medium text-zinc-400">ไม่มีเรื่องค้างในทะเบียนนี้</p>}
    </details>
    <details data-testid={`officer-performance-${accent}`} className="group min-w-0 rounded-2xl border border-white/[0.08] bg-[#131317] px-4 py-1">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between rounded py-3 text-sm font-bold text-white transition hover:text-[#d62839] focus-visible:outline-2 focus-visible:outline-[#c81e2b]"><span>ความรับผิดชอบและความสำเร็จรายนิติกร · {title}</span><span className="text-xs text-zinc-400 transition-transform duration-200 group-open:rotate-180">▼</span></summary>
      <div className="mb-4 mt-4 space-y-3">
        <p className="text-xs leading-5 text-zinc-400">% สำเร็จ = เสร็จแล้ว ÷ รับทั้งหมด × 100 · เรื่องร่วมคิดหนึ่งเรื่องต่อผู้รับผิดชอบแต่ละคน · ยศและชื่อสะกดใกล้เคียงถูกรวมเมื่อระบุตัวบุคคลได้ ไม่ใช่คะแนนความเร็ว</p>
        <OfficerPerformance title={title} snapshot={snapshot} accent={accent} scaleMax={responsibilityMax} />
        <p className="text-xs leading-5 text-zinc-500">เสร็จสิ้นเมื่อมีข้อความในช่องเรื่องแดง · ช่องว่างคือยังไม่เสร็จสิ้น · ไม่จัดอันดับเรื่องที่ยังไม่ระบุนิติกร · กราฟสองทะเบียนใช้มาตราส่วนจำนวนเรื่องร่วมกัน</p>
      </div>
    </details>
    </div>
  </section>;
}
