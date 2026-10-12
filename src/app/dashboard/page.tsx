export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { requirePermission } from "@/lib/auth/requirePermission";
import { hasPermission } from "@/lib/auth/permissions";
import { getUnifiedDashboardData } from "@/lib/dashboard/data";
import { parseDashboardFilters } from "@/lib/dashboard/metrics";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import { CompletionRing, RankedBars, YearColumns, type RegistryAccent } from "@/components/dashboard/BacklogCharts";

const number = new Intl.NumberFormat("th-TH");
const dateTime = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" });

function BacklogSection({ title, snapshot, canViewDetails, accent, yearMax, officerMax, proceedingMax }: {
  title: string; snapshot: DashboardSnapshot; canViewDetails: boolean; accent: RegistryAccent;
  yearMax: number; officerMax: number; proceedingMax: number;
}) {
  return <section aria-label={title} className="min-w-0 space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold text-teal-700">ทะเบียนคุม</p><h2 className="mt-1 text-2xl font-bold text-slate-950">{title}</h2></div>
      <dl className="flex flex-wrap gap-6">
        <div><dt className="text-xs text-slate-600">คงเหลือที่ค้าง</dt><dd className="mt-1 text-4xl font-bold tabular-nums text-teal-800">{number.format(snapshot.kpis.active)} <span className="text-sm">เรื่อง</span></dd></div>
        <div><dt className="text-xs text-slate-500">เสร็จสิ้น</dt><dd className="mt-2 text-xl font-semibold text-slate-700">{number.format(snapshot.totalCases - snapshot.kpis.active)}</dd></div>
        <div><dt className="text-xs text-slate-500">ทะเบียนทั้งหมด</dt><dd className="mt-2 text-xl font-semibold text-slate-700">{number.format(snapshot.totalCases)}</dd></div>
      </dl>
    </div>
    <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[1fr_1.4fr]">
      <div className="min-w-0 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><CompletionRing total={snapshot.totalCases} pending={snapshot.kpis.active} accent={accent} /></div>
        <YearColumns data={snapshot.backlog.byYear} scaleMax={yearMax} accent={accent} />
      </div>
      <RankedBars title="เรื่องค้างแยกตามนิติกร" note="หน่วย: เรื่อง · เรียงตามจำนวนค้าง · แสดงนิติกรทุกคน" data={snapshot.backlog.byOfficer} total={snapshot.kpis.active} scaleMax={officerMax} accent={accent} />
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
  </section>;
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const user = await requirePermission("VIEW_DASHBOARD");
  // Include carry-over cases regardless of the old received-date filter.
  const filters = parseDashboardFilters({ ...(await searchParams), period: "all" });
  const canViewDetails = hasPermission(user.role, "VIEW_CASE_DETAIL");
  const result = await getUnifiedDashboardData(filters, {
    canViewCaseDetails: canViewDetails,
    canViewDataQuality: hasPermission(user.role, "VIEW_DATA_QUALITY"),
  });
  const snapshot = result.snapshot;
  const currentHref = `/dashboard?type=${filters.type}`;
  const sections = snapshot ? result.byType
    ? [{ title: "เรื่องร้องทุกข์", snapshot: result.byType.complaint, accent: "teal" as const }, { title: "เรื่องอุทธรณ์", snapshot: result.byType.appeal, accent: "blue" as const }]
    : [{ title: filters.type === "appeal" ? "เรื่องอุทธรณ์" : "เรื่องร้องทุกข์", snapshot, accent: filters.type === "appeal" ? "blue" as const : "teal" as const }]
    : [];
  // Shared zero-based scales let both registries be compared honestly.
  const yearMax = Math.max(2, Math.ceil(Math.max(...sections.flatMap(section => section.snapshot.backlog.byYear.map(item => item.count)), 0) / 2) * 2);
  const officerMax = Math.max(...sections.flatMap(section => section.snapshot.backlog.byOfficer.map(item => item.count)), 1);
  const proceedingMax = Math.max(...sections.flatMap(section => section.snapshot.backlog.byProceeding.map(item => item.count)), 1);
  return <div className="min-h-full bg-[#f5f7fa] px-3 py-5 sm:px-6 sm:py-7 xl:px-10">
    <div className="mx-auto max-w-[1600px] space-y-6">
      <header className="rounded-3xl bg-[linear-gradient(125deg,#07162d_0%,#102b4e_65%,#0f766e_140%)] px-5 py-6 text-white sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-semibold text-cyan-200">ก.พ.ค.ตร. · ภาพรวมทะเบียนคุม</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">แดชบอร์ดเรื่องค้าง</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">คงเหลือกี่เรื่อง · เป็นเรื่องของปีใด · นิติกรผู้รับผิดชอบ · การดำเนินการที่บันทึกไว้</p></div>
          <form action="/dashboard" className="flex flex-wrap items-end gap-3">
            <label className="min-w-0 text-xs font-medium text-slate-200">ประเภททะเบียน<select name="type" defaultValue={filters.type} className="mt-2 block w-full rounded-xl border border-white/20 bg-slate-900 px-3 py-2.5 text-sm text-white focus-visible:outline-2 focus-visible:outline-cyan-300">
              <option value="all">ร้องทุกข์และอุทธรณ์</option><option value="complaint">ร้องทุกข์</option><option value="appeal">อุทธรณ์</option>
            </select></label>
            <button className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-200 focus-visible:outline-2 focus-visible:outline-white">แสดงผล</button>
          </form>
        </div>
      </header>
      {result.source === "demo" && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">ข้อมูลสาธิตนิรนาม — ไม่ใช่จำนวนเรื่องจริง</div>}
      {result.state !== "ready" && <div role="status" className="rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-700">
        <p>{result.message || (result.state === "empty" ? "ยังไม่มีข้อมูลในทะเบียนที่เลือก" : "ข้อมูลบางส่วนยังไม่พร้อม")}</p>
        {result.partialReasons?.length ? <p className="mt-1">ส่วนที่ไม่พร้อม: {result.partialReasons.join(", ")}</p> : null}
      </div>}
      {snapshot ? <>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"><p>ข้อมูลล่าสุด {snapshot.dataFreshness ? dateTime.format(new Date(snapshot.dataFreshness)) : "ยังไม่มีเวลาอัปเดต"} · รวมเรื่องค้างทุกปี ไม่จำกัดวันที่รับเรื่อง</p>
          <Link href={currentHref} className="rounded-lg px-2 py-2 font-semibold text-teal-800 hover:bg-teal-50">รีเฟรชข้อมูล</Link></div>
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5"><p className="text-sm font-medium text-teal-900">เรื่องค้างรวม{filters.type === "all" ? "ทั้งสองทะเบียน" : "ในทะเบียนที่เลือก"}</p>
          <p className="mt-2 text-4xl font-bold text-teal-950">{number.format(snapshot.kpis.active)} <span className="text-base font-medium">เรื่อง</span></p>
          <p className="mt-3 text-xs leading-5 text-teal-900">เรื่องที่มีข้อความในช่องเรื่องแดง หรือบันทึกสถานะปิดเรื่องแล้ว ไม่นับเป็นเรื่องค้าง</p></div>
        {sections.length === 2 && <p className="text-xs leading-5 text-slate-500">ร้องทุกข์ใช้สีเขียวอมฟ้า · อุทธรณ์ใช้สีน้ำเงิน · กราฟประเภทเดียวกันใช้มาตราส่วนร่วม เริ่มที่ศูนย์</p>}
        {sections.map(section => <BacklogSection key={section.title} {...section} canViewDetails={canViewDetails} yearMax={yearMax} officerMax={officerMax} proceedingMax={proceedingMax} />)}
      </> : <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="text-lg font-bold">ยังไม่สามารถแสดงยอดเรื่องค้างได้</h2><p className="mt-2 text-sm text-slate-600">กรุณาตรวจสอบการเชื่อมต่อและโครงสร้างฐานข้อมูล ระบบไม่แสดงศูนย์แทนข้อผิดพลาด</p>
        <Link href={currentHref} className="mt-5 inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">ลองใหม่</Link>
      </section>}
    </div>
  </div>;
}
