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
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardRefreshButton } from "@/components/dashboard/DashboardRefreshButton";
import {
  OWNER_EMBLEM,
  OWNER_NAME,
  OWNER_ORG_TH,
  OWNER_PHOTO,
  OWNER_ROLE,
} from "@/lib/owner";
import {
  RefreshCw,
  Scale,
  Zap,
  ChevronsRight,
  Settings,
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
    <div className="min-h-full bg-[#0a0a0c] px-3 py-5 text-white sm:px-6 sm:py-6 xl:px-8">
      <div className="mx-auto max-w-[1560px] space-y-7">
        {/* CYBER Header: Top Capsule Bar + Clean Hero Row */}
        <header className="space-y-7 pt-1">
          {/* Top Row: Brand Left + Capsule Nav Center + Circular Icons & Cutout Avatar Right */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left Brand: Official GPC Emblem + Owner Name & Role */}
            <Link href="/dashboard" className="flex items-center gap-3 group transition-opacity hover:opacity-95">
              <div className="relative h-11 w-11 shrink-0">
                <Image
                  src={OWNER_EMBLEM}
                  alt="ตราสัญลักษณ์ ก.พ.ค.ตร."
                  fill
                  sizes="44px"
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight text-white sm:text-base">
                  {OWNER_NAME}
                </p>
                <p className="mt-0.5 text-xs font-medium text-zinc-400">
                  {OWNER_ROLE}
                </p>
              </div>
            </Link>

            {/* Center Floating Capsule Navigation (Only active pill in Police Red) */}
            <nav
              aria-label="ไปยังทะเบียน"
              className="flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-[#121215] p-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.65)]"
            >
              {[
                { key: "all", label: "Dashboard" },
                { key: "complaint", label: "เรื่องร้องทุกข์" },
                { key: "appeal", label: "เรื่องอุทธรณ์" },
              ].map((pill) => {
                const active = filters.type === pill.key;
                return (
                  <Link
                    key={pill.key}
                    href={`/dashboard?type=${pill.key}`}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-gradient-to-b from-[#d62839] to-[#991b1b] text-white shadow-[0_4px_14px_rgba(185,28,28,0.45)]"
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
                  className="hidden md:inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:text-white"
                >
                  <span>สารบบ{section.title}</span>
                  <span className="text-[11px] font-semibold tabular-nums text-zinc-300">
                    ({number.format(section.snapshot.kpis.active)})
                  </span>
                </a>
              ))}
              {canUseAnalysis && (
                <Link
                  href="/analysis"
                  className="hidden lg:inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:text-white"
                >
                  <span>วิเคราะห์สำนวน</span>
                </Link>
              )}
            </nav>

            {/* Right: Filter Form + Circular Action Icons + Person-Only Cutout Avatar on Police Red */}
            <div className="flex items-center gap-2.5">
              <form action="/dashboard" className="hidden sm:flex items-center gap-1.5">
                <label className="sr-only" htmlFor="dashboard-type-select">
                  ประเภททะเบียน
                </label>
                <select
                  id="dashboard-type-select"
                  name="type"
                  defaultValue={filters.type}
                  aria-label="ประเภททะเบียน"
                  className="rounded-full border border-white/10 bg-[#121215] px-3 py-1.5 text-xs font-medium text-zinc-300 focus-visible:outline-2 focus-visible:outline-[#c81e2b]"
                >
                  <option value="all">ร้องทุกข์และอุทธรณ์</option>
                  <option value="complaint">ร้องทุกข์</option>
                  <option value="appeal">อุทธรณ์</option>
                </select>
                <button className="rounded-full border border-white/10 bg-[#18181d] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#222228]">
                  แสดงผล
                </button>
              </form>
              <ThemeToggle />
              <DashboardRefreshButton />
              {canUseAnalysis && (
                <Link
                  href="/analysis"
                  title="ระบบวิเคราะห์และร่างคำวินิจฉัย"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#121215] text-zinc-300 transition hover:border-white/20 hover:text-white"
                >
                  <Settings size={15} aria-hidden="true" />
                </Link>
              )}
              <div
                title={`${OWNER_NAME} ${OWNER_ROLE}`}
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#991b1b] ring-2 ring-white/20"
              >
                <Image
                  src={OWNER_PHOTO}
                  alt={OWNER_NAME}
                  fill
                  sizes="48px"
                  className="rounded-full object-cover object-[50%_15%]"
                />
              </div>
            </div>
          </div>

          {/* Hero Overview Row: Left Title & Executive Identity + Right 3D Fanned Account Insights Deck */}
          <div className="grid grid-cols-1 gap-8 pt-2 lg:grid-cols-12 lg:items-end">
            {/* Left (5 cols): Clean Typography matching CYBER Tablet Template */}
            <div className="lg:col-span-5 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Data Based on all registries · ทะเบียนคุมสำนวน ก.พ.ค.ตร.
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Dashboard Overview
              </h1>
              <p className="pt-1 text-sm font-medium text-zinc-300">
                <strong className="font-semibold text-white whitespace-nowrap">{OWNER_NAME}</strong>{" "}
                <span className="text-zinc-500">·</span>{" "}
                <span className="text-zinc-400">{OWNER_ROLE}</span>
              </p>
            </div>

            {/* Right (7 cols): 3D Fanned "Account Insights" Cards (Faithful to CYBER Template) */}
            <div className="relative flex items-center justify-start py-2 lg:col-span-7 lg:pl-6">
              <div className="relative w-full max-w-[600px]">
                {/* Far Back Fanned Card 4 */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-5 right-0 hidden w-[64%] translate-x-10 rotate-[12deg] rounded-[1.5rem] cyber-insight-back p-5 opacity-60 sm:block"
                />
                {/* Back Fanned Card 3 */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-3 right-6 hidden w-[68%] translate-x-6 rotate-[8deg] rounded-[1.5rem] cyber-insight-back p-5 opacity-85 sm:block"
                >
                  <div className="flex justify-end text-zinc-500">
                    <ChevronsRight size={15} />
                  </div>
                  <p className="mt-9 text-right text-sm font-medium opacity-40">
                    ...สำนวน
                  </p>
                  <p className="mt-1 text-right text-sm font-medium opacity-40">
                    ...วินิจฉัย
                  </p>
                </div>
                {/* Middle Fanned Card 2 */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-1.5 right-14 hidden w-[72%] translate-x-3 rotate-[4deg] rounded-[1.5rem] cyber-insight-back p-5 sm:block"
                >
                  <div className="flex justify-end text-[#dc2626]/70">
                    <ChevronsRight size={16} />
                  </div>
                  <p className="mt-8 text-right text-base font-medium opacity-50">
                    ...ดำเนินการ
                  </p>
                  <p className="mt-1 text-right text-base font-medium opacity-50">
                    ...สำเร็จ
                  </p>
                </div>

                {/* Front Active Fanned Card 1 */}
                <Link href="/cases" title="คลิกเพื่อดูรายการคดีทั้งหมด" className="cyber-insight-front group/card relative z-10 block w-full sm:w-[76%] sm:-rotate-[2deg] rounded-[1.5rem] p-6 transition-transform duration-300 hover:rotate-0 hover:shadow-2xl cursor-pointer text-inherit">
                  <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Zap size={13} className="text-[#dc2626]" aria-hidden="true" />
                      <span>Account Insights</span>
                    </span>
                    <ChevronsRight size={16} className="text-[#dc2626] transition-transform duration-200 group-hover/card:translate-x-1" aria-hidden="true" />
                  </div>

                  <p className="mt-4 text-base font-normal leading-relaxed text-zinc-300 sm:text-[19px] sm:leading-[1.45]">
                    ผลการพิจารณาวินิจฉัยสะสมดำเนินการแล้วเสร็จ{" "}
                    <strong className="font-bold text-white">
                      {number.format(completedCount)}/{number.format(snapshot?.totalCases ?? 0)} เรื่อง
                    </strong>{" "}
                    <span className="inline-block rounded-md bg-[#991b1b] px-2 py-0.5 text-xs font-bold text-white shadow">
                      +{completionPct}%
                    </span>
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] pt-3 text-[11px] text-zinc-400">
                    <span>
                      คงค้างดำเนินการ{" "}
                      <strong className="font-semibold text-white">
                        {number.format(snapshot?.kpis.active ?? 0)} เรื่อง
                      </strong>
                    </span>
                    <span>
                      อัปเดต{" "}
                      {snapshot?.dataFreshness
                        ? dateTime.format(new Date(snapshot.dataFreshness))
                        : "ล่าสุด"}
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {result.source === "demo" && (
          <div
            role="status"
            className="rounded-xl border border-white/10 bg-[#121215] px-4 py-2 text-xs text-zinc-300"
          >
            ข้อมูลสาธิตนิรนาม — ไม่ใช่จำนวนเรื่องจริง
          </div>
        )}
        {result.state !== "ready" && (
          <div
            role="status"
            className="rounded-xl border border-white/10 bg-[#121215] p-4 text-sm text-zinc-300"
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
          <section className="rounded-3xl border border-dashed border-white/15 bg-[#121215] p-10 text-center">
            <h2 className="text-lg font-bold text-white">ยังไม่สามารถแสดงยอดเรื่องค้างได้</h2>
            <p className="mt-2 text-sm text-zinc-400">
              กรุณาตรวจสอบการเชื่อมต่อและโครงสร้างฐานข้อมูล ระบบไม่แสดงศูนย์แทนข้อผิดพลาด
            </p>
            <Link
              href={currentHref}
              className="mt-5 inline-block rounded-full bg-gradient-to-b from-[#d62839] to-[#991b1b] px-5 py-3 text-sm font-bold text-white"
            >
              ลองใหม่
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
