export const dynamic = "force-dynamic";
export const revalidate = 0;

import Image from "next/image";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/requirePermission";
import { hasPermission } from "@/lib/auth/permissions";
import { getUnifiedDashboardData } from "@/lib/dashboard/data";
import { parseDashboardFilters } from "@/lib/dashboard/metrics";
import { RegistryOverview } from "@/components/dashboard/RegistryOverview";
import { DashboardInteractiveHub } from "@/components/dashboard/DashboardInteractiveHub";
import {
  OWNER_NAME,
  OWNER_ORG_EN,
  OWNER_ORG_TH,
  OWNER_PHOTO,
  OWNER_PHOTO_WIDE,
  OWNER_ROLE,
} from "@/lib/owner";
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
  UserRound,
  Zap,
  ChevronsRight,
} from "lucide-react";

const number = new Intl.NumberFormat("th-TH");
const pctFormat = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 });
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

  const completedCount = snapshot ? snapshot.totalCases - snapshot.kpis.active : 0;
  const completionPct =
    snapshot && snapshot.totalCases > 0
      ? pctFormat.format((completedCount / snapshot.totalCases) * 100)
      : "0";

  return (
    <div className="min-h-full bg-[#08080a] px-3 py-5 text-zinc-100 sm:px-6 sm:py-6 xl:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* CYBER Capsule Top Navigation + Hero Overview */}
        <header className="relative overflow-hidden rounded-[2rem] border border-[#3a1d24] bg-[radial-gradient(125%_100%_at_50%_0%,rgba(153,27,27,0.28)_0%,rgba(14,14,18,0.98)_65%)] p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] sm:p-7">
          {/* Top Floating Capsule Bar (matching CYBER top nav) */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e11d48]/40 bg-gradient-to-br from-[#be123c] to-[#6b111b] text-xs font-black tracking-wider text-white shadow-[0_0_24px_rgba(185,28,28,0.6)]">
                กพค
              </span>
              <div>
                <p className="text-sm font-black tracking-[0.14em] uppercase text-white">
                  G P C · E X E C U T I V E
                </p>
                <p className="text-[11px] text-[#fda4af]">
                  {OWNER_NAME} {OWNER_ROLE}
                </p>
              </div>
            </div>

            {/* Center Capsule Navigation */}
            <nav
              aria-label="ไปยังทะเบียน"
              className="flex flex-wrap items-center gap-1.5 rounded-full border border-white/10 bg-[#0d0d11]/90 p-1.5 shadow-inner"
            >
              {[
                { key: "all", label: "ภาพรวมทั้งหมด" },
                { key: "complaint", label: "เรื่องร้องทุกข์" },
                { key: "appeal", label: "เรื่องอุทธรณ์" },
              ].map((pill) => {
                const active = filters.type === pill.key;
                return (
                  <Link
                    key={pill.key}
                    href={`/dashboard?type=${pill.key}`}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                      active
                        ? "bg-gradient-to-r from-[#be123c] via-[#991b1b] to-[#6b111b] text-white shadow-[0_6px_18px_-4px_rgba(225,29,72,0.65)]"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {pill.label}
                  </Link>
                );
              })}
              {sections.map((section) => (
                <a
                  key={section.title}
                  href={section.accent === "teal" ? "#registry-complaint" : "#registry-appeal"}
                  className="hidden md:inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/5 hover:text-white"
                >
                  <span>กราฟ{section.title}</span>
                  <span className="rounded-full bg-[#be123c]/25 px-2 py-0.5 text-[10px] font-bold tabular-nums text-[#fda4af]">
                    {number.format(section.snapshot.kpis.active)}
                  </span>
                </a>
              ))}
            </nav>

            {/* Right Quick Controls & Owner Avatar */}
            <div className="flex items-center gap-2.5">
              <form action="/dashboard" className="flex items-center gap-2">
                <label className="sr-only" htmlFor="dashboard-type-select">
                  ประเภททะเบียน
                </label>
                <select
                  id="dashboard-type-select"
                  name="type"
                  defaultValue={filters.type}
                  aria-label="ประเภททะเบียน"
                  className="rounded-full border border-[#3a1d24] bg-[#14141b] px-3.5 py-2 text-xs font-semibold text-zinc-200 focus-visible:outline-2 focus-visible:outline-[#be123c]"
                >
                  <option value="all">ร้องทุกข์และอุทธรณ์</option>
                  <option value="complaint">ร้องทุกข์</option>
                  <option value="appeal">อุทธรณ์</option>
                </select>
                <button className="rounded-full bg-gradient-to-r from-[#be123c] to-[#881337] px-4 py-2 text-xs font-bold text-white shadow-[0_6px_16px_-4px_rgba(185,28,28,0.65)] transition hover:brightness-110">
                  แสดงผล
                </button>
              </form>
              {canUseAnalysis && (
                <Link
                  href="/analysis"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#4c1d24] bg-[#181216] px-4 py-2 text-xs font-bold text-[#fda4af] transition hover:border-[#be123c] hover:text-white"
                >
                  <span>เปิดระบบวิเคราะห์</span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              )}
              <Link
                href="/owner"
                title="หน้าเจ้าของเว็บไซต์ พล.ต.อ.วิเชียร พจน์โพธิ์ศรี"
                className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-b from-[#be123c] to-[#6b111b] p-0.5 ring-2 ring-[#e11d48]/50 transition hover:scale-105"
              >
                <Image
                  src={OWNER_PHOTO}
                  alt={OWNER_NAME}
                  fill
                  sizes="40px"
                  className="scale-[2.2] rounded-full object-cover object-[50%_30%]"
                />
              </Link>
            </div>
          </div>

          {/* CYBER Hero Section: Title Left + Fanned Stacked Police Maroon Insight Cards Center + Official Photo Right */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
            {/* Left: Dashboard Overview Title */}
            <div className="lg:col-span-4 space-y-2.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#4c1d24] bg-[#be123c]/15 px-3 py-1 text-[11px] font-semibold text-[#fda4af]">
                <Scale size={13} aria-hidden="true" />
                <span>{OWNER_ORG_TH}</span>
              </div>
              <p className="text-xs font-medium text-zinc-400">
                Data Based on All Registries · ข้อมูลทะเบียนคุมสำนวนทั้งหมด
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {OWNER_NAME}
              </h1>
              <p className="text-base font-bold text-[#fb7185]">
                {OWNER_ROLE} · Dashboard Overview
              </p>
              <p className="text-xs leading-6 text-zinc-400">
                ติดตามสัดส่วนผลการพิจารณา แนวโน้มตามปีเลขดำ ภาระงานรายนิติกร
                และวิเคราะห์ร่างคำวินิจฉัยเบื้องต้นภายใต้มาตรฐาน ก.พ.ค.ตร.
              </p>
              <div className="pt-1 flex flex-wrap gap-2.5">
                <Link
                  href="/owner"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#be123c] via-[#991b1b] to-[#6b111b] px-4 py-2 text-xs font-bold text-white shadow-[0_10px_24px_-6px_rgba(185,28,28,0.7)] transition hover:brightness-110"
                >
                  <UserRound size={14} aria-hidden="true" />
                  <span>หน้าเจ้าของเว็บไซต์</span>
                </Link>
                <Link
                  href={currentHref}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
                >
                  <RefreshCw size={13} aria-hidden="true" />
                  <span>รีเฟรชข้อมูล</span>
                </Link>
              </div>
            </div>

            {/* Center: Fanned 3D Stacked Police Maroon Insight Cards (Directly matching CYBER "Account Insights" fanned cards) */}
            <div className="relative py-2 lg:col-span-5">
              {/* Back Fanned Card 3 */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-4 right-2 hidden w-[78%] translate-x-6 rotate-6 rounded-3xl border border-[#4c1d24]/60 bg-[radial-gradient(120%_100%_at_50%_100%,rgba(153,27,27,0.35)_0%,rgba(18,18,24,0.85)_75%)] p-5 opacity-55 sm:block"
              >
                <div className="flex justify-end text-[#fb7185]/70">
                  <ChevronsRight size={16} />
                </div>
              </div>
              {/* Middle Fanned Card 2 */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-2 right-6 hidden w-[84%] translate-x-3 rotate-3 rounded-3xl border border-[#5b1d28]/75 bg-[radial-gradient(120%_100%_at_50%_100%,rgba(185,28,28,0.42)_0%,rgba(20,20,26,0.92)_75%)] p-5 opacity-75 sm:block"
              >
                <div className="flex justify-end text-[#fb7185]">
                  <ChevronsRight size={16} />
                </div>
              </div>
              {/* Front Active Insight Card 1 */}
              <div className="relative z-10 w-full sm:w-[88%] rounded-3xl border border-[#7f1d1d] bg-[radial-gradient(125%_115%_at_50%_105%,rgba(185,28,28,0.68)_0%,rgba(127,29,29,0.28)_48%,rgba(16,16,22,0.97)_100%)] p-6 shadow-[0_24px_50px_-15px_rgba(153,27,27,0.65)]">
                <div className="flex items-center justify-between text-xs font-bold text-[#fda4af]">
                  <span className="inline-flex items-center gap-1.5">
                    <Zap size={14} className="text-[#fb7185]" aria-hidden="true" />
                    <span>Executive Registry Insights</span>
                  </span>
                  <ChevronsRight size={18} className="text-[#fb7185]" aria-hidden="true" />
                </div>
                <p className="mt-4 text-lg font-medium leading-relaxed text-zinc-100 sm:text-xl">
                  ผลการพิจารณาวินิจฉัยสะสมดำเนินการเสร็จสิ้นแล้ว{" "}
                  <strong className="font-extrabold text-[#fda4af]">
                    {number.format(completedCount)} / {number.format(snapshot?.totalCases ?? 0)} เรื่อง
                  </strong>{" "}
                  คิดเป็นอัตราความสำเร็จ{" "}
                  <span className="font-extrabold text-[#fb7185] underline decoration-[#be123c] underline-offset-4">
                    {completionPct}%
                  </span>
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[11px] text-zinc-300">
                  <span>
                    คงค้างดำเนินการ{" "}
                    <strong className="text-white">
                      {number.format(snapshot?.kpis.active ?? 0)} เรื่อง
                    </strong>
                  </span>
                  <span>
                    ข้อมูลล่าสุด{" "}
                    {snapshot?.dataFreshness
                      ? dateTime.format(new Date(snapshot.dataFreshness))
                      : "ปัจจุบัน"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Wide Official Police Maroon Portrait Card of พล.ต.อ.วิเชียร พจน์โพธิ์ศรี */}
            <div className="lg:col-span-3">
              <Link
                href="/owner"
                className="group relative block overflow-hidden rounded-3xl border border-[#5b1d28] bg-[#121217] p-2 shadow-[0_20px_45px_-15px_rgba(153,27,27,0.6)] transition hover:border-[#e11d48]"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
                  <Image
                    src={OWNER_PHOTO_WIDE}
                    alt={`${OWNER_NAME} ${OWNER_ROLE}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 360px"
                    priority
                    className="object-cover object-top transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                  <div className="absolute inset-x-3 bottom-2.5 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-xs font-extrabold text-white">{OWNER_NAME}</p>
                      <p className="text-[10px] font-semibold text-[#fda4af]">
                        {OWNER_ROLE} · {OWNER_ORG_EN}
                      </p>
                    </div>
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#be123c] text-white shadow">
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {result.source === "demo" && (
          <div
            role="status"
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200"
          >
            ข้อมูลสาธิตนิรนาม — ไม่ใช่จำนวนเรื่องจริง
          </div>
        )}
        {result.state !== "ready" && (
          <div
            role="status"
            className="rounded-xl border border-[#3a1d24] bg-[#121217] p-4 text-sm text-zinc-200"
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
            {/* 6 Gradient Executive KPI Cards */}
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {[
                {
                  label: "ทะเบียนทั้งหมด",
                  value: number.format(snapshot.totalCases),
                  sub: "สำนวนในระบบ",
                  icon: Layers3,
                  accentCard: false,
                },
                {
                  label: "เสร็จสิ้น",
                  value: number.format(snapshot.totalCases - snapshot.kpis.active),
                  sub: "มีข้อมูลช่องเรื่องแดง",
                  icon: CircleCheck,
                  accentCard: false,
                },
                {
                  label: "เรื่องค้างรวม",
                  value: number.format(snapshot.kpis.active),
                  sub: "อยู่ระหว่างดำเนินการ",
                  icon: FolderOpen,
                  accentCard: true,
                },
                {
                  label: "% สำเร็จรวม",
                  value: snapshot.totalCases ? `${completionPct}%` : "—",
                  sub: "เทียบทะเบียนทั้งหมด",
                  icon: ChartNoAxesCombined,
                  accentCard: false,
                },
                {
                  label: "เร่งด่วน / ครบใน 7 วัน",
                  value: number.format(snapshot.kpis.overdue + snapshot.kpis.dueWithin7Days),
                  sub: `เกินกำหนด ${number.format(snapshot.kpis.overdue)} เรื่อง`,
                  icon: Clock,
                  accentCard: false,
                },
                {
                  label: "รอระบุนิติกร",
                  value: number.format(snapshot.kpis.unassigned),
                  sub: "เฉพาะสำนวนที่ยังค้าง",
                  icon: UserCheck,
                  accentCard: false,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`relative min-w-0 rounded-2xl border px-4 py-3.5 shadow-lg ${
                    item.accentCard
                      ? "border-[#be123c] bg-[radial-gradient(125%_115%_at_50%_105%,rgba(225,29,72,0.55)_0%,rgba(136,19,55,0.45)_55%,rgba(24,14,18,0.98)_100%)] text-white shadow-[0_14px_30px_-10px_rgba(185,28,28,0.65)]"
                      : "border-[#262632] bg-[#101014] text-zinc-100"
                  }`}
                >
                  <dt
                    className={`pr-6 text-xs font-semibold ${
                      item.accentCard ? "text-[#fda4af]" : "text-zinc-400"
                    }`}
                  >
                    {item.label}
                  </dt>
                  <item.icon
                    size={18}
                    aria-hidden="true"
                    className={`absolute right-4 top-3.5 ${
                      item.accentCard ? "text-white" : "text-[#fb7185]"
                    }`}
                  />
                  <dd className="mt-2 text-2xl font-extrabold tabular-nums sm:text-3xl">
                    {item.value}
                  </dd>
                  <p
                    className={`mt-1 text-[11px] ${
                      item.accentCard ? "text-zinc-200" : "text-zinc-500"
                    }`}
                  >
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
          <section className="rounded-3xl border border-dashed border-[#3a1d24] bg-[#101014] p-10 text-center">
            <h2 className="text-lg font-bold text-white">ยังไม่สามารถแสดงยอดเรื่องค้างได้</h2>
            <p className="mt-2 text-sm text-zinc-400">
              กรุณาตรวจสอบการเชื่อมต่อและโครงสร้างฐานข้อมูล ระบบไม่แสดงศูนย์แทนข้อผิดพลาด
            </p>
            <Link
              href={currentHref}
              className="mt-5 inline-block rounded-full bg-gradient-to-r from-[#be123c] to-[#881337] px-5 py-3 text-sm font-bold text-white"
            >
              ลองใหม่
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
