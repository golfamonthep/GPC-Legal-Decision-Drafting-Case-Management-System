export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { requirePermission } from "@/lib/auth/requirePermission";
import { hasPermission } from "@/lib/auth/permissions";
import { getUnifiedDashboardData } from "@/lib/dashboard/data";
import { parseDashboardFilters } from "@/lib/dashboard/metrics";
import { RegistryOverview } from "@/components/dashboard/RegistryOverview";
import { DashboardInteractiveHub } from "@/components/dashboard/DashboardInteractiveHub";
import {
  CircleCheck,
  FolderOpen,
  Layers3,
  RefreshCw,
  ChartNoAxesCombined,
  Scale,
  Clock,
  UserCheck,
  ArrowUpRight,
} from "lucide-react";

const number = new Intl.NumberFormat("th-TH");
const dateTime = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requirePermission("VIEW_DASHBOARD");
  // Include carry-over cases regardless of the old received-date filter.
  const filters = parseDashboardFilters({ ...(await searchParams), period: "all" });
  const canViewDetails = hasPermission(user.role, "VIEW_CASE_DETAIL");
  const canUseAnalysis = hasPermission(user.role, "USE_ANALYSIS");
  const result = await getUnifiedDashboardData(filters, {
    canViewCaseDetails: canViewDetails,
    canViewDataQuality: hasPermission(user.role, "VIEW_DATA_QUALITY"),
  });
  const snapshot = result.snapshot;
  const currentHref = `/dashboard?type=${filters.type}`;
  const sections = snapshot
    ? result.byType
      ? [
          { title: "เรื่องร้องทุกข์", snapshot: result.byType.complaint, accent: "teal" as const },
          { title: "เรื่องอุทธรณ์", snapshot: result.byType.appeal, accent: "blue" as const },
        ]
      : [
          {
            title: filters.type === "appeal" ? "เรื่องอุทธรณ์" : "เรื่องร้องทุกข์",
            snapshot,
            accent: filters.type === "appeal" ? ("blue" as const) : ("teal" as const),
          },
        ]
    : [];
  // Shared zero-based scales let both registries be compared honestly.
  const yearMax = Math.max(
    2,
    Math.ceil(
      Math.max(
        ...sections.flatMap((section) =>
          section.snapshot.backlog.byYearCompletion.map((item) => item.completed + item.pending),
        ),
        0,
      ) / 2,
    ) * 2,
  );
  const responsibilityMax = Math.max(
    ...sections.flatMap((section) => section.snapshot.officerPerformance.map((item) => item.total)),
    1,
  );
  const officerMax = Math.max(
    ...sections.flatMap((section) => section.snapshot.backlog.byOfficer.map((item) => item.count)),
    1,
  );

  return (
    <div className="min-h-full bg-[#e8eff5] px-3 py-5 sm:px-6 sm:py-6 xl:px-8">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <header className="rounded-[1.5rem] border border-white/10 bg-[#102b46] px-5 py-5 text-white shadow-[0_12px_32px_-12px_rgba(15,42,70,0.5)] sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                <Scale aria-hidden="true" size={15} />
                <span>สำนักงานกรรมการพิทักษ์ระบบคุณธรรมข้าราชการตำรวจ</span>
              </div>
              <h1 className="mt-2.5 text-2xl font-bold tracking-tight sm:text-3xl">
                พล.ต.อ.วิเชียร พจน์โพธิ์ศรี กรรมการ ก.พ.ค.ตร.
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-200">
                แดชบอร์ดบริหารทะเบียนคุมสำนวน · ติดตามเรื่องค้างตามปีเลขดำ · ภาระงานนิติกร และระบบวิเคราะห์คำวินิจฉัยเบื้องต้น
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-2.5">
              <form
                action="/dashboard"
                className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:flex sm:gap-2.5"
              >
                <label className="min-w-0 text-xs font-medium text-slate-200">
                  ประเภททะเบียน
                  <select
                    name="type"
                    defaultValue={filters.type}
                    className="mt-1.5 block w-full rounded-xl border border-white/20 bg-[#0a2138] px-3 py-2.5 text-sm text-white focus-visible:outline-2 focus-visible:outline-cyan-300"
                  >
                    <option value="all">ร้องทุกข์และอุทธรณ์</option>
                    <option value="complaint">ร้องทุกข์</option>
                    <option value="appeal">อุทธรณ์</option>
                  </select>
                </label>
                <button className="min-h-11 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-200 focus-visible:outline-2 focus-visible:outline-white">
                  แสดงผล
                </button>
              </form>
              {canUseAnalysis && (
                <Link
                  href="/analysis"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-cyan-300/40 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-cyan-300"
                >
                  <span>เปิดระบบวิเคราะห์</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>

          {sections.length ? (
            <nav
              aria-label="ไปยังทะเบียน"
              className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3.5"
            >
              <div className="flex flex-wrap gap-2">
                {sections.map((section) => (
                  <a
                    key={section.title}
                    href={section.accent === "teal" ? "#registry-complaint" : "#registry-appeal"}
                    className="inline-flex min-h-10 items-center rounded-full border border-cyan-200/25 bg-white/5 px-4 text-xs font-semibold text-slate-100 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-cyan-300"
                  >
                    {section.title}
                    <span className="ml-3 rounded-full bg-[#071b30] px-2.5 py-0.5 tabular-nums text-cyan-200">
                      {number.format(section.snapshot.kpis.active)} ค้าง
                    </span>
                  </a>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  { key: "all", label: "ทั้งหมด" },
                  { key: "complaint", label: "เฉพาะร้องทุกข์" },
                  { key: "appeal", label: "เฉพาะอุทธรณ์" },
                ].map((pill) => (
                  <Link
                    key={pill.key}
                    href={`/dashboard?type=${pill.key}`}
                    className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                      filters.type === pill.key
                        ? "bg-cyan-300 text-slate-950"
                        : "bg-white/5 text-slate-200 hover:bg-white/15"
                    }`}
                  >
                    {pill.label}
                  </Link>
                ))}
              </div>
            </nav>
          ) : null}
        </header>

        {result.source === "demo" && (
          <div
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900"
          >
            ข้อมูลสาธิตนิรนาม — ไม่ใช่จำนวนเรื่องจริง
          </div>
        )}
        {result.state !== "ready" && (
          <div
            role="status"
            className="rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-700"
          >
            <p>
              {result.message ||
                (result.state === "empty"
                  ? "ยังไม่มีข้อมูลในทะเบียนที่เลือก"
                  : "ข้อมูลบางส่วนยังไม่พร้อม")}
            </p>
            {result.partialReasons?.length ? (
              <p className="mt-1">ส่วนที่ไม่พร้อม: {result.partialReasons.join(", ")}</p>
            ) : null}
          </div>
        )}

        {snapshot ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <p>
                ข้อมูลล่าสุด{" "}
                {snapshot.dataFreshness
                  ? dateTime.format(new Date(snapshot.dataFreshness))
                  : "ยังไม่มีเวลาอัปเดต"}{" "}
                · รวมเรื่องค้างทุกปี ไม่จำกัดวันที่รับเรื่อง
              </p>
              <Link
                href={currentHref}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2.5 py-2 font-semibold text-cyan-900 hover:bg-white focus-visible:outline-2 focus-visible:outline-cyan-700"
              >
                <RefreshCw size={14} aria-hidden="true" />
                รีเฟรชข้อมูล
              </Link>
            </div>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {[
                {
                  label: "ทะเบียนทั้งหมด",
                  value: number.format(snapshot.totalCases),
                  sub: "สำนวนในระบบ",
                  icon: Layers3,
                  dark: false,
                },
                {
                  label: "เสร็จสิ้น",
                  value: number.format(snapshot.totalCases - snapshot.kpis.active),
                  sub: "มีข้อมูลช่องเรื่องแดง",
                  icon: CircleCheck,
                  dark: false,
                },
                {
                  label: "เรื่องค้างรวม",
                  value: number.format(snapshot.kpis.active),
                  sub: "อยู่ระหว่างดำเนินการ",
                  icon: FolderOpen,
                  dark: true,
                },
                {
                  label: "% สำเร็จรวม",
                  value: snapshot.totalCases
                    ? `${new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 }).format(
                        ((snapshot.totalCases - snapshot.kpis.active) / snapshot.totalCases) * 100,
                      )}%`
                    : "—",
                  sub: "เทียบทะเบียนทั้งหมด",
                  icon: ChartNoAxesCombined,
                  dark: false,
                },
                {
                  label: "เร่งด่วน / ครบใน 7 วัน",
                  value: number.format(snapshot.kpis.overdue + snapshot.kpis.dueWithin7Days),
                  sub: `เกินกำหนด ${number.format(snapshot.kpis.overdue)} เรื่อง`,
                  icon: Clock,
                  dark: false,
                },
                {
                  label: "รอระบุนิติกร",
                  value: number.format(snapshot.kpis.unassigned),
                  sub: "เฉพาะสำนวนที่ยังค้าง",
                  icon: UserCheck,
                  dark: false,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`relative min-w-0 rounded-2xl border px-4 py-3.5 shadow-[0_5px_16px_-10px_rgba(15,42,70,0.4)] ${
                    item.dark
                      ? "border-[#102b46] bg-[#102b46] text-white"
                      : "border-white bg-white text-slate-950"
                  }`}
                >
                  <dt className={`pr-6 text-xs font-semibold ${item.dark ? "text-cyan-100" : "text-slate-600"}`}>
                    {item.label}
                  </dt>
                  <item.icon
                    size={18}
                    aria-hidden="true"
                    className={`absolute right-4 top-3.5 ${item.dark ? "text-cyan-300" : "text-cyan-700"}`}
                  />
                  <dd className="mt-2 text-2xl font-bold tabular-nums sm:text-3xl">{item.value}</dd>
                  <p className={`mt-1 text-[11px] ${item.dark ? "text-cyan-200/90" : "text-slate-500"}`}>
                    {item.sub}
                  </p>
                </div>
              ))}
            </dl>

            <DashboardInteractiveHub
              snapshot={snapshot}
              sections={sections}
              canViewDetails={canViewDetails}
              canUseAnalysis={canUseAnalysis}
            />

            <div className="min-w-0 space-y-5">
              {sections.map((section) => (
                <RegistryOverview
                  key={section.title}
                  {...section}
                  canViewDetails={canViewDetails}
                  yearMax={yearMax}
                  officerMax={officerMax}
                  responsibilityMax={responsibilityMax}
                />
              ))}
            </div>
          </>
        ) : (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-lg font-bold">ยังไม่สามารถแสดงยอดเรื่องค้างได้</h2>
            <p className="mt-2 text-sm text-slate-600">
              กรุณาตรวจสอบการเชื่อมต่อและโครงสร้างฐานข้อมูล ระบบไม่แสดงศูนย์แทนข้อผิดพลาด
            </p>
            <Link
              href={currentHref}
              className="mt-5 inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
            >
              ลองใหม่
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
