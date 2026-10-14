export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { requirePermission } from "@/lib/auth/requirePermission";
import { hasPermission } from "@/lib/auth/permissions";
import { getUnifiedDashboardData } from "@/lib/dashboard/data";
import { parseDashboardFilters } from "@/lib/dashboard/metrics";
import { RegistryOverview } from "@/components/dashboard/RegistryOverview";
import { CircleCheck, FolderOpen, Layers3, RefreshCw, ChartNoAxesCombined } from "lucide-react";

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
  const yearMax = Math.max(2, Math.ceil(Math.max(...sections.flatMap(section => section.snapshot.backlog.byYearCompletion.map(item => item.completed + item.pending)), 0) / 2) * 2);
  const responsibilityMax = Math.max(...sections.flatMap(section => section.snapshot.officerPerformance.map(item => item.total)), 1);
  const officerMax = Math.max(...sections.flatMap(section => section.snapshot.backlog.byOfficer.map(item => item.count)), 1);
  return <div className="min-h-full bg-[#e8eff5] px-3 py-5 sm:px-6 sm:py-6 xl:px-8">
    <div className="mx-auto max-w-[1600px] space-y-3">
      <header className="rounded-[1.5rem] border border-white/10 bg-[#102b46] px-5 py-4 text-white shadow-[0_12px_32px_-12px_rgba(15,42,70,0.5)] sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="flex items-center gap-2 text-xs font-semibold text-cyan-200"><ChartNoAxesCombined aria-hidden="true" size={16} />ก.พ.ค.ตร. · ภาพรวมทะเบียนคุม</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">แดชบอร์ดเรื่องค้าง</h1>
            <p className="mt-2 max-w-2xl text-sm leading-5 text-slate-200">ภาพรวมงาน · เรื่องค้างตามปี · ภาระงานนิติกร</p></div>
          <form action="/dashboard" className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 lg:flex lg:gap-3">
            <label className="min-w-0 text-xs font-medium text-slate-200">ประเภททะเบียน<select name="type" defaultValue={filters.type} className="mt-2 block w-full rounded-xl border border-white/20 bg-[#0a2138] px-3 py-2.5 text-sm text-white focus-visible:outline-2 focus-visible:outline-cyan-300">
              <option value="all">ร้องทุกข์และอุทธรณ์</option><option value="complaint">ร้องทุกข์</option><option value="appeal">อุทธรณ์</option>
            </select></label>
            <button className="min-h-11 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-200 focus-visible:outline-2 focus-visible:outline-white">แสดงผล</button>
          </form>
        </div>
        {sections.length ? <nav aria-label="ไปยังทะเบียน" className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
          {sections.map(section => <a key={section.title} href={section.accent === "teal" ? "#registry-complaint" : "#registry-appeal"} className="inline-flex min-h-10 items-center rounded-full border border-cyan-200/25 bg-white/5 px-4 text-xs font-semibold text-slate-100 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-cyan-300">{section.title}<span className="ml-3 rounded-full bg-[#071b30] px-2 py-0.5 tabular-nums text-cyan-200">{number.format(section.snapshot.kpis.active)} ค้าง</span></a>)}
        </nav> : null}
      </header>
      {result.source === "demo" && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">ข้อมูลสาธิตนิรนาม — ไม่ใช่จำนวนเรื่องจริง</div>}
      {result.state !== "ready" && <div role="status" className="rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-700">
        <p>{result.message || (result.state === "empty" ? "ยังไม่มีข้อมูลในทะเบียนที่เลือก" : "ข้อมูลบางส่วนยังไม่พร้อม")}</p>
        {result.partialReasons?.length ? <p className="mt-1">ส่วนที่ไม่พร้อม: {result.partialReasons.join(", ")}</p> : null}
      </div>}
      {snapshot ? <>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"><p>ข้อมูลล่าสุด {snapshot.dataFreshness ? dateTime.format(new Date(snapshot.dataFreshness)) : "ยังไม่มีเวลาอัปเดต"} · รวมเรื่องค้างทุกปี ไม่จำกัดวันที่รับเรื่อง</p>
          <Link href={currentHref} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 py-2 font-semibold text-cyan-800 hover:bg-white focus-visible:outline-2 focus-visible:outline-cyan-700"><RefreshCw size={14} aria-hidden="true" />รีเฟรชข้อมูล</Link></div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[{ label: "ทะเบียนทั้งหมด", value: number.format(snapshot.totalCases), icon: Layers3, dark: false }, { label: "เสร็จสิ้น", value: number.format(snapshot.totalCases - snapshot.kpis.active), icon: CircleCheck, dark: false },
            { label: "เรื่องค้างรวม", value: number.format(snapshot.kpis.active), icon: FolderOpen, dark: true }, { label: "% สำเร็จรวม", value: snapshot.totalCases ? `${new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 }).format((snapshot.totalCases - snapshot.kpis.active) / snapshot.totalCases * 100)}%` : "—", icon: ChartNoAxesCombined, dark: false }]
            .map(item => <div key={item.label} className={`relative min-w-0 rounded-2xl border px-4 py-3 shadow-[0_5px_16px_-10px_rgba(15,42,70,0.4)] ${item.dark ? "border-[#102b46] bg-[#102b46] text-white" : "border-white bg-white text-slate-950"}`}><dt className={`pr-6 text-xs ${item.dark ? "text-cyan-100" : "text-slate-600"}`}>{item.label}</dt><item.icon size={18} aria-hidden="true" className={`absolute right-4 top-3 ${item.dark ? "text-cyan-300" : "text-cyan-700"}`} /><dd className="mt-2 text-3xl font-bold tabular-nums">{item.value}</dd></div>)}
        </dl>
        <div className="min-w-0 space-y-5">{sections.map(section => <RegistryOverview key={section.title} {...section} canViewDetails={canViewDetails} yearMax={yearMax} officerMax={officerMax} responsibilityMax={responsibilityMax} />)}</div>
      </> : <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="text-lg font-bold">ยังไม่สามารถแสดงยอดเรื่องค้างได้</h2><p className="mt-2 text-sm text-slate-600">กรุณาตรวจสอบการเชื่อมต่อและโครงสร้างฐานข้อมูล ระบบไม่แสดงศูนย์แทนข้อผิดพลาด</p>
        <Link href={currentHref} className="mt-5 inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">ลองใหม่</Link>
      </section>}
    </div>
  </div>;
}
