export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  Database,
  FileWarning,
  RefreshCw,
  ShieldAlert,
  UserRoundX,
} from "lucide-react";
import { requirePermission } from "@/lib/auth/requirePermission";
import { hasPermission } from "@/lib/auth/permissions";
import { getUnifiedDashboardData } from "@/lib/dashboard/data";
import { parseDashboardFilters } from "@/lib/dashboard/metrics";
import type { DashboardSnapshot } from "@/lib/dashboard/types";

const number = new Intl.NumberFormat("th-TH");
const dateTime = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(new Date(value));
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = "navy",
}: {
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  tone?: "navy" | "red" | "amber" | "teal";
}) {
  const tones = {
    navy: "border-slate-200 bg-white text-slate-950",
    red: "border-red-200 bg-red-50/70 text-red-950",
    amber: "border-amber-200 bg-amber-50/70 text-amber-950",
    teal: "border-teal-200 bg-teal-50/70 text-teal-950",
  };
  const iconTones = {
    navy: "bg-slate-100 text-slate-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    teal: "bg-teal-100 text-teal-700",
  };
  return (
    <article className={`min-w-0 rounded-2xl border p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span className={`rounded-xl p-2 ${iconTones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-5 text-4xl font-bold tracking-tight tabular-nums">{number.format(value)}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>
    </article>
  );
}

function Panel({ title, description, children, className = "" }: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:p-6 ${className}`}>
      <div className="mb-5">
        <h2 className="text-lg font-bold tracking-tight text-slate-950">{title}</h2>
        {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function TrendChart({ data }: { data: DashboardSnapshot["trend"] }) {
  const max = Math.max(...data.map((item) => item.count), 1);
  const points = data.map((item, index) => ({
    ...item,
    x: 26 + (index * 608) / Math.max(data.length - 1, 1),
    y: 178 - (item.count / max) * 132,
  }));
  const polyline = points.map(({ x, y }) => `${x},${y}`).join(" ");
  return (
    <figure aria-labelledby="trend-caption">
      <svg viewBox="0 0 660 210" role="img" aria-label="กราฟจำนวนคดีรับเข้า 12 เดือน" className="h-auto w-full overflow-visible">
        {[46, 90, 134, 178].map((y) => <line key={y} x1="26" y1={y} x2="634" y2={y} stroke="#e2e8f0" strokeWidth="1" />)}
        <path d={`M 26 178 L ${polyline} L 634 178 Z`} fill="#ccfbf1" opacity="0.7" />
        <polyline points={polyline} fill="none" stroke="#0f766e" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point) => (
          <g key={point.key}>
            <circle cx={point.x} cy={point.y} r="5" fill="#fff" stroke="#0f766e" strokeWidth="3" />
            <text x={point.x} y={Math.max(point.y - 12, 18)} textAnchor="middle" className="fill-slate-700 text-[11px] font-semibold">{point.count}</text>
          </g>
        ))}
      </svg>
      <figcaption id="trend-caption" className="grid grid-cols-6 gap-y-2 text-center text-[10px] text-slate-500 sm:grid-cols-12 sm:text-xs">
        {data.map((item) => <span key={item.key}>{item.label}</span>)}
      </figcaption>
    </figure>
  );
}

function BarList({ data }: { data: Array<{ label: string; count: number; tone?: string }> }) {
  const max = Math.max(...data.map((item) => item.count), 1);
  const colors: Record<string, string> = { red: "bg-red-500", amber: "bg-amber-500", teal: "bg-teal-600", blue: "bg-blue-600", slate: "bg-slate-400" };
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-slate-600">{item.label}</span>
            <strong className="tabular-nums text-slate-950">{number.format(item.count)}</strong>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
            <div className={`h-full rounded-full ${colors[item.tone ?? "teal"]}`} style={{ width: `${Math.max((item.count / max) * 100, item.count ? 4 : 0)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StateNotice({ state, message, reasons }: { state: string; message?: string; reasons?: string[] }) {
  if (state === "ready") return null;
  const danger = state === "unavailable" || (state === "partial" && !reasons?.length);
  return (
    <div role="status" className={`rounded-2xl border px-5 py-4 text-sm ${danger ? "border-red-200 bg-red-50 text-red-900" : state === "empty" ? "border-slate-200 bg-white text-slate-700" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
      <div className="flex items-start gap-3">
        {danger ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /> : <Database className="mt-0.5 h-5 w-5 shrink-0" />}
        <div>
          <p className="font-semibold">{message || (state === "empty" ? "ยังไม่มีข้อมูลตามตัวกรองที่เลือก" : "ข้อมูลบางส่วนยังไม่พร้อม")}</p>
          {reasons?.length ? <p className="mt-1">ส่วนที่ไม่พร้อม: {reasons.join(", ")}</p> : null}
          {danger ? <p className="mt-1 text-xs opacity-80">ระบบไม่แสดงค่า KPI เป็นศูนย์แทนข้อผิดพลาด กรุณาตรวจสอบฐานข้อมูลแล้วลองใหม่</p> : null}
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ period?: string; type?: string }> }) {
  const user = await requirePermission("VIEW_DASHBOARD");
  const filters = parseDashboardFilters(await searchParams);
  const result = await getUnifiedDashboardData(filters, {
    canViewCaseDetails: hasPermission(user.role, "VIEW_CASE_DETAIL"),
    canViewDataQuality: hasPermission(user.role, "VIEW_DATA_QUALITY"),
  });
  const snapshot = result.snapshot;
  const currentHref = `/dashboard?period=${filters.period}&type=${filters.type}`;

  return (
    <div className="min-h-full bg-[#f5f7fa] px-3 py-5 sm:px-6 sm:py-7 xl:px-10">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="overflow-hidden rounded-3xl bg-[linear-gradient(125deg,#07162d_0%,#102b4e_58%,#0f766e_140%)] px-5 py-6 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide text-cyan-100">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">ศูนย์บัญชาการข้อมูลคดี</span>
                {result.source === "demo" && <span className="rounded-full bg-amber-300 px-3 py-1 text-amber-950">PREVIEW · ข้อมูลสังเคราะห์นิรนาม</span>}
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">ภาพรวมการบริหารสำนวน</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">มองเห็นปริมาณงาน ความเสี่ยงด้านเวลา ภาระงาน และคุณภาพข้อมูลจากนิยามกลางชุดเดียว</p>
            </div>
            <form className="grid w-full gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:grid-cols-[1fr_1fr_auto] xl:w-auto" action="/dashboard">
              <label className="text-xs font-medium text-slate-200">ช่วงเวลา
                <select name="period" defaultValue={filters.period} className="mt-1.5 block w-full min-w-36 rounded-xl border border-white/15 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300">
                  <option value="all">ทั้งหมด</option><option value="month">เดือนนี้</option><option value="quarter">ไตรมาสนี้</option><option value="fiscal-year">ปีงบประมาณนี้</option>
                </select>
              </label>
              <label className="text-xs font-medium text-slate-200">ประเภทคดี
                <select name="type" defaultValue={filters.type} className="mt-1.5 block w-full min-w-36 rounded-xl border border-white/15 bg-slate-950/40 px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300">
                  <option value="all">ทุกประเภท</option><option value="complaint">ร้องทุกข์</option><option value="appeal">อุทธรณ์</option>
                </select>
              </label>
              <button type="submit" className="self-end rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-white">แสดงผล</button>
            </form>
          </div>
        </header>

        <StateNotice state={result.state} message={result.message} reasons={result.partialReasons} />

        {snapshot && (
          <>
            <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>ข้อมูลล่าสุด {snapshot.dataFreshness ? dateTime.format(new Date(snapshot.dataFreshness)) : "ยังไม่มีเวลาอัปเดต"} · สร้างภาพรวม {dateTime.format(new Date(snapshot.generatedAt))}</p>
              <Link href={currentHref} className="inline-flex w-fit items-center gap-2 rounded-lg px-2 py-1.5 font-semibold text-teal-700 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-600"><RefreshCw className="h-3.5 w-3.5" /> รีเฟรชข้อมูล</Link>
            </div>

            <section aria-label="ตัวชี้วัดสำคัญ" className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-5">
              <KpiCard label="คดีที่ยังดำเนินการ" value={snapshot.kpis.active} hint={`จากทั้งหมด ${number.format(snapshot.totalCases)} คดี`} icon={<BriefcaseBusiness className="h-5 w-5" />} />
              <KpiCard label="คดีเกินกำหนด" value={snapshot.kpis.overdue} hint="ใช้วันครบกำหนดที่ใกล้ที่สุด" icon={<AlertTriangle className="h-5 w-5" />} tone="red" />
              <KpiCard label="ครบกำหนดใน 7 วัน" value={snapshot.kpis.dueWithin7Days} hint="ควรติดตามล่วงหน้า" icon={<Clock3 className="h-5 w-5" />} tone="amber" />
              <KpiCard label="ยังไม่มอบหมายนิติกร" value={snapshot.kpis.unassigned} hint="เฉพาะคดีที่ยังดำเนินการ" icon={<UserRoundX className="h-5 w-5" />} tone="teal" />
              <KpiCard label="ปัญหาข้อมูล Critical" value={snapshot.kpis.criticalDataQuality} hint="เลขแดงและสถานะไม่สอดคล้อง" icon={<FileWarning className="h-5 w-5" />} tone={snapshot.kpis.criticalDataQuality ? "red" : "navy"} />
            </section>

            <div className="grid min-w-0 gap-6 xl:grid-cols-[1.55fr_1fr]">
              <Panel title="แนวโน้มคดีรับเข้า 12 เดือน" description="นับจากวันที่รับเรื่องเท่านั้น รายการที่ไม่มีวันที่จะไม่ถูกเดาจากวันแก้ไขล่าสุด"><TrendChart data={snapshot.trend} /></Panel>
              <div className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
                <Panel title="สัดส่วนสถานะ" description="จัดกลุ่มสถานะหลายรูปแบบด้วยกฎกลาง"><BarList data={snapshot.statusDistribution} /></Panel>
                <Panel title="ความเสี่ยงด้านเวลา" description="ไม่นับคดีปิดหรือมีเลขแดง"><BarList data={snapshot.deadlineRisk} /></Panel>
              </div>
            </div>

            <Panel title="ภาระงานนิติกร" description="เรียงตามคดีที่ยังดำเนินการมากที่สุด">
              {snapshot.workload.length ? <div className="space-y-4">{snapshot.workload.map((officer) => {
                const width = Math.max(...snapshot.workload.map((item) => item.active), 1);
                return <div key={officer.name} className="grid gap-2 sm:grid-cols-[minmax(9rem,1fr)_2fr_auto] sm:items-center">
                  <span className="truncate text-sm font-semibold text-slate-800">{officer.name}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-teal-600 to-cyan-500" style={{ width: `${(officer.active / width) * 100}%` }} /></div>
                  <div className="flex gap-3 whitespace-nowrap text-xs text-slate-500"><strong className="text-slate-900">{officer.active} คดี</strong><span className="text-red-600">เกิน {officer.overdue}</span><span className="text-amber-700">ใกล้ {officer.dueSoon}</span></div>
                </div>;
              })}</div> : <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">ยังไม่มีข้อมูลภาระงาน</p>}
            </Panel>

            <Panel title="คดีเร่งด่วน" description="เกินกำหนดและครบกำหนดภายใน 7 วัน เรียงจากเร่งด่วนที่สุด">
              {snapshot.urgentCases.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">เลขคดี</th><th className="px-3 py-3">เรื่อง</th><th className="px-3 py-3">ผู้รับผิดชอบ</th><th className="px-3 py-3">วันครบกำหนด</th><th className="px-3 py-3 text-right">ความเสี่ยง</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{snapshot.urgentCases.map((item) => <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-3 py-4"><Link href={`/cases/${item.id}`} className="font-bold text-teal-700 hover:underline">{item.blackNumber}</Link><div className="mt-1 text-xs text-slate-500">{item.type}</div></td>
                  <td className="max-w-xs px-3 py-4"><p className="truncate font-medium text-slate-800">{item.subject}</p><p className="mt-1 truncate text-xs text-slate-500">{item.status}</p></td>
                  <td className="px-3 py-4 text-slate-600">{item.legalOfficer}</td><td className="px-3 py-4 text-slate-600">{formatDate(item.dueDate)}</td>
                  <td className="px-3 py-4 text-right"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${item.daysUntilDue < 0 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}`}>{item.daysUntilDue < 0 ? `เกิน ${Math.abs(item.daysUntilDue)} วัน` : item.daysUntilDue === 0 ? "ครบกำหนดวันนี้" : `เหลือ ${item.daysUntilDue} วัน`}</span></td>
                </tr>)}</tbody>
              </table></div> : <p className="rounded-xl bg-teal-50 p-6 text-center text-sm font-medium text-teal-800">ไม่มีคดีเกินกำหนดหรือครบกำหนดภายใน 7 วัน</p>}
            </Panel>

            <div className="grid min-w-0 gap-6 xl:grid-cols-3">
              <Panel title="คุณภาพข้อมูล" description="ช่องว่างที่ต้องแก้ไข ไม่เติมค่าด้วยการคาดเดา">
                <ul className="space-y-3 text-sm">{[
                  ["ไม่มีวันที่รับเรื่อง", snapshot.dataQuality.missingReceivedDate], ["ประเภทคดีไม่มาตรฐาน", snapshot.dataQuality.unknownType], ["ปิดแล้วแต่ไม่มีเลขแดง", snapshot.dataQuality.closedWithoutRedNumber], ["มีเลขแดงแต่สถานะยังเปิด", snapshot.dataQuality.redNumberWithOpenStatus], ["คดีเปิดที่ไม่มีวันครบกำหนด", snapshot.dataQuality.noDueDate],
                ].map(([label, value]) => <li key={String(label)} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2.5"><span className="text-slate-600">{label}</span><strong className="tabular-nums text-slate-950">{value}</strong></li>)}</ul>
                {hasPermission(user.role, "VIEW_DATA_QUALITY") && <Link href="/data-quality" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-teal-700 hover:underline">เปิดศูนย์คุณภาพข้อมูล <span aria-hidden>→</span></Link>}
              </Panel>
              <Panel title="กิจกรรมล่าสุด" description="ความเคลื่อนไหวที่บันทึกในระบบ">
                {snapshot.activities.length ? <ol className="space-y-4">{snapshot.activities.map((item) => <li key={item.id} className="flex gap-3"><span className="mt-1 rounded-full bg-teal-100 p-1.5 text-teal-700"><Activity className="h-3.5 w-3.5" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{item.action}</p><p className="mt-1 truncate text-xs text-slate-500">{item.blackNumber} · {item.actor}</p><time className="mt-1 block text-[11px] text-slate-400">{dateTime.format(new Date(item.timestamp))}</time></div></li>)}</ol> : <p className="text-sm text-slate-500">ยังไม่มีกิจกรรมล่าสุด</p>}
              </Panel>
              <Panel title="การประชุมที่กำลังจะมาถึง" description="กำหนดการและจำนวนสำนวนในวาระ">
                {snapshot.meetings.length ? <ol className="space-y-4">{snapshot.meetings.map((item) => <li key={item.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-start gap-3"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.meetingNo} · {formatDate(item.meetingDate)}</p><p className="mt-2 text-xs font-semibold text-teal-700">{item.caseCount} สำนวนในวาระ</p></div></div></li>)}</ol> : <p className="text-sm text-slate-500">ยังไม่มีกำหนดการประชุม</p>}
              </Panel>
            </div>
          </>
        )}

        {!snapshot && <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center"><ShieldAlert className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-4 text-lg font-bold text-slate-900">Dashboard ยังไม่พร้อมแสดงผล</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">ระบบรักษาความถูกต้องของตัวเลขไว้ จึงไม่แสดง KPI จนกว่าจะเชื่อมต่อฐานข้อมูลและตรวจ schema สำเร็จ</p><Link href={currentHref} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"><RefreshCw className="h-4 w-4" /> ลองใหม่</Link></div>}
      </div>
    </div>
  );
}
