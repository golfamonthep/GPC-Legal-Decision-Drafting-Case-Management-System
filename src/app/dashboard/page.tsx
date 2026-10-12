export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { requirePermission } from "@/lib/auth/requirePermission";
import { hasPermission } from "@/lib/auth/permissions";
import { getUnifiedDashboardData } from "@/lib/dashboard/data";
import { parseDashboardFilters } from "@/lib/dashboard/metrics";
import { RegistryOverview } from "@/components/dashboard/RegistryOverview";

const number = new Intl.NumberFormat("th-TH");
const dateTime = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" });

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
  const responsibilityMax = Math.max(...sections.flatMap(section => section.snapshot.officerPerformance.map(item => item.total)), 1);
  const officerMax = Math.max(...sections.flatMap(section => section.snapshot.backlog.byOfficer.map(item => item.count)), 1);
  const proceedingMax = Math.max(...sections.flatMap(section => section.snapshot.backlog.byProceeding.map(item => item.count)), 1);
  return <div className="min-h-full bg-[#f5f7fa] px-3 py-5 sm:px-6 sm:py-7 xl:px-10">
    <div className="mx-auto max-w-[1600px] space-y-3">
      <header className="rounded-2xl bg-[linear-gradient(125deg,#07162d_0%,#102b4e_65%,#0f766e_140%)] px-5 py-3 text-white sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-semibold text-cyan-200">ก.พ.ค.ตร. · ภาพรวมทะเบียนคุม</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">แดชบอร์ดเรื่องค้าง</h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-300">ภาพรวมงาน · เรื่องค้างตามปีและนิติกร · การดำเนินการ · กดดูรายละเอียดเพิ่มเติม</p></div>
          <form action="/dashboard" className="flex flex-wrap items-end gap-3">
            <label className="min-w-0 text-xs font-medium text-slate-200">ประเภททะเบียน<select name="type" defaultValue={filters.type} className="mt-2 block w-full rounded-xl border border-white/20 bg-slate-900 px-3 py-2.5 text-sm text-white focus-visible:outline-2 focus-visible:outline-cyan-300">
              <option value="all">ร้องทุกข์และอุทธรณ์</option><option value="complaint">ร้องทุกข์</option><option value="appeal">อุทธรณ์</option>
            </select></label>
            <button className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-200 focus-visible:outline-2 focus-visible:outline-white">แสดงผล</button>
          </form>
        </div>
      </header>
      {result.source === "demo" && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">ข้อมูลสาธิตนิรนาม — ไม่ใช่จำนวนเรื่องจริง</div>}
      {result.state !== "ready" && <div role="status" className="rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-700">
        <p>{result.message || (result.state === "empty" ? "ยังไม่มีข้อมูลในทะเบียนที่เลือก" : "ข้อมูลบางส่วนยังไม่พร้อม")}</p>
        {result.partialReasons?.length ? <p className="mt-1">ส่วนที่ไม่พร้อม: {result.partialReasons.join(", ")}</p> : null}
      </div>}
      {snapshot ? <>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"><p>ข้อมูลล่าสุด {snapshot.dataFreshness ? dateTime.format(new Date(snapshot.dataFreshness)) : "ยังไม่มีเวลาอัปเดต"} · รวมเรื่องค้างทุกปี ไม่จำกัดวันที่รับเรื่อง</p>
          <Link href={currentHref} className="rounded-lg px-2 py-2 font-semibold text-teal-800 hover:bg-teal-50">รีเฟรชข้อมูล</Link></div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[{ label: "ทะเบียนทั้งหมด", value: number.format(snapshot.totalCases) }, { label: "เสร็จสิ้น", value: number.format(snapshot.totalCases - snapshot.kpis.active) },
            { label: "เรื่องค้างรวม", value: number.format(snapshot.kpis.active) }, { label: "% สำเร็จรวม", value: snapshot.totalCases ? `${new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 }).format((snapshot.totalCases - snapshot.kpis.active) / snapshot.totalCases * 100)}%` : "—" }]
            .map(item => <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3"><dt className="text-xs text-slate-600">{item.label}</dt><dd className="mt-1 text-2xl font-bold tabular-nums text-slate-950">{item.value}</dd></div>)}
        </dl>
        <div className="min-w-0 space-y-4">{sections.map(section => <RegistryOverview key={section.title} {...section} canViewDetails={canViewDetails} yearMax={yearMax} officerMax={officerMax} proceedingMax={proceedingMax} responsibilityMax={responsibilityMax} />)}</div>
      </> : <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="text-lg font-bold">ยังไม่สามารถแสดงยอดเรื่องค้างได้</h2><p className="mt-2 text-sm text-slate-600">กรุณาตรวจสอบการเชื่อมต่อและโครงสร้างฐานข้อมูล ระบบไม่แสดงศูนย์แทนข้อผิดพลาด</p>
        <Link href={currentHref} className="mt-5 inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">ลองใหม่</Link>
      </section>}
    </div>
  </div>;
}
