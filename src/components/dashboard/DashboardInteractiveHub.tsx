"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import {
  Search,
  Scale,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Filter,
  FileSpreadsheet,
  Sparkles,
  Activity,
  Calendar,
  FolderSearch,
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
    const filtered = snapshot.officerPerformance.filter((o) =>
      !q ? true : o.name.toLowerCase().includes(q),
    );
    return [...filtered].sort((a, b) => {
      if (a.unassigned !== b.unassigned) return Number(a.unassigned) - Number(b.unassigned);
      if (officerSort === "pending") return b.pending - a.pending || b.total - a.total;
      if (officerSort === "completed") return b.completed - a.completed || b.total - a.total;
      if (officerSort === "rate") return b.completionPercent - a.completionPercent || b.total - a.total;
      return b.total - a.total || a.name.localeCompare(b.name, "th");
    });
  }, [snapshot.officerPerformance, officerSearch, officerSort]);

  const maxOfficerTotal = useMemo(
    () => Math.max(...snapshot.officerPerformance.map((o) => o.total), 1),
    [snapshot.officerPerformance],
  );

  const selectOfficerAndInspect = (officerName: string) => {
    setSelectedOfficer(officerName);
    setActiveTab("explorer");
  };

  return (
    <section
      aria-label="ศูนย์ควบคุมและสำรวจข้อมูลเชิงโต้ตอบ"
      className="rounded-[1.5rem] border border-slate-200/90 bg-white p-4 shadow-[0_10px_28px_-18px_rgba(15,42,70,0.35)] sm:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#102b46] sm:text-xl">
            ศูนย์วิเคราะห์และติดตามสำนวนเชิงโต้ตอบ
          </h2>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            ค้นหาเรื่องค้าง กรองตามปีและนิติกร เปรียบเทียบความคืบหน้า และส่งสำนวนเข้าสู่ระบบวิเคราะห์ได้ทันที
          </p>
        </div>

        <div
          role="tablist"
          aria-label="มุมมองศูนย์วิเคราะห์แดชบอร์ด"
          className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1.5"
        >
          {[
            { id: "compare" as const, label: "เปรียบเทียบทะเบียน & สถานะ", icon: Scale },
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
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all sm:text-sm ${
                  active
                    ? "bg-[#102b46] text-white shadow-sm"
                    : "text-slate-700 hover:bg-white/80 hover:text-[#102b46]"
                }`}
              >
                <Icon size={15} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: COMPARE & STATUS */}
      {activeTab === "compare" && (
        <div className="mt-5 grid gap-5 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <h3 className="text-base font-bold text-[#102b46]">
              เปรียบเทียบสัดส่วนทะเบียนเรื่องร้องทุกข์ และเรื่องอุทธรณ์
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {sections.map((sec) => {
                const total = sec.snapshot.totalCases;
                const pending = sec.snapshot.kpis.active;
                const done = total - pending;
                const rate = total > 0 ? (done / total) * 100 : 0;
                const isTeal = sec.accent === "teal";
                return (
                  <div
                    key={sec.title}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-[#f6f9fc] p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isTeal
                              ? "bg-teal-100 text-teal-900"
                              : "bg-blue-100 text-blue-900"
                          }`}
                        >
                          {sec.title}
                        </span>
                        <a
                          href={isTeal ? "#registry-complaint" : "#registry-appeal"}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#102b46] hover:underline"
                        >
                          ดูกราฟละเอียด <ArrowUpRight size={13} aria-hidden="true" />
                        </a>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between">
                        <div>
                          <p className="text-xs text-slate-600">อัตราแล้วเสร็จ</p>
                          <p className="text-2xl font-bold tabular-nums text-[#102b46]">
                            {total > 0 ? `${pctFmt.format(rate)}%` : "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-600">เรื่องค้างปัจจุบัน</p>
                          <p
                            className={`text-xl font-bold tabular-nums ${
                              isTeal ? "text-teal-800" : "text-blue-800"
                            }`}
                          >
                            {numberFmt.format(pending)} เรื่อง
                          </p>
                        </div>
                      </div>

                      <div
                        aria-hidden="true"
                        className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-200"
                      >
                        <span
                          className="bg-emerald-600 transition-all"
                          style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                        />
                        <span
                          className="bg-amber-500 transition-all"
                          style={{ width: `${total > 0 ? (pending / total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-3 text-xs text-slate-700">
                      <span>
                        ทั้งหมด <strong className="tabular-nums">{numberFmt.format(total)}</strong>
                      </span>
                      <span className="text-emerald-800">
                        เสร็จสิ้น <strong className="tabular-nums">{numberFmt.format(done)}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRegistry(isTeal ? "ร้องทุกข์" : "อุทธรณ์");
                          setActiveTab("explorer");
                        }}
                        className="font-bold text-cyan-800 hover:underline"
                      >
                        ค้นหาเรื่องค้าง →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Distribution */}
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-[#102b46]">
                  การกระจายตามกลุ่มสถานะสำนวน
                </h4>
                <span className="text-xs text-slate-600 tabular-nums">
                  รวม {numberFmt.format(snapshot.totalCases)} เรื่อง
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                {snapshot.statusDistribution.map((item) => {
                  const pct = snapshot.totalCases > 0 ? (item.count / snapshot.totalCases) * 100 : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800">{item.label}</span>
                        <span className="tabular-nums font-bold text-slate-900">
                          {numberFmt.format(item.count)} เรื่อง ({pctFmt.format(pct)}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${
                            item.tone === "teal"
                              ? "bg-teal-600"
                              : item.tone === "blue"
                                ? "bg-blue-600"
                                : "bg-slate-600"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column: Quick Workflow & Deadline Risk */}
          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-2xl border border-[#102b46]/15 bg-[#102b46] p-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white">
                    ทางลัดปฏิบัติการและร่างคำวินิจฉัย
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-cyan-100">
                    เชื่อมต่อฐานข้อมูลสำนวน กฎหมาย บัญชีอาวุโส และระบบร่างคำวินิจฉัยเบื้องต้น
                  </p>
                </div>
                <Sparkles className="shrink-0 text-cyan-300" size={20} aria-hidden="true" />
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {canUseAnalysis && (
                  <Link
                    href="/analysis"
                    className="flex items-center justify-between rounded-xl bg-cyan-300 px-3.5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-200"
                  >
                    <span>เปิดระบบวิเคราะห์สำนวน</span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                )}
                <Link
                  href="/cases"
                  className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  <span>รายการคดีทั้งหมด</span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
                <Link
                  href="/registry"
                  className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  <span>สารบบทะเบียนคุม</span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
                <Link
                  href="/library"
                  className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  <span>คลังความรู้กฎหมาย</span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4">
              <h4 className="text-sm font-bold text-[#102b46]">
                กรอบเวลาและสถานะความเสี่ยงของเรื่องค้าง
              </h4>
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {snapshot.deadlineRisk.map((risk) => (
                  <div
                    key={risk.label}
                    className="rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <p className="text-xs text-slate-600">{risk.label}</p>
                    <p
                      className={`mt-1 text-xl font-bold tabular-nums ${
                        risk.tone === "red" && risk.count > 0
                          ? "text-red-700"
                          : risk.tone === "amber" && risk.count > 0
                            ? "text-amber-800"
                            : "text-slate-900"
                      }`}
                    >
                      {numberFmt.format(risk.count)}
                    </p>
                  </div>
                ))}
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs text-slate-600">ยังไม่ระบุนิติกร</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                    {numberFmt.format(snapshot.kpis.unassigned)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE PENDING CASE EXPLORER */}
      {activeTab === "explorer" && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-[#f6f9fc] p-4 sm:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <label htmlFor="dashboard-case-search" className="block text-xs font-bold text-slate-700">
                ค้นหาด่วน (ชื่อผู้ร้อง / เลขดำ / เรื่อง / การดำเนินการ)
              </label>
              <div className="relative mt-1.5">
                <Search
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="dashboard-case-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="พิมพ์ชื่อผู้ร้อง เลขดำ เช่น 123/68 หรือคำค้น..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-[#102b46] focus:outline-none"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="dashboard-registry-filter" className="block text-xs font-bold text-slate-700">
                ทะเบียน
              </label>
              <select
                id="dashboard-registry-filter"
                value={selectedRegistry}
                onChange={(e) => setSelectedRegistry(e.target.value as "all" | "ร้องทุกข์" | "อุทธรณ์")}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="all">ทั้งหมด</option>
                <option value="ร้องทุกข์">เรื่องร้องทุกข์</option>
                <option value="อุทธรณ์">เรื่องอุทธรณ์</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label htmlFor="dashboard-year-filter" className="block text-xs font-bold text-slate-700">
                ปีเลขดำ
              </label>
              <select
                id="dashboard-year-filter"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
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
              <label htmlFor="dashboard-officer-filter" className="block text-xs font-bold text-slate-700">
                นิติกรผู้รับผิดชอบ
              </label>
              <select
                id="dashboard-officer-filter"
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
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

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <p>
              พบเรื่องค้างที่ตรงเงื่อนไข{" "}
              <strong className="tabular-nums text-slate-950">
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
                className="font-bold text-cyan-800 hover:underline"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>

          {!canViewDetails ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              บัญชีนี้ไม่มีสิทธิ์ดูรายละเอียดเรื่องรายสำนวน
            </p>
          ) : filteredCases.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm font-bold text-slate-800">ไม่พบสำนวนค้างที่ตรงกับตัวกรอง</p>
              <p className="mt-1 text-xs text-slate-600">ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองเพื่อดูรายการทั้งหมด</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredCases.slice(0, 30).map((item) => (
                <article
                  key={`${item.registryKind}-${item.id}`}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-white"
                >
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${
                            item.accent === "teal"
                              ? "bg-teal-100 text-teal-900"
                              : "bg-blue-100 text-blue-900"
                          }`}
                        >
                          {item.registryKind} · {item.year}
                        </span>
                        <h4 className="mt-1.5 break-words text-base font-bold text-[#102b46]">
                          {item.petitionerName || "ยังไม่ระบุชื่อผู้ร้อง"}
                        </h4>
                      </div>
                      <Link
                        href={`/cases/${item.id}`}
                        className="shrink-0 rounded-lg bg-[#102b46] px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                      >
                        เรื่องดำ {item.blackNumber}
                      </Link>
                    </div>
                    <p className="mt-2 line-clamp-2 break-words text-sm text-slate-700">
                      {item.subject}
                    </p>
                    <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs leading-5 text-slate-700 ring-1 ring-slate-200/80">
                      <strong className="text-slate-900">การดำเนินการล่าสุด:</strong>{" "}
                      {item.proceeding}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-2.5 text-xs text-slate-600">
                    <span>
                      นิติกร: <strong className="text-slate-900">{item.officer}</strong>
                    </span>
                    <div className="flex items-center gap-3">
                      {canUseAnalysis && (
                        <Link
                          href={`/analysis?case=${encodeURIComponent(item.id)}`}
                          className="font-bold text-teal-800 hover:underline"
                        >
                          วิเคราะห์สำนวนนี้ →
                        </Link>
                      )}
                      <Link
                        href={`/cases/${item.id}`}
                        className="font-bold text-[#102b46] hover:underline"
                      >
                        เปิดสำนวน
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          {filteredCases.length > 30 && (
            <p className="text-center text-xs text-slate-500">
              แสดง 30 รายการแรกจาก {numberFmt.format(filteredCases.length)} เรื่อง — ใช้ช่องค้นหาด้านบนเพื่อเจาะจงสำนวนที่ต้องการ
            </p>
          )}
        </div>
      )}

      {/* TAB 3: INTERACTIVE OFFICER WORKLOAD MATRIX */}
      {activeTab === "officers" && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-[#f6f9fc] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={officerSearch}
                onChange={(e) => setOfficerSearch(e.target.value)}
                placeholder="ค้นหาชื่อนิติกรผู้รับผิดชอบ..."
                aria-label="ค้นหาชื่อนิติกรผู้รับผิดชอบ"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">เรียงตาม:</span>
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
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    officerSort === opt.key
                      ? "bg-[#102b46] text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
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
              <tbody className="divide-y divide-slate-200 bg-white">
                {sortedOfficers.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 tabular-nums text-xs font-semibold text-slate-500">
                      {item.rank === null ? "—" : `#${item.rank}`}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#102b46]">{item.name}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900">
                      {numberFmt.format(item.total)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-800">
                      {numberFmt.format(item.completed)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-amber-800">
                      {numberFmt.format(item.pending)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900">
                      {pctFmt.format(item.completionPercent)}%
                    </td>
                    <td className="w-44 px-4 py-3">
                      <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <span
                          className="bg-emerald-600"
                          style={{ width: `${(item.completed / maxOfficerTotal) * 100}%` }}
                        />
                        <span
                          className="bg-amber-500"
                          style={{ width: `${(item.pending / maxOfficerTotal) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.pending > 0 && canViewDetails ? (
                        <button
                          type="button"
                          onClick={() => selectOfficerAndInspect(item.name)}
                          className="text-xs font-bold text-cyan-800 hover:underline"
                        >
                          ดูเรื่องค้าง ({numberFmt.format(item.pending)}) →
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">ไม่มีเรื่องค้าง</span>
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
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#102b46]">
                สำนวนเร่งด่วน / ใกล้ครบกำหนดภายใน 7 วัน
              </h3>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 tabular-nums">
                {numberFmt.format(snapshot.urgentCases.length)} เรื่อง
              </span>
            </div>
            {snapshot.urgentCases.length === 0 ? (
              <p className="mt-4 rounded-xl bg-white p-5 text-center text-xs text-slate-600">
                ไม่มีสำนวนที่เกินกำหนดหรือครบกำหนดภายใน 7 วันในขณะนี้
              </p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {snapshot.urgentCases.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/cases/${u.id}`}
                          className="text-xs font-bold text-[#102b46] hover:underline"
                        >
                          เรื่องดำ {u.blackNumber}
                        </Link>
                        <span className="text-xs text-slate-500">({u.type})</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-700">{u.subject}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        นิติกร: {u.legalOfficer} · ครบกำหนด {dateFmt.format(new Date(u.dueDate))}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums ${
                        u.daysUntilDue < 0
                          ? "bg-red-100 text-red-900"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {u.daysUntilDue < 0
                        ? `เกิน ${Math.abs(u.daysUntilDue)} วัน`
                        : `อีก ${u.daysUntilDue} วัน`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#102b46]">
                ความเคลื่อนไหวและการตรวจสอบคุณภาพข้อมูล
              </h3>
              <Link
                href="/data-quality"
                className="text-xs font-bold text-cyan-800 hover:underline"
              >
                ตรวจคุณภาพข้อมูล →
              </Link>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-600">สถานะขัดแย้งกับช่องเรื่องแดง</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
                  {numberFmt.format(snapshot.kpis.criticalDataQuality)} เรื่อง
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-600">ยังไม่ระบุวันรับเรื่อง</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
                  {numberFmt.format(snapshot.dataQuality.missingReceivedDate)} เรื่อง
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold text-slate-700">กิจกรรมล่าสุดในระบบ</p>
              {snapshot.activities.length === 0 ? (
                <p className="rounded-xl bg-white p-4 text-center text-xs text-slate-500">
                  ยังไม่มีบันทึกกิจกรรมล่าสุด
                </p>
              ) : (
                snapshot.activities.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-[#102b46]">เรื่องดำ {act.blackNumber}</span>{" "}
                      <span className="text-slate-700">· {act.action}</span>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-500">{act.actor}</span>
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
