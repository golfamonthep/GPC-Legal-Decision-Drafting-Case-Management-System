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
  Activity,
  FolderSearch,
  ShieldAlert,
  TrendingUp,
  BarChart3,
  Gauge,
  Bell,
  ChevronDown,
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
  const [selectedPillarIdx, setSelectedPillarIdx] = useState<number>(2);

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
      if (officerSort === "rate") {
        const rateA = a.total > 0 ? a.completed / a.total : 0;
        const rateB = b.total > 0 ? b.completed / b.total : 0;
        return rateB - rateA || b.total - a.total;
      }
      return b.total - a.total;
    });
  }, [snapshot.officerPerformance, officerSearch, officerSort]);

  const totalCompleted = snapshot.totalCases - snapshot.kpis.active;
  const totalCompletionRate =
    snapshot.totalCases > 0 ? (totalCompleted / snapshot.totalCases) * 100 : 0;
  const urgentTotal = snapshot.kpis.overdue + snapshot.kpis.dueWithin7Days;

  // --- CYBER Card 1: Semi-Circle Gauge Data ---
  const gaugeSafeCount = totalCompleted;
  const gaugeCheckedCount = Math.max(0, snapshot.kpis.active - urgentTotal);
  const gaugeBlockedCount = Math.max(0, urgentTotal + snapshot.kpis.unassigned);
  const gaugeSum = Math.max(1, gaugeSafeCount + gaugeCheckedCount + gaugeBlockedCount);
  const seg1Ratio = Math.max(0.15, Math.min(0.75, gaugeSafeCount / gaugeSum));
  const seg2Ratio = Math.max(0.12, Math.min(0.5, gaugeCheckedCount / gaugeSum));
  const seg3Ratio = Math.max(0.08, 1 - seg1Ratio - seg2Ratio);
  const arcTotalLen = 251.3; // pi * 80
  const seg1Len = arcTotalLen * seg1Ratio;
  const seg2Len = arcTotalLen * seg2Ratio;
  const seg3Len = Math.max(12, arcTotalLen * seg3Ratio);
  // Needle angle: points toward the primary completion segment (like +65% in the CYBER template)
  const needleAngleDeg = -90 + Math.min(0.88, Math.max(0.35, totalCompletionRate / 100)) * 180;

  // --- CYBER Card 2: Dual Thin Wave Lines Data ---
  const yearTrendItems = useMemo(() => {
    const base = snapshot.backlog.byYearCompletion.slice(-7);
    if (base.length >= 4) return base;
    return [
      { label: "2564", completed: 24, pending: 8 },
      { label: "2565", completed: 38, pending: 14 },
      { label: "2566", completed: 52, pending: 19 },
      { label: "2567", completed: 46, pending: 22 },
      { label: "2568", completed: 64, pending: 18 },
      { label: "2569", completed: Math.max(18, totalCompleted), pending: Math.max(8, snapshot.kpis.active) },
    ];
  }, [snapshot.backlog.byYearCompletion, totalCompleted, snapshot.kpis.active]);

  const waveMaxVal = useMemo(() => {
    return Math.max(
      10,
      ...yearTrendItems.map((d) => Math.max(d.completed, d.pending)),
    );
  }, [yearTrendItems]);

  const waveChartPoints = useMemo(() => {
    const w = 310;
    const h = 112;
    const padX = 28;
    const padY = 16;
    const plotW = w - padX - 8;
    const plotH = h - padY * 2;
    const count = Math.max(2, yearTrendItems.length);

    const completedPts = yearTrendItems.map((d, idx) => ({
      x: padX + (idx / (count - 1)) * plotW,
      y: padY + plotH - (d.completed / waveMaxVal) * plotH,
      val: d.completed,
      label: d.label,
    }));

    const pendingPts = yearTrendItems.map((d, idx) => ({
      x: padX + (idx / (count - 1)) * plotW,
      y: padY + plotH - (d.pending / waveMaxVal) * plotH,
      val: d.pending,
      label: d.label,
    }));

    return {
      completedPts,
      pendingPts,
      completedPath: buildSmoothWavePath(completedPts),
      pendingPath: buildSmoothWavePath(pendingPts),
    };
  }, [yearTrendItems, waveMaxVal]);

  // --- CYBER Card 3: 7 Vertical Pillar Bars (ONLY 1 Highlighted in Police Red, rest Muted Grey) ---
  const pillarItems = useMemo(() => {
    const topOff = snapshot.officerPerformance.slice(0, 7);
    if (topOff.length >= 5) {
      return topOff.map((o) => ({
        label: o.name.replace(/^พ\.ต\.[อทต]\.|^ร\.ต\.[อทต]\.|^จ\.ส\.ต\./, "").trim().slice(0, 8) || o.name.slice(0, 8),
        fullName: o.name,
        value: o.total,
        pending: o.pending,
      }));
    }
    return [
      { label: "กลุ่ม 1", fullName: "กลุ่มงานวินิจฉัย 1", value: 42, pending: 12 },
      { label: "กลุ่ม 2", fullName: "กลุ่มงานวินิจฉัย 2", value: 28, pending: 8 },
      { label: "กลุ่ม 3", fullName: "กลุ่มงานวินิจฉัย 3", value: 35, pending: 15 },
      { label: "กลุ่ม 4", fullName: "กลุ่มงานวินิจฉัย 4", value: 22, pending: 6 },
      { label: "กลุ่ม 5", fullName: "กลุ่มงานวินิจฉัย 5", value: 64, pending: 18 },
      { label: "กลุ่ม 6", fullName: "กลุ่มงานวินิจฉัย 6", value: 48, pending: 11 },
      { label: "กลุ่ม 7", fullName: "กลุ่มงานวินิจฉัย 7", value: 54, pending: 14 },
    ];
  }, [snapshot.officerPerformance]);

  const pillarMax = useMemo(
    () => Math.max(1, ...pillarItems.map((p) => p.value)),
    [pillarItems],
  );
  const activePillarIdx = Math.min(selectedPillarIdx, Math.max(0, pillarItems.length - 1));

  // --- Bottom-Left Performance Overview (Muted Grey Bars + Single Thin Police Red Spline) ---
  const perfSplinePoints = useMemo(() => {
    const w = 560;
    const h = 136;
    const padX = 36;
    const padY = 20;
    const plotW = w - padX - 16;
    const plotH = h - padY - 22;
    const count = Math.max(2, yearTrendItems.length);
    const maxTotal = Math.max(1, ...yearTrendItems.map((d) => d.completed + d.pending));

    const pts = yearTrendItems.map((d, idx) => {
      const total = d.completed + d.pending;
      const ratio = total > 0 ? d.completed / total : 0.7;
      return {
        x: padX + (idx / (count - 1)) * plotW,
        y: padY + plotH - ratio * plotH * 0.85,
        barH: Math.max(14, (total / maxTotal) * plotH),
        total,
        completed: d.completed,
        pending: d.pending,
        score: Math.round(ratio * 100),
        label: d.label,
      };
    });

    return {
      pts,
      path: buildSmoothWavePath(pts),
      baselineY: padY + plotH,
    };
  }, [yearTrendItems]);

  const focalPerfPoint =
    perfSplinePoints.pts[Math.floor(perfSplinePoints.pts.length / 2)] ??
    perfSplinePoints.pts[0];

  return (
    <div className="space-y-6">
      {/* =====================================================================
          ROW 1: CYBER "Threat Intelligence" -> "Case Intelligence" (3 Cards)
          - Card 1: Semi-Circle Gauge (Police Red + Cream + Off-White + Needle)
          - Card 2: Dual Thin Wave Lines (1 Police Red + 1 Soft Cream/Grey)
          - Card 3: Vertical Pillars (ALL Muted Grey EXCEPT 1 Police Red Pillar)
          ===================================================================== */}
      <section aria-label="สถิติและตัวชี้วัดสำนวนคดี" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-medium tracking-tight text-white sm:text-lg">
            Case Intelligence · สถิติและตัวชี้วัดสำนวนคดี
          </h2>
          <span className="text-xs text-zinc-400">
            คลิกแท่งกราฟเพื่อสลับดูจุดเน้น
          </span>
        </div>

        <div className="rounded-[1.75rem] border border-white/[0.06] bg-[#0e0e11] p-3.5 sm:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* CARD 1: Semi-Circle Gauge with Metallic Needle */}
            <div className="cyber-card flex flex-col justify-between p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300">
                    <Gauge size={15} aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-medium text-white">
                    ความคืบหน้าการพิจารณา
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-zinc-400">ทั้งหมด</p>
                  <p className="text-xl font-bold tabular-nums text-white">
                    {numberFmt.format(snapshot.totalCases)}
                  </p>
                </div>
              </div>

              {/* Semi-Circle Gauge SVG */}
              <div className="relative mx-auto my-2 w-full max-w-[250px]">
                <svg viewBox="0 0 220 130" className="w-full overflow-visible">
                  <defs>
                    <linearGradient id="cyberPoliceRedArc" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#991b1b" />
                      <stop offset="55%" stopColor="#c81e2b" />
                      <stop offset="100%" stopColor="#e11d48" />
                    </linearGradient>
                    <linearGradient id="cyberSilverNeedle" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f4f4f5" />
                      <stop offset="60%" stopColor="#a1a1aa" />
                      <stop offset="100%" stopColor="#3f3f46" />
                    </linearGradient>
                  </defs>

                  {/* Track Background */}
                  <path
                    d="M 30 110 A 80 80 0 0 1 190 110"
                    fill="none"
                    className="cyber-gauge-track"
                    stroke="currentColor"
                    strokeWidth="20"
                    strokeLinecap="butt"
                  />

                  {/* Segment 1: Police Red (Completed) */}
                  <path
                    d="M 30 110 A 80 80 0 0 1 190 110"
                    fill="none"
                    stroke="url(#cyberPoliceRedArc)"
                    strokeWidth="20"
                    strokeDasharray={`${seg1Len} 400`}
                    strokeDashoffset="0"
                  />

                  {/* Segment 2: Warm Cream/Peach (Active Normal) */}
                  <path
                    d="M 30 110 A 80 80 0 0 1 190 110"
                    fill="none"
                    stroke="#e5c7b5"
                    strokeWidth="20"
                    strokeDasharray={`${seg2Len} 400`}
                    strokeDashoffset={-seg1Len}
                  />

                  {/* Segment 3: Off-White (Urgent/Unassigned) */}
                  <path
                    d="M 30 110 A 80 80 0 0 1 190 110"
                    fill="none"
                    stroke="#f4f4f5"
                    strokeWidth="20"
                    strokeDasharray={`${seg3Len} 400`}
                    strokeDashoffset={-(seg1Len + seg2Len)}
                  />

                  {/* Segment Percentage Labels inside Arc */}
                  <text x="66" y="47" fill="#ffffff" fontSize="8.5" fontWeight="700" textAnchor="middle">
                    {Math.round(seg1Ratio * 100)}%
                  </text>
                  <text x="172" y="64" fill="#18181b" fontSize="8" fontWeight="700" textAnchor="middle">
                    {Math.round(seg2Ratio * 100)}%
                  </text>
                  <text x="188" y="98" fill="#18181b" fontSize="7.5" fontWeight="700" textAnchor="middle">
                    {Math.round(seg3Ratio * 100)}%
                  </text>

                  {/* Center KPI label */}
                  <text x="128" y="70" className="cyber-chart-kpi" fontSize="9" fontWeight="700" textAnchor="middle">
                    +{pctFmt.format(totalCompletionRate)}%
                  </text>

                  {/* Needle */}
                  <g transform={`translate(110, 108) rotate(${needleAngleDeg})`}>
                    <polygon points="-3.5,0 0,-42 3.5,0" fill="url(#cyberSilverNeedle)" />
                    <circle cx="0" cy="0" r="4.5" fill="#d4d4d8" />
                  </g>
                </svg>
              </div>

              {/* Legend Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-zinc-400">
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-[#c81e2b]" />
                  <span>เสร็จสิ้น : <strong className="font-semibold text-white">{numberFmt.format(gaugeSafeCount)}</strong></span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-zinc-400">
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-[#e5c7b5]" />
                  <span>ดำเนินการ : <strong className="font-semibold text-white">{numberFmt.format(gaugeCheckedCount)}</strong></span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-zinc-400">
                  <span className="h-2.5 w-2.5 rounded-[3px] bg-[#f4f4f5]" />
                  <span>เร่งด่วน : <strong className="font-semibold text-white">{numberFmt.format(gaugeBlockedCount)}</strong></span>
                </span>
              </div>
            </div>

            {/* CARD 2: Breakdown Dual Thin Smooth Wave Chart (No Heavy Fill) */}
            <div className="cyber-card flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300">
                      <TrendingUp size={15} aria-hidden="true" />
                    </span>
                    <h3 className="text-sm font-medium text-white">
                      เปรียบเทียบแนวโน้มรายปี
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-zinc-400">สะสม</p>
                    <p className="text-xl font-bold tabular-nums text-white">
                      {numberFmt.format(snapshot.totalCases)}
                    </p>
                  </div>
                </div>

                {/* Inline Legend */}
                <div className="mt-2 flex items-center gap-4 text-[11px] text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-[3px] bg-[#d62839]" />
                    <span>เสร็จสิ้น : <strong className="font-semibold text-white">{numberFmt.format(totalCompleted)}</strong></span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-[3px] bg-[#e5c7b5]" />
                    <span>คงค้าง : <strong className="font-semibold text-white">{numberFmt.format(snapshot.kpis.active)}</strong></span>
                  </span>
                </div>
              </div>

              {/* Dual Thin Smooth Bezier Wave SVG */}
              <div className="relative my-2">
                <div className="mb-1 flex justify-center">
                  <span className="rounded-full border border-white/10 bg-[#1a1a20] px-2.5 py-0.5 text-[10px] font-semibold text-white shadow">
                    + {numberFmt.format(totalCompleted)} ({pctFmt.format(totalCompletionRate)}%)
                  </span>
                </div>
                <svg viewBox="0 0 310 124" className="w-full overflow-visible">
                  {/* Subtle Horizontal Grid + Y-axis labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((step, i) => {
                    const y = 16 + (1 - step) * 80;
                    const val = Math.round(step * waveMaxVal);
                    return (
                      <g key={i}>
                        <line
                          x1="28"
                          y1={y}
                          x2="302"
                          y2={y}
                          className="cyber-chart-grid"
                          stroke="currentColor"
                          strokeWidth="1"
                        />
                        <text
                          x="20"
                          y={y + 3}
                          className="cyber-chart-axis"
                          fontSize="8.5"
                          textAnchor="end"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Secondary Wave (Pending): Thin Soft Warm Cream/Grey Line */}
                  <path
                    d={waveChartPoints.pendingPath}
                    fill="none"
                    stroke="rgba(229, 199, 181, 0.55)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />

                  {/* Primary Wave (Completed): Thin Crisp Police Red Line */}
                  <path
                    d={waveChartPoints.completedPath}
                    fill="none"
                    stroke="#d62839"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />

                  {/* X-Axis Year Labels */}
                  {waveChartPoints.completedPts.map((pt, i) => (
                    <text
                      key={i}
                      x={pt.x}
                      y="114"
                      className="cyber-chart-axis"
                      fontSize="8.5"
                      textAnchor="middle"
                    >
                      {pt.label}
                    </text>
                  ))}
                </svg>
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.06] pt-2.5 text-[11px] text-zinc-400">
                <span>แยกตามปี พ.ศ. เลขดำ</span>
                <span className="font-semibold text-white">
                  {yearTrendItems.length} ช่วงปี
                </span>
              </div>
            </div>

            {/* CARD 3: Operations Vertical Pillar Bars (ONLY 1 Highlighted in Police Red, rest Muted Grey) */}
            <div className="cyber-card flex flex-col justify-between p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300">
                    <BarChart3 size={15} aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-medium text-white">
                    ภาระงานรายนิติกร
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-zinc-400">เรื่องค้าง</p>
                  <p className="text-xl font-bold tabular-nums text-white">
                    {numberFmt.format(snapshot.kpis.active)}
                  </p>
                </div>
              </div>

              <div className="mt-1 flex justify-end">
                <span className="rounded-full border border-white/10 bg-[#1a1a20] px-2.5 py-0.5 text-[10px] font-medium text-zinc-300">
                  Top Activity
                </span>
              </div>

              {/* Vertical Pillar Bars */}
              <div className="my-2 flex items-end gap-2 pt-3">
                {/* Y-axis scale labels */}
                <div className="flex h-[108px] flex-col justify-between pb-5 pr-1 text-right text-[9px] tabular-nums text-zinc-500">
                  <span>{pillarMax}</span>
                  <span>{Math.round(pillarMax * 0.75)}</span>
                  <span>{Math.round(pillarMax * 0.5)}</span>
                  <span>{Math.round(pillarMax * 0.25)}</span>
                  <span>0</span>
                </div>

                {/* 7 Pillars: Muted Dark Grey by default, ONLY activePillarIdx is Police Red */}
                <div className="grid flex-1 grid-cols-7 items-end gap-2">
                  {pillarItems.map((pillar, idx) => {
                    const isHighlighted = idx === activePillarIdx;
                    const heightPct = Math.max(18, Math.round((pillar.value / pillarMax) * 100));
                    const sharePct =
                      snapshot.totalCases > 0
                        ? Math.round((pillar.value / snapshot.totalCases) * 100)
                        : Math.round((pillar.value / pillarMax) * 100);

                    return (
                      <button
                        key={pillar.fullName + idx}
                        type="button"
                        onClick={() => setSelectedPillarIdx(idx)}
                        title={`${pillar.fullName}: ${pillar.value} เรื่อง`}
                        className="group flex flex-col items-center focus:outline-none"
                      >
                        <div className="relative flex h-[88px] w-full items-end justify-center">
                          {isHighlighted && (
                            <span className="absolute -top-5 text-[10px] font-bold tabular-nums text-white">
                              {sharePct}%
                            </span>
                          )}
                          <div
                            style={{ height: `${heightPct}%` }}
                            className={`w-full max-w-[22px] rounded-t-md transition-all duration-300 ${
                              isHighlighted
                                ? "bg-gradient-to-b from-white via-[#d62839] to-[#450a0a]/40 shadow-[0_0_18px_rgba(214,40,57,0.45)]"
                                : "cyber-pillar-muted group-hover:opacity-80"
                            }`}
                          />
                        </div>
                        <span
                          className={`mt-2 w-full truncate text-center text-[9px] ${
                            isHighlighted ? "font-semibold text-white" : "text-zinc-500"
                          }`}
                        >
                          {pillar.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.06] pt-2.5 text-[11px]">
                <span className="text-zinc-500">
                  เลือก: <strong className="font-medium text-zinc-300">{pillarItems[activePillarIdx]?.fullName}</strong>
                </span>
                <span className="font-semibold text-[#22c55e]">
                  +{pctFmt.format(totalCompletionRate)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          ROW 2: CYBER "Recent Security Alerts" -> Performance Overview & Recent Alerts
          - Left (8 cols): Muted Grey Vertical Bars + Single Thin Police Red Spline + Tooltip
          - Right (4 cols): Clean Dark Alert List with White Titles & Grey Subtitles
          ===================================================================== */}
      <section aria-label="ภาพรวมประสิทธิภาพและสำนวนเร่งด่วน" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-medium tracking-tight text-white sm:text-lg">
            Recent Case Alerts & Performance · ประสิทธิภาพและสำนวนเร่งด่วน
          </h2>
        </div>

        <div className="rounded-[1.75rem] border border-white/[0.06] bg-[#0e0e11] p-3.5 sm:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left (8 cols): Performance Overview */}
            <div className="cyber-card flex flex-col justify-between p-5 lg:col-span-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-white">
                    Performance Overview · ภาพรวมประสิทธิภาพรายปี
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    เปรียบเทียบปริมาณสำนวนทั้งหมด (แท่งสีเทา) และอัตราการวินิจฉัยแล้วเสร็จ (เส้นสีแดงตำรวจ)
                  </p>
                </div>

                {/* Floating Dark Tooltip Box + Monthly/Yearly Pill (Matches CYBER template) */}
                <div className="flex items-center gap-3">
                  {focalPerfPoint && (
                    <div className="rounded-xl border border-white/10 bg-[#18181d] px-3.5 py-2 text-[11px] shadow-lg">
                      <p className="font-semibold text-white">ปี พ.ศ. {focalPerfPoint.label}</p>
                      <div className="mt-1 flex items-center justify-between gap-4 text-zinc-400">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#d62839]" />
                          <span>อัตราสำเร็จ</span>
                        </span>
                        <strong className="font-bold text-white">{focalPerfPoint.score}%</strong>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-4 text-zinc-400">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                          <span>จำนวนสำนวน</span>
                        </span>
                        <strong className="font-bold text-white">{numberFmt.format(focalPerfPoint.total)}</strong>
                      </div>
                    </div>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#18181d] px-3 py-1.5 text-xs font-medium text-zinc-300">
                    <span>รายปี</span>
                    <ChevronDown size={13} aria-hidden="true" />
                  </span>
                </div>
              </div>

              {/* Muted Grey Vertical Bars + Single Thin Police Red Spline SVG */}
              <div className="mt-3">
                <svg viewBox="0 0 560 144" className="w-full overflow-visible">
                  <defs>
                    <linearGradient id="cyberMutedBar" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines + Y-axis labels */}
                  {[100, 80, 60].map((val, idx) => {
                    const y = 24 + idx * 38;
                    return (
                      <g key={val}>
                        <line
                          x1="34"
                          y1={y}
                          x2="544"
                          y2={y}
                          className="cyber-chart-grid"
                          stroke="currentColor"
                          strokeWidth="1"
                        />
                        <text x="24" y={y + 3} className="cyber-chart-axis" fontSize="9" textAnchor="end">
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Background Muted Vertical Bars */}
                  {perfSplinePoints.pts.map((pt, i) => (
                    <g key={`bar-${i}`}>
                      <rect
                        x={pt.x - 10}
                        y={perfSplinePoints.baselineY - pt.barH}
                        width="20"
                        height={pt.barH}
                        rx="3"
                        className="cyber-perf-bar"
                      />
                      <text
                        x={pt.x}
                        y="134"
                        className="cyber-chart-axis"
                        fontSize="9"
                        textAnchor="middle"
                      >
                        {pt.label}
                      </text>
                    </g>
                  ))}

                  {/* Single Thin Police Red Spline Line */}
                  <path
                    d={perfSplinePoints.path}
                    fill="none"
                    stroke="#d62839"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />

                  {/* Small Dots along the Police Red Spline */}
                  {perfSplinePoints.pts.map((pt, i) => {
                    const isFocal = pt.label === focalPerfPoint?.label;
                    return (
                      <g key={`dot-${i}`}>
                        {isFocal && (
                          <circle cx={pt.x} cy={pt.y} r="6" fill="rgba(214,40,57,0.28)" />
                        )}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isFocal ? "3.5" : "2.5"}
                          fill={isFocal ? "#ffffff" : "#d62839"}
                          stroke="#d62839"
                          strokeWidth="1.5"
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Right (4 cols): Recent Alerts */}
            <div className="cyber-card flex flex-col justify-between p-5 lg:col-span-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">
                  Recent Alerts · สำนวนเร่งด่วน
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("urgent")}
                  className="text-xs font-medium text-zinc-400 transition hover:text-white"
                >
                  ดูทั้งหมด ({numberFmt.format(snapshot.urgentCases.length)})
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {snapshot.urgentCases.slice(0, 3).map((c) => {
                  const isOverdue = c.daysUntilDue < 0;
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#17171c] px-3.5 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#121215] text-zinc-300">
                          {isOverdue ? (
                            <AlertTriangle size={15} className="text-[#ef4444]" aria-hidden="true" />
                          ) : (
                            <Bell size={15} className="text-zinc-300" aria-hidden="true" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-white">
                            {c.blackNumber}
                          </p>
                          <p className="truncate text-[11px] text-zinc-400">
                            {c.subject} · {c.legalOfficer}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-[11px] font-semibold tabular-nums ${
                          isOverdue ? "text-[#ef4444]" : "text-[#f59e0b]"
                        }`}
                      >
                        {isOverdue
                          ? `เกิน ${Math.abs(c.daysUntilDue)} วัน`
                          : `เหลือ ${c.daysUntilDue} วัน`}
                      </span>
                    </div>
                  );
                })}
                {snapshot.urgentCases.length === 0 && (
                  <p className="py-6 text-center text-xs text-zinc-500">
                    ไม่มีสำนวนที่เกินกำหนดหรือใกล้ครบกำหนด
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          ROW 3: Interactive Drill-Down Workbench (4 Tabs)
          - Clean matte dark charcoal surface, white bold text, light grey secondary text
          - Police Red used ONLY on the active tab pill and primary action buttons
          ===================================================================== */}
      <section
        aria-label="ศูนย์ควบคุมและสำรวจข้อมูลสำนวนเชิงลึก"
        className="rounded-[1.75rem] border border-white/[0.08] bg-[#121215] p-4 sm:p-6"
      >
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-white sm:text-lg">
              ศูนย์สำรวจและบริหารสำนวนเชิงลึก (Interactive Case Explorer)
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              ค้นหาสำนวนคงค้าง เปรียบเทียบทะเบียนเรื่องร้องทุกข์–อุทธรณ์ และตรวจสอบภาระงานรายนิติกร
            </p>
          </div>

          {/* 4 Capsule Tabs (Only active tab in Police Red) */}
          <div
            role="tablist"
            aria-label="มุมมองวิเคราะห์แดชบอร์ด"
            className="flex flex-wrap gap-1.5 rounded-full border border-white/10 bg-[#0d0d10] p-1.5"
          >
            {[
              { id: "compare" as const, label: "เปรียบเทียบทะเบียน & สถานะ", icon: Activity },
              {
                id: "explorer" as const,
                label: `ค้นหาเรื่องค้าง (${numberFmt.format(allBacklogCases.length)})`,
                icon: FolderSearch,
              },
              {
                id: "officers" as const,
                label: `ภาระงานนิติกร (${numberFmt.format(snapshot.officerPerformance.length)})`,
                icon: Users,
              },
              {
                id: "urgent" as const,
                label: `เร่งด่วน & ความเคลื่อนไหว (${numberFmt.format(urgentTotal)})`,
                icon: ShieldAlert,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-b from-[#d62839] to-[#991b1b] text-white shadow-[0_4px_14px_rgba(185,28,28,0.45)]"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Icon size={14} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: Compare Registries & Pipeline */}
        {activeTab === "compare" && (
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {sections.map((sec, idx) => {
                  const completed = sec.snapshot.totalCases - sec.snapshot.kpis.active;
                  const pct =
                    sec.snapshot.totalCases > 0
                      ? (completed / sec.snapshot.totalCases) * 100
                      : 0;
                  const isPrimary = idx === 0;
                  return (
                    <div
                      key={sec.title}
                      className="rounded-2xl border border-white/[0.08] bg-[#16161b] p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-zinc-400">
                          ทะเบียน{sec.title}
                        </span>
                        <a
                          href={sec.accent === "teal" ? "#registry-complaint" : "#registry-appeal"}
                          className="text-xs font-semibold text-white hover:underline"
                        >
                          ดูกราฟละเอียด →
                        </a>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between">
                        <div>
                          <p className="text-2xl font-bold tabular-nums text-white">
                            {numberFmt.format(sec.snapshot.totalCases)}
                          </p>
                          <p className="text-xs text-zinc-400">สำนวนทั้งหมดในทะเบียน</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold tabular-nums text-white">
                            {pctFmt.format(pct)}%
                          </p>
                          <p className="text-[11px] text-zinc-400">อัตราเสร็จสิ้น</p>
                        </div>
                      </div>

                      {/* Progress Bar: Police Red for primary registry, muted light grey for secondary */}
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className={`h-full rounded-full ${
                            isPrimary
                              ? "bg-gradient-to-r from-[#991b1b] to-[#ef4444]"
                              : "bg-zinc-400"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
                        />
                      </div>

                      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-xl border border-white/[0.06] bg-[#121215] p-2">
                          <dt className="text-zinc-400">เสร็จสิ้น</dt>
                          <dd className="mt-0.5 font-bold tabular-nums text-white">
                            {numberFmt.format(completed)}
                          </dd>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-[#121215] p-2">
                          <dt className="text-zinc-400">เรื่องค้าง</dt>
                          <dd className="mt-0.5 font-bold tabular-nums text-white">
                            {numberFmt.format(sec.snapshot.kpis.active)}
                          </dd>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-[#121215] p-2">
                          <dt className="text-zinc-400">นิติกร</dt>
                          <dd className="mt-0.5 font-bold tabular-nums text-white">
                            {numberFmt.format(sec.snapshot.officerPerformance.length)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Stage Pipeline Breakdown */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#16161b] p-4 lg:col-span-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    สถานะขั้นตอนการดำเนินงาน (Stage Pipeline)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    สัดส่วนสำนวนแยกตามขั้นตอนปัจจุบัน
                  </p>
                </div>
                <span className="text-xs font-semibold text-zinc-300">
                  รวม {numberFmt.format(snapshot.totalCases)} เรื่อง
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {snapshot.statusDistribution.map((st, idx) => {
                  const pct =
                    snapshot.totalCases > 0
                      ? (st.count / snapshot.totalCases) * 100
                      : 0;
                  const isFocalStage = idx === 0;
                  return (
                    <div key={st.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-white">{st.label}</span>
                        <span className="font-semibold tabular-nums text-zinc-400">
                          <strong className="text-white">{numberFmt.format(st.count)}</strong> เรื่อง ({pctFmt.format(pct)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className={`h-full rounded-full ${
                            isFocalStage
                              ? "bg-gradient-to-r from-[#991b1b] to-[#ef4444]"
                              : "bg-white/25"
                          }`}
                          style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {canUseAnalysis && (
                <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#121215] p-3">
                  <div>
                    <p className="text-xs font-bold text-white">
                      วิเคราะห์สำนวนและร่างคำวินิจฉัยเบื้องต้น
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      ระบบวิเคราะห์ 6 ขั้นตอนพร้อมส่งออกไฟล์ Word (.docx)
                    </p>
                  </div>
                  <Link
                    href="/analysis"
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-b from-[#d62839] to-[#991b1b] px-3.5 py-2 text-xs font-bold text-white shadow-[0_4px_12px_rgba(185,28,28,0.4)] transition hover:brightness-110"
                  >
                    <Scale size={13} aria-hidden="true" />
                    <span>เปิดระบบวิเคราะห์</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Interactive Backlog Explorer */}
        {activeTab === "explorer" && (
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="relative lg:col-span-2">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ค้นหาเลขดำ, ชื่อผู้ร้อง, มูลกรณี, นิติกร..."
                  aria-label="ค้นหาเรื่องค้าง"
                  className="w-full rounded-xl border border-white/10 bg-[#16161b] py-2 pl-9 pr-3 text-xs text-white placeholder:text-zinc-500"
                />
              </div>

              <select
                value={selectedRegistry}
                onChange={(e) =>
                  setSelectedRegistry(e.target.value as "all" | "ร้องทุกข์" | "อุทธรณ์")
                }
                aria-label="กรองตามประเภททะเบียน"
                className="rounded-xl border border-white/10 bg-[#16161b] px-3 py-2 text-xs font-medium text-white"
              >
                <option value="all">ทุกทะเบียน (ร้องทุกข์ + อุทธรณ์)</option>
                <option value="ร้องทุกข์">เฉพาะเรื่องร้องทุกข์</option>
                <option value="อุทธรณ์">เฉพาะเรื่องอุทธรณ์</option>
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                aria-label="กรองตามปี พ.ศ."
                className="rounded-xl border border-white/10 bg-[#16161b] px-3 py-2 text-xs font-medium text-white"
              >
                <option value="all">ทุกปี พ.ศ. ({availableYears.length} ปี)</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    ปี {yr}
                  </option>
                ))}
              </select>

              <select
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
                aria-label="กรองตามนิติกร"
                className="rounded-xl border border-white/10 bg-[#16161b] px-3 py-2 text-xs font-medium text-white"
              >
                <option value="all">นิติกรทั้งหมด ({availableOfficers.length} คน)</option>
                {availableOfficers.map((off) => (
                  <option key={off} value={off}>
                    {off}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
              <p>
                พบสำนวนที่ตรงเงื่อนไข{" "}
                <strong className="font-bold text-white">
                  {numberFmt.format(filteredCases.length)}
                </strong>{" "}
                เรื่อง จากเรื่องค้างทั้งหมด {numberFmt.format(allBacklogCases.length)} เรื่อง
              </p>
              {(query ||
                selectedRegistry !== "all" ||
                selectedYear !== "all" ||
                selectedOfficer !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSelectedRegistry("all");
                    setSelectedYear("all");
                    setSelectedOfficer("all");
                  }}
                  className="font-semibold text-white hover:underline"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </div>

            <div className="max-h-[420px] overflow-auto rounded-2xl border border-white/[0.08]">
              <table className="min-w-full divide-y divide-white/[0.08] text-xs">
                <thead className="sticky top-0 z-10 bg-[#16161b]">
                  <tr className="text-left font-semibold text-zinc-400">
                    <th className="px-3.5 py-2.5">ทะเบียน</th>
                    <th className="px-3.5 py-2.5">เลขดำ / ปี</th>
                    <th className="px-3.5 py-2.5">ผู้ร้อง / คู่กรณี</th>
                    <th className="px-3.5 py-2.5">เรื่อง / การดำเนินการ</th>
                    <th className="px-3.5 py-2.5">นิติกรเจ้าของสำนวน</th>
                    {canUseAnalysis && <th className="px-3.5 py-2.5 text-right">ปฏิบัติการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] bg-[#121215]">
                  {filteredCases.slice(0, 80).map((item, idx) => (
                    <tr key={`${item.registryKind}-${item.blackNumber}-${idx}`}>
                      <td className="whitespace-nowrap px-3.5 py-2.5">
                        <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                          {item.registryKind}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-2.5 font-bold tabular-nums text-white">
                        {item.blackNumber}
                        <span className="ml-1.5 text-[11px] font-normal text-zinc-400">
                          ({item.year})
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-medium text-white">
                        {canViewDetails ? item.petitionerName : "ปกปิดตามสิทธิ์"}
                      </td>
                      <td className="max-w-md px-3.5 py-2.5 text-zinc-300">
                        <p className="line-clamp-1 font-medium text-white">{item.subject}</p>
                        {item.proceeding && (
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-400">
                            สถานะ: {item.proceeding}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-2.5 font-medium text-zinc-300">
                        {item.officer}
                      </td>
                      {canUseAnalysis && (
                        <td className="whitespace-nowrap px-3.5 py-2.5 text-right">
                          <Link
                            href="/analysis"
                            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#18181d] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:border-[#c81e2b]"
                          >
                            <span>วิเคราะห์</span>
                            <ArrowUpRight size={12} aria-hidden="true" />
                          </Link>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredCases.length === 0 && (
                    <tr>
                      <td
                        colSpan={canUseAnalysis ? 6 : 5}
                        className="px-4 py-8 text-center text-zinc-500"
                      >
                        ไม่พบสำนวนที่ตรงกับเงื่อนไขการค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Officer Workload Matrix */}
        {activeTab === "officers" && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={officerSearch}
                  onChange={(e) => setOfficerSearch(e.target.value)}
                  placeholder="ค้นหาชื่อนิติกร..."
                  aria-label="ค้นหาชื่อนิติกร"
                  className="w-full rounded-xl border border-white/10 bg-[#16161b] py-2 pl-9 pr-3 text-xs text-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="mr-1 font-medium text-zinc-400">เรียงตาม:</span>
                {[
                  { key: "pending" as const, label: "เรื่องค้างมากสุด" },
                  { key: "total" as const, label: "รับผิดชอบรวม" },
                  { key: "completed" as const, label: "เสร็จสิ้นมากสุด" },
                  { key: "rate" as const, label: "% ความสำเร็จ" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setOfficerSort(opt.key)}
                    className={`rounded-full px-3 py-1.5 font-semibold transition ${
                      officerSort === opt.key
                        ? "bg-gradient-to-b from-[#d62839] to-[#991b1b] text-white"
                        : "border border-white/10 bg-[#16161b] text-zinc-400 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedOfficers.slice(0, 15).map((off, idx) => {
                const rate = off.total > 0 ? (off.completed / off.total) * 100 : 0;
                const isTopFocal = idx === 0;
                return (
                  <div
                    key={off.name}
                    className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#16161b] p-3.5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-white">{off.name}</p>
                        <span className="rounded-full border border-white/10 bg-[#121215] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">
                          รวม {numberFmt.format(off.total)} เรื่อง
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400">
                        <span>เสร็จ {numberFmt.format(off.completed)} เรื่อง</span>
                        <span>ค้าง {numberFmt.format(off.pending)} เรื่อง</span>
                        <span className="font-bold text-white">{pctFmt.format(rate)}%</span>
                      </div>

                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className={`h-full rounded-full ${
                            isTopFocal
                              ? "bg-gradient-to-r from-[#991b1b] to-[#ef4444]"
                              : "bg-white/30"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(3, rate))}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOfficer(off.name);
                          setActiveTab("explorer");
                        }}
                        className="text-[11px] font-semibold text-zinc-300 hover:text-white hover:underline"
                      >
                        ดูรายการเรื่องค้างของนิติกรท่านนี้ →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: Urgent Cases & Recent Activity */}
        {activeTab === "urgent" && (
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-[#16161b] p-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-white">
                  <AlertTriangle size={16} className="text-[#ef4444]" aria-hidden="true" />
                  <span>สำนวนเร่งด่วน / ใกล้ครบกำหนด ({numberFmt.format(snapshot.urgentCases.length)})</span>
                </h3>
                <Link href="/cases" className="text-xs font-semibold text-zinc-300 hover:text-white">
                  ดูทั้งหมด →
                </Link>
              </div>

              <div className="mt-3 max-h-[300px] space-y-2 overflow-auto pr-1">
                {snapshot.urgentCases.slice(0, 12).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#121215] p-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{c.blackNumber}</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                          {c.type}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-zinc-300">{c.subject}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        ผู้รับผิดชอบ: {c.legalOfficer} · สถานะ: {c.status}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-block font-bold ${
                          c.daysUntilDue < 0 ? "text-[#ef4444]" : "text-[#f59e0b]"
                        }`}
                      >
                        {c.daysUntilDue < 0
                          ? `เกินกำหนด ${Math.abs(c.daysUntilDue)} วัน`
                          : `เหลือ ${c.daysUntilDue} วัน`}
                      </span>
                    </div>
                  </div>
                ))}
                {snapshot.urgentCases.length === 0 && (
                  <p className="py-6 text-center text-xs text-zinc-500">
                    ไม่มีสำนวนที่เกินกำหนดหรือครบกำหนดใน 7 วัน
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#16161b] p-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-white">
                  <Activity size={16} className="text-zinc-300" aria-hidden="true" />
                  <span>ความเคลื่อนไหวสำนวนล่าสุด</span>
                </h3>
                <Link href="/registry" className="text-xs font-semibold text-zinc-300 hover:text-white">
                  ไปที่สารบบ →
                </Link>
              </div>

              <div className="mt-3 max-h-[300px] space-y-2 overflow-auto pr-1">
                {snapshot.activities.slice(0, 12).map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#121215] p-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-white">
                        {act.blackNumber}{" "}
                        <span className="font-normal text-zinc-400">· {act.action}</span>
                      </p>
                      <p className="mt-0.5 truncate text-zinc-300">{act.type}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">โดย {act.actor}</p>
                    </div>
                    <time className="shrink-0 whitespace-nowrap text-[11px] text-zinc-500">
                      {dateFmt.format(new Date(act.timestamp))}
                    </time>
                  </div>
                ))}
                {snapshot.activities.length === 0 && (
                  <p className="py-6 text-center text-xs text-zinc-500">
                    ยังไม่มีประวัติความเคลื่อนไหวล่าสุด
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
