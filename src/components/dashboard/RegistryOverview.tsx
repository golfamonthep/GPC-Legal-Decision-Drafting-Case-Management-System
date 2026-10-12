import Link from "next/link";
import type { DashboardSnapshot } from "../../lib/dashboard/types";
import { CompletionRing, RankedBars, YearColumns, type RegistryAccent } from "./BacklogCharts";
import { OfficerPerformance } from "./OfficerPerformance";

const number = new Intl.NumberFormat("th-TH");

export function RegistryOverview({ title, snapshot, canViewDetails, accent, yearMax, officerMax, proceedingMax, responsibilityMax }: {
  title: string; snapshot: DashboardSnapshot; canViewDetails: boolean; accent: RegistryAccent;
  yearMax: number; officerMax: number; proceedingMax: number; responsibilityMax: number;
}) {
  return <section aria-label={title} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
    <div className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold text-teal-700">ทะเบียนคุม</p><h2 className="mt-1 text-2xl font-bold text-slate-950">{title}</h2></div>
      <dl className="flex flex-wrap gap-6">
        <div><dt className="text-xs text-slate-600">คงเหลือที่ค้าง</dt><dd className="mt-1 text-4xl font-bold tabular-nums text-teal-800">{number.format(snapshot.kpis.active)} <span className="text-sm">เรื่อง</span></dd></div>
        <div><dt className="text-xs text-slate-500">เสร็จสิ้น</dt><dd className="mt-2 text-xl font-semibold text-slate-700">{number.format(snapshot.totalCases - snapshot.kpis.active)}</dd></div>
        <div><dt className="text-xs text-slate-500">ทะเบียนทั้งหมด</dt><dd className="mt-2 text-xl font-semibold text-slate-700">{number.format(snapshot.totalCases)}</dd></div>
      </dl>
    </div>
    <div className="grid min-w-0 items-start gap-4 lg:grid-cols-2">
      <div className="min-w-0 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><CompletionRing total={snapshot.totalCases} pending={snapshot.kpis.active} accent={accent} /></div>
        <YearColumns data={snapshot.backlog.byYear} scaleMax={yearMax} accent={accent} />
      </div>
      <RankedBars title="เรื่องค้างแยกตามนิติกร" note="หน่วย: เรื่อง · ผู้รับผิดชอบที่บันทึกปัจจุบัน · เฉพาะเรื่องค้าง" data={snapshot.backlog.byOfficer} total={snapshot.kpis.active} scaleMax={officerMax} accent={accent} />
    </div>
    <RankedBars title="การดำเนินการของเรื่องค้าง" note='ข้อความเต็มจากคอลัมน์ “การดำเนินการ” · ไม่คาดเดาหรือจัดเป็นลำดับขั้นตอน' data={snapshot.backlog.byProceeding} total={snapshot.kpis.active} scaleMax={proceedingMax} accent={accent} />
    <details className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
      <summary className="cursor-pointer rounded text-base font-bold text-slate-950 focus-visible:outline-2 focus-visible:outline-teal-600">รายละเอียดเรื่องค้าง · {number.format(snapshot.kpis.active)} เรื่อง</summary>
      {!canViewDetails ? <p className="mt-4 text-sm text-slate-500">บัญชีนี้ไม่มีสิทธิ์ดูรายละเอียดเรื่อง</p>
        : snapshot.backlog.cases.length ? <div className="mt-4 space-y-3">{snapshot.backlog.cases.map(item => <article key={item.id} className="grid min-w-0 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-[8rem_10rem_1fr]">
          <div><Link href={`/cases/${item.id}`} className="rounded font-bold text-teal-800 hover:underline focus-visible:outline-2 focus-visible:outline-teal-600">{item.blackNumber}</Link><p className="mt-1 text-xs text-slate-500">{item.year}</p></div>
          <div className="min-w-0"><p className="text-xs text-slate-500">นิติกร</p><p className="mt-1 break-words text-sm font-medium text-slate-800">{item.officer}</p></div>
          <div className="min-w-0"><h3 className="break-words text-sm font-semibold text-slate-900">{item.subject}</h3><p className="mt-2 text-xs text-slate-500">การดำเนินการ</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 [overflow-wrap:anywhere]">{item.proceeding}</p></div>
        </article>)}</div> : <p className="mt-4 rounded-xl bg-teal-50 p-5 text-sm font-medium text-teal-800">ไม่มีเรื่องค้างในทะเบียนนี้</p>}
    </details>
    <details data-testid={`officer-performance-${accent}`} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
      <summary className="cursor-pointer rounded text-base font-bold text-slate-950 focus-visible:outline-2 focus-visible:outline-teal-600">ความรับผิดชอบและความสำเร็จรายนิติกร · {title}</summary>
      <div className="mt-5 space-y-3">
        <p className="text-xs leading-5 text-slate-600">% สำเร็จ = เสร็จแล้ว ÷ รับทั้งหมด × 100 · ตามผู้รับผิดชอบที่บันทึกปัจจุบัน ไม่ใช่คะแนนผลงานหรือความเร็ว</p>
        <OfficerPerformance title={title} snapshot={snapshot} accent={accent} scaleMax={responsibilityMax} />
        <p className="text-xs leading-5 text-slate-500">เสร็จสิ้นเมื่อมีข้อความในช่องเรื่องแดง หรือสถานะปิดเรื่อง · ไม่จัดอันดับเรื่องที่ยังไม่ระบุนิติกร · กราฟสองทะเบียนใช้มาตราส่วนจำนวนเรื่องร่วมกัน</p>
      </div>
    </details>
    </div>
  </section>;
}
