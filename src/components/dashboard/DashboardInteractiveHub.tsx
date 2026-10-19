"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import {
  Search,
  Scale,
  ArrowUpRight,
  AlertTriangle,
  Users,
  Sparkles,
  Activity,
  FolderSearch,
  ShieldAlert,
  TrendingUp,
  BarChart3,
  Gauge,
} from "lucide-react";

const numberFmt = new Intl.NumberFormat("th-TH");
const pctFmt = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 });
const dateFmt = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" });

interface RegistrySectionItem {
  title: string;
  snapshot: DashboardSnapshot;
  accent: "teal" | "blue";
}

interface DashboardInteractiveHubProps {
  snapshot: DashboardSnapshot;
  sections: RegistrySectionItem[];
  canViewDetails: boolean;
  canUseAnalysis: boolean;
}

type HubTab = "compare" | "explorer" | "officers" | "urgent";
type OfficerSort = "total" | "pending" | "completed" | "rate";

/** Build a smooth cubic-bezier SVG path from (x,y) points */
function buildSmoothWavePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX.toFixed(1)} ${p0.y.toFixed(1)}, ${midX.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return d;
}

export function DashboardInteractiveHub({
  snapshot,
  sections,
  canViewDetails,
  canUseAnalysis,
}: DashboardInteractiveHubProps) {
  const [activeTab, setActiveTab] = useState<HubTab>("compare");
  const [query, setQuery] = useState("");
  const [selectedRegistry, setSelectedRegistry] = useState<"all" | "ร้องทุกข์" | "อุทธรณ์">("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedOfficer, setSelectedOfficer] = useState<string>("all");
  const [officerSort, setOfficerSort] = useState<OfficerSort>("pending");
  const [officerSearch, setOfficerSearch] = useState("");

  const allBacklogCases = useMemo(() => {
    return sections.flatMap((sec) =>
      sec.snapshot.backlog.cases.map((c) => ({
        ...c,
        registryTitle: sec.title,
        registryKind: (sec.accent === "teal" ? "ร้องทุกข์" : "อุทธรณ์") as "ร้องทุกข์" | "อุทธรณ์",
        accent: sec.accent,
      })),
    );
  }, [sections]);

  const availableYears = useMemo(() => {
    const set = new Set<string>();
    for (const item of allBacklogCases) {
      if (item.year) set.add(item.year);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "th"));
  }, [allBacklogCases]);

  const availableOfficers = useMemo(() => {
    const set = new Set<string>();
    for (const item of allBacklogCases) {
      if (item.officer) set.add(item.officer);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "th"));
  }, [allBacklogCases]);

  const filteredCases = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allBacklogCases.filter((item) => {
      if (selectedRegistry !== "all" && item.registryKind !== selectedRegistry) return false;
      if (selectedYear !== "all" && item.year !== selectedYear) return false;
      if (selectedOfficer !== "all" && item.officer !== selectedOfficer) return false;
      if (!q) return true;
      return (
        item.blackNumber.toLowerCase().includes(q) ||
        item.petitionerName.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.proceeding.toLowerCase().includes(q) ||
        item.officer.toLowerCase().includes(q) ||
        item.year.toLowerCase().includes(q)
      );
    });
  }, [allBacklogCases, query, selectedRegistry, selectedYear, selectedOfficer]);

  const sortedOfficers = useMemo(() => {
    const q = officerSearch.trim().toLowerCase();
    const list = snapshot.officerPerformance.filter((o) =>
      q ? o.name.toLowerCase().includes(q) : true,
    );
    return [...list].sort((a, b) => {
      if (officerSort === "pending") return b.pending - a.pending || b.total - a.total;
      if (officerSort === "completed") return b.completed - a.completed || b.total - a.total;
      if (officerSort === "rate") return b.completionPercent - a.completionPercent || b.total - a.total;
      return b.total - a.total;
    });
  }, [snapshot.officerPerformance, officerSort, officerSearch]);

  const maxOfficerTotal = useMemo(
    () => Math.max(...snapshot.officerPerformance.map((o) => o.total), 1),
    [snapshot.officerPerformance],
  );

  const selectOfficerAndInspect = (officerName: string) => {
    setSelectedOfficer(officerName);
    setActiveTab("explorer");
  };

  // Metrics for CYBER 3-column charts
  const totalCases = snapshot.totalCases;
  const activeCases = snapshot.kpis.active;
  const completedCases = Math.max(0, totalCases - activeCases);
  const urgentOrUnassigned = snapshot.kpis.overdue + snapshot.kpis.dueWithin7Days + snapshot.kpis.unassigned;
  const completedPct = totalCases > 0 ? (completedCases / totalCases) * 100 : 0;
  const activePct = totalCases > 0 ? (activeCases / totalCases) * 100 : 0;
  const needleAngle = -90 + (Math.min(100, Math.max(0, completedPct)) / 100) * 180;

  // Aggregate year series for Dual Wave Chart & Performance Overview
  const yearSeries = useMemo(() => {
    const map = new Map<string, { label: string; completed: number; pending: number }>();
    for (const sec of sections) {
      for (const row of sec.snapshot.backlog.byYearCompletion) {
        const existing = map.get(row.label) ?? { label: row.label, completed: 0, pending: 0 };
        existing.completed += row.completed;
        existing.pending += row.pending;
        map.set(row.label, existing);
      }
    }
    const arr = Array.from(map.values());
    if (arr.length === 0) {
      return [
        { label: "พ.ศ. 2566", completed: 0, pending: 0 },
        { label: "พ.ศ. 2567", completed: 0, pending: 0 },
        { label: "พ.ศ. 2568", completed: 0, pending: 0 },
      ];
    }
    return arr;
  }, [sections]);

  const waveMax = Math.max(
    ...yearSeries.map((y) => Math.max(y.completed, y.pending, y.completed + y.pending)),
    4,
  );

  // Top 6 officers for Vertical Gradient Pillar Chart ("Operations" style)
  const topPillarOfficers = useMemo(() => {
    const ranked = snapshot.officerPerformance.filter((o) => !o.unassigned).slice(0, 6);
    return ranked;
  }, [snapshot.officerPerformance]);

  const topPillarMax = Math.max(...topPillarOfficers.map((o) => o.total), 1);
  const highestPendingIdx = useMemo(() => {
    if (!topPillarOfficers.length) return 0;
    let bestIdx = 0;
    for (let i = 1; i < topPillarOfficers.length; i++) {
      if (topPillarOfficers[i].total > topPillarOfficers[bestIdx].total) {
        bestIdx = i;
      }
    }
    return bestIdx;
  }, [topPillarOfficers]);

  return (
    <section
      aria-label="ศูนย์ควบคุมและสำรวจข้อมูลเชิงโต้ตอบ"
      className="rounded-[2rem] border border-[#2d1a20] bg-[#0e0e12] p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] sm:p-7"
    >
      {/* Top Header & CYBER Capsule Tabs */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#fb7185]">
            Case & Registry Intelligence
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">
            ศูนย์วิเคราะห์กราฟไล่ระดับและติดตามสำนวนเชิงโต้ตอบ
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="มุมมองศูนย์วิเคราะห์แดชบอร์ด"
          className="flex flex-wrap gap-1.5 rounded-full border border-white/10 bg-[#14141b] p-1.5"
        >
          {[
            { id: "compare" as const, label: "กราฟวิเคราะห์ภาพรวม (Overview)", icon: Gauge },
            {
              id: "explorer" as const,
              label: `ค้นหาเรื่องค้าง (${numberFmt.format(allBacklogCases.length)})`,
              icon: FolderSearch,
            },
            {
              id: "officers" as const,
              label: `ตารางภาระงานนิติกร (${numberFmt.format(snapshot.officerPerformance.length)})`,
              icon: Users,
            },
            {
              id: "urgent" as const,
              label: `เร่งด่วน & ความเคลื่อนไหว`,
              icon: Activity,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
                  active
                    ? "bg-gradient-to-r from-[#be123c] via-[#991b1b] to-[#6b111b] text-white shadow-[0_8px_20px_-6px_rgba(225,29,72,0.65)]"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={15} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: CYBER 3-COLUMN GRADIENT CHARTS + PERFORMANCE OVERVIEW + RECENT ALERTS */}
      {activeTab === "compare" && (
        <div className="mt-6 space-y-6">
          {/* 3-Column CYBER Intelligence Row */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* CARD 1: Semi-Circular Segmented Gauge + Needle ("Firewall Activity" style) */}
            <article className="flex flex-col justify-between rounded-3xl border border-[#2f1d22] bg-[radial-gradient(120%_100%_at_50%_105%,rgba(153,27,27,0.22)_0%,rgba(19,19,25,0.98)_75%)] p-5 shadow-xl">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#4c1d24] bg-[#be123c]/15 text-[#fb7185]">
                    <Gauge size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">สัดส่วนผลการพิจารณา</h3>
                    <p className="text-[11px] text-zinc-400">Segmented Completion Gauge</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-zinc-400">ทะเบียนรวม</span>
                  <p className="text-2xl font-extrabold tabular-nums text-white">
                    {numberFmt.format(totalCases)}
                  </p>
                </div>
              </div>

              {/* Semi-Circular Segmented Gauge SVG with Rotating Needle */}
              <div className="relative mx-auto my-2 w-full max-w-[280px]">
                <svg viewBox="0 0 240 145" className="w-full overflow-visible" aria-hidden="true">
                  <defs>
                    <linearGradient id="policeMaroonArc" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7f1d1d" />
                      <stop offset="55%" stopColor="#be123c" />
                      <stop offset="100%" stopColor="#fb7185" />
                    </linearGradient>
                    <linearGradient id="amberArc" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#fde68a" />
                    </linearGradient>
                    <linearGradient id="needleMetal" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#71717a" />
                    </linearGradient>
                  </defs>

                  {/* Background Track */}
                  <path
                    d="M 24 122 A 96 96 0 0 1 216 122"
                    fill="none"
                    stroke="#24242e"
                    strokeWidth="20"
                    strokeLinecap="round"
                  />

                  {/* Completed Segment (Police Maroon -> Crimson Gradient) */}
                  <path
                    d="M 24 122 A 96 96 0 0 1 216 122"
                    fill="none"
                    stroke="url(#policeMaroonArc)"
                    strokeWidth="20"
                    pathLength="100"
                    strokeDasharray={`${Math.max(completedPct - 1.5, 0)} 100`}
                    strokeLinecap="round"
                  />

                  {/* Pending Segment (Rose-Amber) */}
                  {activePct > 0 && (
                    <path
                      d="M 24 122 A 96 96 0 0 1 216 122"
                      fill="none"
                      stroke="url(#amberArc)"
                      strokeWidth="20"
                      pathLength="100"
                      strokeDasharray={`${Math.max(activePct - 1.5, 0)} 100`}
                      strokeDashoffset={-completedPct}
                    />
                  )}

                  {/* Percentage Labels along Arc */}
                  <text x="58" y="55" fill="#fff" fontSize="10" fontWeight="700">
                    {pctFmt.format(completedPct)}%
                  </text>
                  <text x="172" y="68" fill="#fde68a" fontSize="10" fontWeight="700">
                    {pctFmt.format(activePct)}%
                  </text>

                  {/* Center Badge above Needle Hub */}
                  <g transform="translate(120, 76)">
                    <rect
                      x="-26"
                      y="-11"
                      width="52"
                      height="18"
                      rx="9"
                      fill="#1a1216"
                      stroke="#be123c"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="1"
                      textAnchor="middle"
                      fill="#fda4af"
                      fontSize="9.5"
                      fontWeight="700"
                    >
                      +{pctFmt.format(completedPct)}%
                    </text>
                  </g>

                  {/* Rotating Metallic Needle */}
                  <g transform={`translate(120, 122) rotate(${needleAngle})`}>
                    <polygon points="-4,0 0,-42 4,0" fill="url(#needleMetal)" />
                    <circle cx="0" cy="0" r="7" fill="#be123c" stroke="#fda4af" strokeWidth="2" />
                  </g>
                </svg>
              </div>

              {/* Bottom 3-item Legend */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[11px] text-zinc-300">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#be123c]" />
                  เสร็จสิ้น: <strong className="text-white">{numberFmt.format(completedCases)}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
                  ค้าง: <strong className="text-white">{numberFmt.format(activeCases)}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-zinc-300" />
                  เร่งด่วน/รอระบุ: <strong className="text-white">{numberFmt.format(urgentOrUnassigned)}</strong>
                </span>
              </div>
            </article>

            {/* CARD 2: Dual Smooth Spline Wave Breakdown Chart ("Breakdown" style) */}
            <article className="flex flex-col justify-between rounded-3xl border border-[#2f1d22] bg-[radial-gradient(120%_100%_at_50%_105%,rgba(153,27,27,0.22)_0%,rgba(19,19,25,0.98)_75%)] p-5 shadow-xl">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#4c1d24] bg-[#be123c]/15 text-[#fb7185]">
                    <TrendingUp size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">แนวโน้มตามปีเลขดำ (Breakdown)</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-zinc-300">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-[#e11d48]" />
                        เสร็จแล้ว: {numberFmt.format(completedCases)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-[#fcd34d]" />
                        ค้าง: {numberFmt.format(activeCases)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-zinc-400">รวมทุกปี</span>
                  <p className="text-2xl font-extrabold tabular-nums text-white">
                    {numberFmt.format(totalCases)}
                  </p>
                </div>
              </div>

              {/* Dual Smooth Wave SVG */}
              {(() => {
                const chartW = 280;
                const chartH = 110;
                const padLeft = 28;
                const padRight = 12;
                const padTop = 18;
                const padBottom = 22;
                const innerW = chartW - padLeft - padRight;
                const innerH = chartH - padTop - padBottom;

                const compPts = yearSeries.map((item, idx) => {
                  const x =
                    yearSeries.length === 1
                      ? padLeft + innerW / 2
                      : padLeft + (idx / (yearSeries.length - 1)) * innerW;
                  const y = padTop + innerH - (item.completed / waveMax) * innerH;
                  return { x, y };
                });

                const pendPts = yearSeries.map((item, idx) => {
                  const x =
                    yearSeries.length === 1
                      ? padLeft + innerW / 2
                      : padLeft + (idx / (yearSeries.length - 1)) * innerW;
                  const y = padTop + innerH - (item.pending / waveMax) * innerH;
                  return { x, y };
                });

                const compPath = buildSmoothWavePath(compPts);
                const pendPath = buildSmoothWavePath(pendPts);
                const areaPath =
                  compPts.length > 1
                    ? `${compPath} L ${compPts[compPts.length - 1].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} L ${compPts[0].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`
                    : "";

                return (
                  <div className="my-2">
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full overflow-visible" aria-hidden="true">
                      <defs>
                        <linearGradient id="crimsonWaveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#e11d48" stopOpacity="0.32" />
                          <stop offset="100%" stopColor="#e11d48" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Y-axis ticks & dashed grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const y = padTop + innerH - ratio * innerH;
                        const val = Math.round(waveMax * ratio);
                        return (
                          <g key={ratio}>
                            <line
                              x1={padLeft}
                              y1={y}
                              x2={chartW - padRight}
                              y2={y}
                              stroke="#272732"
                              strokeDasharray="2 3"
                              strokeWidth="1"
                            />
                            <text
                              x={padLeft - 6}
                              y={y + 3}
                              textAnchor="end"
                              fill="#71717a"
                              fontSize="8.5"
                            >
                              {val}
                            </text>
                          </g>
                        );
                      })}

                      {/* Glowing Area under Completed Wave */}
                      {areaPath && <path d={areaPath} fill="url(#crimsonWaveFill)" />}

                      {/* Pending Smooth Wave (Warm Gold/Amber) */}
                      <path
                        d={pendPath}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />

                      {/* Completed Smooth Wave (Police Crimson) */}
                      <path
                        d={compPath}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {/* Callout Badge in upper center */}
                      <g transform={`translate(${padLeft + innerW * 0.55}, ${padTop + 4})`}>
                        <rect
                          x="-44"
                          y="-10"
                          width="88"
                          height="18"
                          rx="9"
                          fill="#181216"
                          stroke="#be123c"
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="2"
                          textAnchor="middle"
                          fill="#fda4af"
                          fontSize="8.5"
                          fontWeight="700"
                        >
                          +{numberFmt.format(completedCases)} ({pctFmt.format(completedPct)}%)
                        </text>
                      </g>

                      {/* X-axis Year Labels */}
                      {yearSeries.map((item, idx) => {
                        const x =
                          yearSeries.length === 1
                            ? padLeft + innerW / 2
                            : padLeft + (idx / (yearSeries.length - 1)) * innerW;
                        return (
                          <text
                            key={item.label}
                            x={x}
                            y={chartH - 4}
                            textAnchor="middle"
                            fill="#a1a1aa"
                            fontSize="8.5"
                          >
                            {item.label.replace("พ.ศ. ", "")}
                          </text>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-zinc-400">
                <span>เปรียบเทียบสำนวนตามปีเลขดำ</span>
                <a
                  href="#registry-complaint"
                  className="font-bold text-[#fda4af] hover:underline"
                >
                  ดูตารางรายปี →
                </a>
              </div>
            </article>

            {/* CARD 3: Vertical Gradient Pillar Bars ("Operations" style with Lit-Up Police Maroon Pillar) */}
            <article className="flex flex-col justify-between rounded-3xl border border-[#2f1d22] bg-[radial-gradient(120%_100%_at_50%_105%,rgba(153,27,27,0.22)_0%,rgba(19,19,25,0.98)_75%)] p-5 shadow-xl">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#4c1d24] bg-[#be123c]/15 text-[#fb7185]">
                    <BarChart3 size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">ภาระงานรายนิติกร (Operations)</h3>
                    <span className="mt-1 inline-block rounded-full border border-[#4c1d24] bg-[#1a1216] px-2.5 py-0.5 text-[10px] font-bold text-[#fda4af]">
                      Top Activity
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-zinc-400">เรื่องค้างรวม</span>
                  <p className="text-2xl font-extrabold tabular-nums text-white">
                    {numberFmt.format(activeCases)}
                  </p>
                </div>
              </div>

              {/* Vertical Gradient Pillar Bars */}
              <div className="my-3 flex h-36 items-end gap-2.5 pt-6">
                <div
                  aria-hidden="true"
                  className="flex h-full flex-col justify-between text-[10px] tabular-nums text-zinc-500 pr-1"
                >
                  <span>{numberFmt.format(topPillarMax)}</span>
                  <span>{numberFmt.format(Math.round(topPillarMax / 2))}</span>
                  <span>0</span>
                </div>
                <div className="flex flex-1 items-end justify-around gap-2 h-full border-b border-white/10 pb-1">
                  {topPillarOfficers.map((off, idx) => {
                    const heightPct = Math.max(14, Math.round((off.total / topPillarMax) * 100));
                    const isHighlighted = idx === highestPendingIdx;
                    const shortName = off.name.split(" ")[0] || off.name;
                    return (
                      <button
                        key={off.name}
                        type="button"
                        onClick={() => selectOfficerAndInspect(off.name)}
                        title={`${off.name}: รับทั้งหมด ${off.total} เรื่อง (เสร็จ ${off.completed}, ค้าง ${off.pending})`}
                        className="group relative flex h-full flex-1 flex-col items-center justify-end"
                      >
                        {isHighlighted && (
                          <span className="mb-1.5 rounded-full border border-[#be123c] bg-[#1a1216] px-2 py-0.5 text-[10px] font-bold tabular-nums text-[#fda4af] shadow">
                            {pctFmt.format(off.completionPercent)}%
                          </span>
                        )}
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                            isHighlighted
                              ? "bg-gradient-to-b from-[#fda4af] via-[#e11d48] to-[#4c0519] shadow-[0_0_24px_rgba(225,29,72,0.75)] ring-1 ring-white/30"
                              : "bg-gradient-to-b from-zinc-600/55 via-zinc-700/30 to-zinc-900/10 group-hover:from-[#be123c]/70 group-hover:to-[#4c0519]/50"
                          }`}
                        />
                        <span className="mt-1.5 max-w-[54px] truncate text-[10px] font-medium text-zinc-400 group-hover:text-white">
                          {shortName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[11px]">
                <span className="text-zinc-400">คลิกแท่งกราฟเพื่อดูสำนวนรายนิติกร</span>
                <span className="font-extrabold text-emerald-400">
                  +{pctFmt.format(completedPct)}% สำเร็จ
                </span>
              </div>
            </article>
          </div>

          {/* Bottom CYBER Row: Performance Overview (Wide Left) + Recent Alerts (Right) */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Left 7 Cols: Performance Overview & Registry Comparison */}
            <div className="space-y-4 rounded-3xl border border-[#2f1d22] bg-[#121217] p-5 lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Performance Overview · เปรียบเทียบทะเบียนเรื่องร้องทุกข์และเรื่องอุทธรณ์
                  </h3>
                  <p className="text-xs text-zinc-400">
                    สัดส่วนความสำเร็จและจำนวนเรื่องค้างแยกตามประเภททะเบียนคุมสำนวน
                  </p>
                </div>
                <span className="rounded-full border border-[#4c1d24] bg-[#1a1216] px-3 py-1 text-xs font-bold text-[#fda4af]">
                  รวม {numberFmt.format(snapshot.totalCases)} เรื่อง
                </span>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                {sections.map((sec) => {
                  const total = sec.snapshot.totalCases;
                  const pending = sec.snapshot.kpis.active;
                  const done = total - pending;
                  const rate = total > 0 ? (done / total) * 100 : 0;
                  const isTeal = sec.accent === "teal";
                  return (
                    <div
                      key={sec.title}
                      className="flex flex-col justify-between rounded-2xl border border-[#3a1d24] bg-[radial-gradient(120%_100%_at_50%_105%,rgba(153,27,27,0.28)_0%,rgba(22,22,29,0.96)_75%)] p-4"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center rounded-full border border-[#be123c]/40 bg-[#be123c]/15 px-3 py-0.5 text-xs font-bold text-[#fda4af]">
                            {sec.title}
                          </span>
                          <a
                            href={isTeal ? "#registry-complaint" : "#registry-appeal"}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-300 hover:text-[#fda4af]"
                          >
                            ดูกราฟละเอียด <ArrowUpRight size={13} aria-hidden="true" />
                          </a>
                        </div>

                        <div className="mt-3 flex items-baseline justify-between">
                          <div>
                            <p className="text-xs text-zinc-400">อัตราแล้วเสร็จ</p>
                            <p className="text-2xl font-extrabold tabular-nums text-white">
                              {total > 0 ? `${pctFmt.format(rate)}%` : "—"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-zinc-400">เรื่องค้างปัจจุบัน</p>
                            <p className="text-xl font-extrabold tabular-nums text-[#fb7185]">
                              {numberFmt.format(pending)} เรื่อง
                            </p>
                          </div>
                        </div>

                        <div
                          aria-hidden="true"
                          className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-zinc-800"
                        >
                          <span
                            className="bg-gradient-to-r from-[#991b1b] via-[#e11d48] to-[#fb7185] transition-all"
                            style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                          />
                          <span
                            className="bg-amber-400 transition-all"
                            style={{ width: `${total > 0 ? (pending / total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-zinc-300">
                        <span>
                          ทั้งหมด <strong className="tabular-nums text-white">{numberFmt.format(total)}</strong>
                        </span>
                        <span className="text-emerald-400">
                          เสร็จสิ้น <strong className="tabular-nums">{numberFmt.format(done)}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRegistry(isTeal ? "ร้องทุกข์" : "อุทธรณ์");
                            setActiveTab("explorer");
                          }}
                          className="font-bold text-[#fda4af] hover:underline"
                        >
                          ค้นหาเรื่องค้าง →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Distribution Bars */}
              <div className="rounded-2xl border border-white/10 bg-[#16161d] p-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    การกระจายตามกลุ่มสถานะสำนวน
                  </h4>
                  <span className="text-xs text-zinc-400 tabular-nums">
                    ฐาน {numberFmt.format(snapshot.totalCases)} เรื่อง
                  </span>
                </div>
                <div className="mt-3 space-y-2.5">
                  {snapshot.statusDistribution.map((item) => {
                    const pct = snapshot.totalCases > 0 ? (item.count / snapshot.totalCases) * 100 : 0;
                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-zinc-300">{item.label}</span>
                          <span className="tabular-nums font-bold text-white">
                            {numberFmt.format(item.count)} เรื่อง ({pctFmt.format(pct)}%)
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#881337] via-[#be123c] to-[#fb7185]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Recent Alerts & Quick Operations (matching CYBER "Recent Alerts" panel) */}
            <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#2f1d22] bg-[#121217] p-5 lg:col-span-5">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">
                    Recent Alerts · แจ้งเตือนและทางลัดปฏิบัติการ
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("urgent")}
                    className="text-xs font-bold text-[#fda4af] hover:underline"
                  >
                    ดูทั้งหมด
                  </button>
                </div>

                {/* Alert Items matching CYBER Recent Alerts */}
                <div className="mt-4 space-y-3">
                  {snapshot.urgentCases.slice(0, 3).map((u) => (
                    <Link
                      key={u.id}
                      href={`/cases/${u.id}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#17171f] p-3.5 transition hover:border-[#be123c]/60"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#4c1d24] bg-[#be123c]/15 text-[#fb7185]">
                          <AlertTriangle size={17} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-white">
                            เรื่องดำ {u.blackNumber} · {u.type}
                          </p>
                          <p className="truncate text-[11px] text-zinc-400">
                            {u.subject} ({u.legalOfficer})
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-bold tabular-nums text-[#fb7185]">
                        {u.daysUntilDue < 0
                          ? `เกิน ${Math.abs(u.daysUntilDue)} วัน`
                          : `อีก ${u.daysUntilDue} วัน`}
                      </span>
                    </Link>
                  ))}

                  {snapshot.urgentCases.length === 0 && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#17171f] p-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#4c1d24] bg-[#be123c]/15 text-[#fb7185]">
                          <ShieldAlert size={17} aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white">
                            สถานะสำนวนค้างรวม {numberFmt.format(activeCases)} เรื่อง
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            รอระบุนิติกร {numberFmt.format(snapshot.kpis.unassigned)} เรื่อง · ตรวจคุณภาพข้อมูล{" "}
                            {numberFmt.format(snapshot.kpis.criticalDataQuality)} รายการ
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-[#fda4af]">ปัจจุบัน</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Action Grid with Police Maroon Gradient */}
              <div className="rounded-2xl border border-[#4c1d24] bg-[radial-gradient(125%_115%_at_50%_105%,rgba(185,28,28,0.42)_0%,rgba(20,20,27,0.96)_75%)] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white">ทางลัดเข้าสู่ระบบงานหลัก</p>
                  <Sparkles size={15} className="text-[#fb7185]" aria-hidden="true" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {canUseAnalysis && (
                    <Link
                      href="/analysis"
                      className="flex items-center justify-between rounded-xl bg-gradient-to-r from-[#be123c] via-[#991b1b] to-[#6b111b] px-3.5 py-2.5 text-xs font-bold text-white shadow transition hover:brightness-110"
                    >
                      <span>ระบบวิเคราะห์สำนวน</span>
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </Link>
                  )}
                  <Link
                    href="/owner"
                    className="flex items-center justify-between rounded-xl border border-[#4c1d24] bg-[#14141b] px-3.5 py-2.5 text-xs font-semibold text-zinc-100 transition hover:border-[#be123c]"
                  >
                    <span>หน้าเจ้าของเว็บไซต์</span>
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                  <Link
                    href="/cases"
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[#14141b] px-3.5 py-2.5 text-xs font-semibold text-zinc-100 transition hover:border-[#be123c]"
                  >
                    <span>รายการคดีทั้งหมด</span>
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                  <Link
                    href="/library"
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[#14141b] px-3.5 py-2.5 text-xs font-semibold text-zinc-100 transition hover:border-[#be123c]"
                  >
                    <span>คลังความรู้กฎหมาย</span>
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE PENDING CASE EXPLORER */}
      {activeTab === "explorer" && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 rounded-2xl border border-[#3a1d24] bg-[#14141b] p-4 sm:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <label htmlFor="dashboard-case-search" className="block text-xs font-bold text-zinc-300">
                ค้นหาด่วน (ชื่อผู้ร้อง / เลขดำ / เรื่อง / การดำเนินการ)
              </label>
              <div className="relative mt-1.5">
                <Search
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  id="dashboard-case-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="พิมพ์ชื่อผู้ร้อง เลขดำ เช่น 123/68 หรือคำค้น..."
                  className="w-full rounded-xl border border-[#3a1d24] bg-[#0e0e12] py-2 pl-9 pr-3 text-sm text-white focus:border-[#be123c] focus:outline-none"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="dashboard-registry-filter" className="block text-xs font-bold text-zinc-300">
                ทะเบียน
              </label>
              <select
                id="dashboard-registry-filter"
                value={selectedRegistry}
                onChange={(e) => setSelectedRegistry(e.target.value as "all" | "ร้องทุกข์" | "อุทธรณ์")}
                className="mt-1.5 w-full rounded-xl border border-[#3a1d24] bg-[#0e0e12] px-3 py-2 text-sm text-white"
              >
                <option value="all">ทั้งหมด</option>
                <option value="ร้องทุกข์">เรื่องร้องทุกข์</option>
                <option value="อุทธรณ์">เรื่องอุทธรณ์</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="dashboard-year-filter" className="block text-xs font-bold text-zinc-300">
                ปีเลขดำ
              </label>
              <select
                id="dashboard-year-filter"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#3a1d24] bg-[#0e0e12] px-3 py-2 text-sm text-white"
              >
                <option value="all">ทุกปี ({availableYears.length})</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3">
              <label htmlFor="dashboard-officer-filter" className="block text-xs font-bold text-zinc-300">
                นิติกรผู้รับผิดชอบ
              </label>
              <select
                id="dashboard-officer-filter"
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#3a1d24] bg-[#0e0e12] px-3 py-2 text-sm text-white"
              >
                <option value="all">ทุกนิติกร ({availableOfficers.length})</option>
                {availableOfficers.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <p>
              พบเรื่องค้างที่ตรงเงื่อนไข{" "}
              <strong className="tabular-nums text-white">
                {numberFmt.format(filteredCases.length)}
              </strong>{" "}
              จากทั้งหมด {numberFmt.format(allBacklogCases.length)} เรื่อง
            </p>
            {(query || selectedRegistry !== "all" || selectedYear !== "all" || selectedOfficer !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedRegistry("all");
                  setSelectedYear("all");
                  setSelectedOfficer("all");
                }}
                className="font-bold text-[#fda4af] hover:underline"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>

          {!canViewDetails ? (
            <p className="rounded-xl border border-white/10 bg-[#14141b] p-5 text-sm text-zinc-400">
              บัญชีนี้ไม่มีสิทธิ์ดูรายละเอียดเรื่องรายสำนวน
            </p>
          ) : filteredCases.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-[#14141b] p-8 text-center">
              <p className="text-sm font-bold text-white">ไม่พบสำนวนค้างที่ตรงกับตัวกรอง</p>
              <p className="mt-1 text-xs text-zinc-400">ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองเพื่อดูรายการทั้งหมด</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredCases.slice(0, 30).map((item) => (
                <article
                  key={`${item.registryKind}-${item.id}`}
                  className="flex flex-col justify-between rounded-2xl border border-[#2f1d22] bg-[#14141b] p-4 transition hover:border-[#be123c]/60"
                >
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="inline-block rounded-full border border-[#be123c]/40 bg-[#be123c]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#fda4af]">
                          {item.registryKind} · {item.year}
                        </span>
                        <h4 className="mt-1.5 break-words text-base font-bold text-white">
                          {item.petitionerName || "ยังไม่ระบุชื่อผู้ร้อง"}
                        </h4>
                      </div>
                      <Link
                        href={`/cases/${item.id}`}
                        className="shrink-0 rounded-full bg-gradient-to-r from-[#be123c] to-[#881337] px-3.5 py-1.5 text-xs font-bold text-white hover:brightness-110"
                      >
                        เรื่องดำ {item.blackNumber}
                      </Link>
                    </div>
                    <p className="mt-2 line-clamp-2 break-words text-sm text-zinc-300">
                      {item.subject}
                    </p>
                    <p className="mt-2 rounded-xl border border-white/10 bg-[#0e0e12] px-3 py-2 text-xs leading-5 text-zinc-300">
                      <strong className="text-white">การดำเนินการล่าสุด:</strong>{" "}
                      {item.proceeding}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5 text-xs text-zinc-400">
                    <span>
                      นิติกร: <strong className="text-white">{item.officer}</strong>
                    </span>
                    <div className="flex items-center gap-3">
                      {canUseAnalysis && (
                        <Link
                          href={`/analysis?case=${encodeURIComponent(item.id)}`}
                          className="font-bold text-[#fda4af] hover:underline"
                        >
                          วิเคราะห์สำนวนนี้ →
                        </Link>
                      )}
                      <Link
                        href={`/cases/${item.id}`}
                        className="font-bold text-white hover:underline"
                      >
                        เปิดสำนวน
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INTERACTIVE OFFICER WORKLOAD MATRIX */}
      {activeTab === "officers" && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-[#3a1d24] bg-[#14141b] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="search"
                value={officerSearch}
                onChange={(e) => setOfficerSearch(e.target.value)}
                placeholder="ค้นหาชื่อนิติกรผู้รับผิดชอบ..."
                aria-label="ค้นหาชื่อนิติกรผู้รับผิดชอบ"
                className="w-full rounded-xl border border-[#3a1d24] bg-[#0e0e12] py-2 pl-9 pr-3 text-sm text-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-400">เรียงตาม:</span>
              {[
                { key: "pending" as const, label: "เรื่องค้างมากสุด" },
                { key: "total" as const, label: "รับทั้งหมดมากสุด" },
                { key: "completed" as const, label: "เสร็จสิ้นมากสุด" },
                { key: "rate" as const, label: "% สำเร็จสูงสุด" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setOfficerSort(opt.key)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    officerSort === opt.key
                      ? "bg-gradient-to-r from-[#be123c] to-[#881337] text-white"
                      : "border border-white/10 bg-[#0e0e12] text-zinc-300 hover:border-[#be123c]/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-[#14141b] text-xs font-bold text-zinc-400">
                <tr>
                  <th className="px-4 py-3">อันดับ</th>
                  <th className="px-4 py-3">นิติกรผู้รับผิดชอบ</th>
                  <th className="px-4 py-3 text-right">รับทั้งหมด</th>
                  <th className="px-4 py-3 text-right">เสร็จแล้ว</th>
                  <th className="px-4 py-3 text-right">ค้างดำเนินการ</th>
                  <th className="px-4 py-3 text-right">% สำเร็จ</th>
                  <th className="px-4 py-3">สัดส่วนภาระงาน</th>
                  <th className="px-4 py-3 text-right">สำรวจเรื่องค้าง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-[#0e0e12]">
                {sortedOfficers.map((item) => (
                  <tr key={item.name} className="hover:bg-[#16161e]">
                    <td className="px-4 py-3 tabular-nums text-xs font-semibold text-zinc-500">
                      {item.rank === null ? "—" : `#${item.rank}`}
                    </td>
                    <td className="px-4 py-3 font-bold text-white">{item.name}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-white">
                      {numberFmt.format(item.total)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-400">
                      {numberFmt.format(item.completed)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-[#fb7185]">
                      {numberFmt.format(item.pending)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-white">
                      {pctFmt.format(item.completionPercent)}%
                    </td>
                    <td className="w-44 px-4 py-3">
                      <div className="flex h-2.5 overflow-hidden rounded-full bg-zinc-800">
                        <span
                          className="bg-gradient-to-r from-[#881337] to-[#e11d48]"
                          style={{ width: `${(item.completed / maxOfficerTotal) * 100}%` }}
                        />
                        <span
                          className="bg-amber-400"
                          style={{ width: `${(item.pending / maxOfficerTotal) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.pending > 0 && canViewDetails ? (
                        <button
                          type="button"
                          onClick={() => selectOfficerAndInspect(item.name)}
                          className="text-xs font-bold text-[#fda4af] hover:underline"
                        >
                          ดูเรื่องค้าง ({numberFmt.format(item.pending)}) →
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-500">ไม่มีเรื่องค้าง</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: URGENT & RECENT ACTIVITY */}
      {activeTab === "urgent" && (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#3a1d24] bg-[#14141b] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                สำนวนเร่งด่วน / ใกล้ครบกำหนดภายใน 7 วัน
              </h3>
              <span className="rounded-full bg-[#be123c]/20 px-2.5 py-0.5 text-xs font-bold text-[#fda4af] tabular-nums">
                {numberFmt.format(snapshot.urgentCases.length)} เรื่อง
              </span>
            </div>
            {snapshot.urgentCases.length === 0 ? (
              <p className="mt-4 rounded-xl bg-[#0e0e12] p-5 text-center text-xs text-zinc-400">
                ไม่มีสำนวนที่เกินกำหนดหรือครบกำหนดภายใน 7 วันในขณะนี้
              </p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {snapshot.urgentCases.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0e0e12] p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/cases/${u.id}`}
                          className="text-xs font-bold text-white hover:underline"
                        >
                          เรื่องดำ {u.blackNumber}
                        </Link>
                        <span className="text-xs text-zinc-400">({u.type})</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-300">{u.subject}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        นิติกร: {u.legalOfficer} · ครบกำหนด {dateFmt.format(new Date(u.dueDate))}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#be123c]/20 px-2.5 py-1 text-xs font-bold tabular-nums text-[#fda4af]">
                      {u.daysUntilDue < 0
                        ? `เกิน ${Math.abs(u.daysUntilDue)} วัน`
                        : `อีก ${u.daysUntilDue} วัน`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#3a1d24] bg-[#14141b] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                ความเคลื่อนไหวและการตรวจสอบคุณภาพข้อมูล
              </h3>
              <Link
                href="/data-quality"
                className="text-xs font-bold text-[#fda4af] hover:underline"
              >
                ตรวจคุณภาพข้อมูล →
              </Link>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-white/10 bg-[#0e0e12] p-3">
                <p className="text-xs text-zinc-400">สถานะขัดแย้งกับช่องเรื่องแดง</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-white">
                  {numberFmt.format(snapshot.kpis.criticalDataQuality)} เรื่อง
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0e0e12] p-3">
                <p className="text-xs text-zinc-400">ยังไม่ระบุวันรับเรื่อง</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-white">
                  {numberFmt.format(snapshot.dataQuality.missingReceivedDate)} เรื่อง
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold text-zinc-300">กิจกรรมล่าสุดในระบบ</p>
              {snapshot.activities.length === 0 ? (
                <p className="rounded-xl bg-[#0e0e12] p-4 text-center text-xs text-zinc-500">
                  ยังไม่มีบันทึกกิจกรรมล่าสุด
                </p>
              ) : (
                snapshot.activities.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0e0e12] px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-[#fda4af]">เรื่องดำ {act.blackNumber}</span>{" "}
                      <span className="text-zinc-300">· {act.action}</span>
                    </div>
                    <span className="shrink-0 text-[11px] text-zinc-500">{act.actor}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
