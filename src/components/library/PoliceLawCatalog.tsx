"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Scale,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Check,
  ArrowUpRight,
  Sparkles,
  Gavel,
  FileText,
} from "lucide-react";
import { PoliceLawSection, PoliceLawAct, LawGpcScope } from "@/lib/thai-law/types";
import LawReaderModal from "./LawReaderModal";

export const LIBRARY_LAW_TRANSFER_KEY = "gpc_library_law_transfer";

const PINNED_ACT_IDS = [
  "tr-order-515-2569",
  "police-act-2565",
  "kpkt-appeal-2567",
  "kpkt-grievance-2567",
  "ktr-appointment-2567",
  "tr-circular-2456-2569",
];

const SCOPE_LABELS: Record<LawGpcScope, string> = {
  all: "ทั้งหมด",
  appeal_discipline: "อุทธรณ์ / วินัยตำรวจ",
  grievance_appointment: "ร้องทุกข์ / แต่งตั้ง",
  criminal: "อาญาและวิธีพิจารณา",
  admin: "ปกครอง / ละเมิด / ข้อมูล",
  security: "ความมั่นคงและอื่นๆ",
};

function resolveTargetTierForLaw(actId: string, category?: string, content?: string): "discipline_appeal" | "sub_general" | "general" {
  if (actId === "tr-circular-2456-2569") return "sub_general";
  if (actId === "ktr-appointment-2567" || actId === "kpkt-grievance-2567" || actId === "ktr-petition-2547") {
    return "general";
  }
  if (
    actId === "tr-order-515-2569" ||
    actId === "kpkt-appeal-2567" ||
    actId.startsWith("ktr-inquiry") ||
    actId.startsWith("ktr-punish") ||
    actId.startsWith("ktr-suspend") ||
    actId.startsWith("ktr-investigation") ||
    actId.startsWith("ktr-flagrant") ||
    actId.startsWith("ktr-filter") ||
    actId.startsWith("ktr-discharge") ||
    actId.startsWith("ktr-restore") ||
    actId.startsWith("ktr-order-manner")
  ) {
    return "discipline_appeal";
  }
  if (actId === "police-act-2565" && content) {
    if (/(แต่งตั้ง|อาวุโส|ร้องทุกข์|มาตรา\s*(?:77|78|79|80|81|82|85|87|147|๗๗|๗๘|๗๙|๘๐|๘๑|๘๒|๘๕|๘๗|๑๔๗))/.test(content)) {
      return "general";
    }
    if (/(วินัย|อุทธรณ์|ปลดออก|ไล่ออก|พักราชการ|สอบสวน|มาตรา\s*(?:105|112|116|117|119|125|126|131|138|141|๑๐๕|๑๑๒|๑๑๖|๑๑๗|๑๑๙|๑๒๕|๑๒๖|๑๓๑|๑๓๘|๑๔๑))/.test(content)) {
      return "discipline_appeal";
    }
  }
  return category === "วินัย อุทธรณ์ ร้องทุกข์" ? "discipline_appeal" : "discipline_appeal";
}

function getScopeTag(act: PoliceLawAct | undefined) {
  if (!act) return null;
  if (act.id === "police-act-2565") {
    return {
      text: "กฎหมายแม่บท (อุทธรณ์ & ร้องทุกข์)",
      cls: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
    };
  }
  if (act.gpcScope === "appeal_discipline") {
    return {
      text: "อุทธรณ์ ก.พ.ค.ตร. (วินัย)",
      cls: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
    };
  }
  if (act.gpcScope === "grievance_appointment") {
    return {
      text: "ร้องทุกข์ ก.พ.ค.ตร. (แต่งตั้ง)",
      cls: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    };
  }
  return null;
}

interface PoliceLawCatalogProps {
  initialActId?: string | null;
  initialQuery?: string;
}

export default function PoliceLawCatalog({ initialActId = null, initialQuery = "" }: PoliceLawCatalogProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [activeScope, setActiveScope] = useState<LawGpcScope>("all");
  const [selectedActId, setSelectedActId] = useState<string>(initialActId || "all");
  const [hideRepealed, setHideRepealed] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(18);

  const [items, setItems] = useState<PoliceLawSection[]>([]);
  const [acts, setActs] = useState<PoliceLawAct[]>([]);
  const [scopes, setScopes] = useState<{ id: LawGpcScope; label: string; count: number; actCount: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Searchable Law Picker Popover state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [actFilterText, setActFilterText] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Selected section for full text reading modal
  const [readingSectionId, setReadingSectionId] = useState<string | null>(null);

  useEffect(() => {
    if (initialActId) {
      setSelectedActId(initialActId);
      setActiveScope("all");
      setPage(1);
    }
  }, [initialActId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    if (pickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerOpen]);

  const fetchResults = useCallback(
    (qStr: string, scopeStr: LawGpcScope, actStr: string, hideRep: boolean, pageNum: number) => {
      setLoading(true);
      const params = new URLSearchParams({
        q: qStr,
        scope: scopeStr,
        actId: actStr,
        hideRepealed: hideRep ? "1" : "0",
        page: String(pageNum),
        pageSize: String(pageSize),
      });

      fetch(`/api/thai-law?${params.toString()}`)
        .then((res) => {
          if (!res.ok) throw new Error("Search failed");
          return res.json();
        })
        .then((data) => {
          setItems(data.items || []);
          setActs(data.acts || []);
          setScopes(data.scopes || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading law catalog:", err);
          setLoading(false);
        });
    },
    [pageSize]
  );

  useEffect(() => {
    fetchResults(query, activeScope, selectedActId, hideRepealed, page);
  }, [fetchResults, page, activeScope, selectedActId, hideRepealed]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchResults(query, activeScope, selectedActId, hideRepealed, 1);
  };

  const handleSelectAct = (actId: string) => {
    setSelectedActId(actId);
    setPickerOpen(false);
    setActFilterText("");
    setPage(1);
    fetchResults(query, activeScope, actId, hideRepealed, 1);
  };

  const handleSelectScope = (scopeId: LawGpcScope) => {
    setActiveScope(scopeId);
    setSelectedActId("all");
    setPage(1);
    fetchResults(query, scopeId, "all", hideRepealed, 1);
  };

  const handleResetAll = () => {
    setQuery("");
    setActiveScope("all");
    setSelectedActId("all");
    setPage(1);
    fetchResults("", "all", "all", hideRepealed, 1);
  };

  const selectedAct = useMemo(
    () => acts.find((a) => a.id === selectedActId) || null,
    [acts, selectedActId]
  );

  const pinnedActs = useMemo(
    () =>
      PINNED_ACT_IDS.map((id) => acts.find((a) => a.id === id)).filter(Boolean) as PoliceLawAct[],
    [acts]
  );

  // Acts visible inside the searchable law picker, grouped cleanly by GPC scope
  const pickerGroupedActs = useMemo(() => {
    const q = actFilterText.trim().toLowerCase();
    const visible = acts.filter((a) => {
      if (hideRepealed && a.isRepealed && a.id !== selectedActId) return false;
      if (!q) return true;
      const hay = `${a.title} ${a.shortTitle || ""} ${a.sysid} ${a.category}`.toLowerCase();
      return hay.includes(q);
    });

    const groups: { scope: Exclude<LawGpcScope, "all">; label: string; acts: PoliceLawAct[] }[] = [
      { scope: "appeal_discipline", label: "อุทธรณ์ ก.พ.ค.ตร. / วินัยตำรวจ", acts: [] },
      { scope: "grievance_appointment", label: "ร้องทุกข์ ก.พ.ค.ตร. / แต่งตั้งโยกย้าย", acts: [] },
      { scope: "criminal", label: "กฎหมายอาญาและวิธีพิจารณา", acts: [] },
      { scope: "admin", label: "กฎหมายปกครอง / ละเมิด / ข้อมูล", acts: [] },
      { scope: "security", label: "ความมั่นคงและกฎหมายเฉพาะทาง", acts: [] },
    ];

    for (const act of visible) {
      const grp = groups.find((g) => g.scope === (act.gpcScope || "security")) || groups[4];
      grp.acts.push(act);
    }

    return groups.filter((g) => g.acts.length > 0);
  }, [acts, actFilterText, hideRepealed, selectedActId]);

  const handleSendToAnalysis = (payload: {
    actId: string;
    actTitle: string;
    sectionId?: string;
    sectionLabel?: string;
    content?: string;
    category?: string;
  }) => {
    const targetTier = resolveTargetTierForLaw(payload.actId, payload.category, payload.content);
    try {
      window.sessionStorage.setItem(
        LIBRARY_LAW_TRANSFER_KEY,
        JSON.stringify({
          actId: payload.actId,
          actTitle: payload.actTitle,
          sectionId: payload.sectionId || null,
          sectionLabel: payload.sectionLabel || null,
          content: payload.content || null,
          targetTier,
          transferredAt: new Date().toISOString(),
        })
      );
    } catch {
      // Ignore storage error
    }
    router.push(`/analysis?tier=${targetTier}`);
  };

  const selectedActScopeTag = getScopeTag(selectedAct || undefined);

  return (
    <div className="space-y-5">
      {/* Clean Unified Search + Easy Law Selector Box */}
      <div className="rounded-2xl bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-white/10 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* 1. Easy Searchable Law Picker */}
          <div ref={pickerRef} className="relative lg:w-[340px] shrink-0">
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              aria-expanded={pickerOpen}
              className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-left text-sm transition-all ${
                selectedAct
                  ? "border-[#d62839]/60 bg-red-50/40 dark:bg-red-950/20 text-slate-900 dark:text-white"
                  : "border-slate-200 dark:border-white/15 bg-slate-50/70 dark:bg-[#18181e] text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-white/25"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Scale className="h-4 w-4 text-[#d62839] shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium leading-none mb-0.5">
                    เลือกฉบับกฎหมาย
                  </div>
                  <div className="truncate font-semibold text-xs sm:text-sm">
                    {selectedAct ? selectedAct.shortTitle || selectedAct.title : `กฎหมายทุกฉบับ (${acts.filter((a) => !hideRepealed || !a.isRepealed).length} ฉบับ)`}
                  </div>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${pickerOpen ? "rotate-180" : ""}`} />
            </button>

            {pickerOpen && (
              <div className="absolute left-0 top-full mt-2 z-40 w-full sm:w-[440px] rounded-2xl bg-white dark:bg-[#16161c] border border-slate-200 dark:border-white/15 shadow-2xl overflow-hidden">
                <div className="p-3 border-b border-slate-100 dark:border-white/10 space-y-2.5 bg-slate-50/70 dark:bg-[#1b1b22]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      value={actFilterText}
                      onChange={(e) => setActFilterText(e.target.value)}
                      placeholder="พิมพ์ชื่อกฎหมาย หรือเลขที่ เช่น 515, วินัย, อุทธรณ์, แต่งตั้ง..."
                      className="w-full pl-9 pr-8 py-2 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d62839]/30 focus:border-[#d62839]"
                    />
                    {actFilterText && (
                      <button
                        type="button"
                        onClick={() => setActFilterText("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <button
                      type="button"
                      onClick={() => handleSelectAct("all")}
                      className={`px-2 py-1 rounded-md font-medium transition-colors ${
                        selectedActId === "all"
                          ? "bg-[#d62839] text-white"
                          : "hover:bg-slate-200/70 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      แสดงทุกฉบับ
                    </button>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hideRepealed}
                        onChange={(e) => setHideRepealed(e.target.checked)}
                        className="rounded border-slate-300 text-[#d62839] focus:ring-[#d62839]"
                      />
                      <span>ซ่อนฉบับที่ยกเลิกแล้ว</span>
                    </label>
                  </div>
                </div>

                <div className="max-h-[380px] overflow-y-auto p-2 space-y-3">
                  {pickerGroupedActs.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      ไม่พบชื่อกฎหมายที่ตรงกับ &quot;{actFilterText}&quot;
                    </div>
                  ) : (
                    pickerGroupedActs.map((group) => (
                      <div key={group.scope}>
                        <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                          {group.label}
                        </div>
                        <div className="space-y-0.5">
                          {group.acts.map((act) => {
                            const isSelected = act.id === selectedActId;
                            return (
                              <button
                                key={act.id}
                                type="button"
                                onClick={() => handleSelectAct(act.id)}
                                className={`w-full flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg text-left transition-colors ${
                                  isSelected
                                    ? "bg-red-50 dark:bg-red-950/40 text-[#d62839] dark:text-red-300"
                                    : "hover:bg-slate-100/80 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-semibold leading-snug">
                                      {act.shortTitle || act.title}
                                    </span>
                                    {act.isNew && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 font-bold">
                                        ใหม่ ๒๕๖๙
                                      </span>
                                    )}
                                    {act.isRepealed && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-400">
                                        ยกเลิกแล้ว
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                    {act.title}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {act.sectionCount || 0}
                                  </span>
                                  {isSelected && <Check className="h-3.5 w-3.5 text-[#d62839]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Clean Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาเลขมาตรา ข้อ หรือคำสำคัญ เช่น 515, 141, 126, มอบอำนาจวินัย, อาวุโส..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50/70 dark:bg-[#18181e] border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#d62839]/25 focus:border-[#d62839] transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setPage(1);
                    fetchResults("", activeScope, selectedActId, hideRepealed, 1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  title="ล้างคำค้น"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#d62839] hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-xs shrink-0"
            >
              ค้นหา
            </button>
          </form>
        </div>

        {/* Pinned Core Laws (1-Click Quick Pick) */}
        {pinnedActs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-white/5">
            <span className="text-[11px] font-medium text-slate-400 mr-1">กฎหมายหลัก:</span>
            {pinnedActs.map((act) => {
              const isSelected = selectedActId === act.id;
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => handleSelectAct(isSelected ? "all" : act.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    isSelected
                      ? "bg-[#d62839] text-white border-[#d62839] shadow-xs"
                      : act.id === "tr-order-515-2569"
                        ? "bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-amber-300/80 dark:border-amber-700/50 hover:border-amber-400"
                        : "bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
                  }`}
                >
                  {act.id === "tr-order-515-2569" && !isSelected && (
                    <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  )}
                  <span>{act.shortTitle}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* GPC Scope Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {(scopes.length > 0
              ? scopes
              : (Object.keys(SCOPE_LABELS) as LawGpcScope[]).map((id) => ({
                  id,
                  label: SCOPE_LABELS[id],
                  count: 0,
                  actCount: 0,
                }))
            ).map((sc) => {
              const isActive = selectedActId === "all" && activeScope === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelectScope(sc.id)}
                  className={`shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  <span>{sc.label}</span>
                  {sc.actCount > 0 && (
                    <span
                      className={`text-[10px] ${
                        isActive ? "opacity-80" : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {sc.actCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <label className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={hideRepealed}
              onChange={(e) => {
                setHideRepealed(e.target.checked);
                setPage(1);
              }}
              className="rounded border-slate-300 text-[#d62839] focus:ring-[#d62839]"
            />
            <span>ซ่อนฉบับยกเลิกแล้ว</span>
          </label>
        </div>
      </div>

      {/* Selected Law Context Banner (appears only when user picks a specific law) */}
      {selectedAct && (
        <div className="rounded-xl bg-slate-50 dark:bg-[#16161c] border border-slate-200/90 dark:border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {selectedAct.isNew && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  <Sparkles className="h-3 w-3" />
                  อัปเดตล่าสุด ๒๕๖๙
                </span>
              )}
              {selectedActScopeTag && (
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${selectedActScopeTag.cls}`}>
                  <Gavel className="h-3 w-3" />
                  {selectedActScopeTag.text}
                </span>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {selectedAct.sectionCount || total} มาตรา/ข้อ
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
              {selectedAct.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{selectedAct.source}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                handleSendToAnalysis({
                  actId: selectedAct.id,
                  actTitle: selectedAct.title,
                  category: selectedAct.category,
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#d62839] hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <span>นำไปใช้วิเคราะห์</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleSelectAct("all")}
              className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              ดูทุกฉบับ
            </button>
          </div>
        </div>
      )}

      {/* Results Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-0.5">
        <div>
          {loading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#d62839]" />
              กำลังโหลดตัวบทกฎหมาย...
            </span>
          ) : (
            <span>
              แสดง <strong className="text-slate-900 dark:text-white font-semibold">{total.toLocaleString()}</strong> มาตรา/ข้อ
              {query && (
                <span>
                  {" "}สำหรับ &quot;<strong className="text-slate-800 dark:text-slate-200">{query}</strong>&quot;
                </span>
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {(query || selectedActId !== "all" || activeScope !== "all") && (
            <button
              type="button"
              onClick={handleResetAll}
              className="text-xs text-[#d62839] hover:underline font-medium"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
          {totalPages > 1 && (
            <span>
              หน้า {page} / {totalPages}
            </span>
          )}
        </div>
      </div>

      {/* Clean Results Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2.5">
          <Loader2 className="h-7 w-7 animate-spin text-[#d62839]" />
          <p className="text-xs">กำลังค้นหาข้อกฎหมาย...</p>
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const actMeta = acts.find((a) => a.id === item.actId);
            return (
              <article
                key={item.id}
                onClick={() => setReadingSectionId(item.id)}
                className="group cursor-pointer flex flex-col justify-between rounded-xl p-5 bg-white dark:bg-[#141419] border border-slate-200/90 dark:border-white/10 hover:border-[#d62839]/50 dark:hover:border-red-500/50 shadow-2xs hover:shadow-md transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate"
                      title={item.actTitle}
                    >
                      {actMeta?.shortTitle || item.actTitle}
                    </span>
                    {actMeta?.isNew && (
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold">
                        ใหม่ ๒๕๖๙
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#d62839] dark:group-hover:text-red-400 transition-colors">
                      {item.sectionLabel}
                    </h3>
                    {item.sectionNumArabic && item.sectionNumArabic !== item.sectionNum && item.sectionNumArabic !== "0" && (
                      <span className="text-xs text-slate-400 font-mono">
                        ({item.sectionNumArabic})
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
                    {item.excerpt}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReadingSectionId(item.id);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#d62839] dark:hover:text-red-400 transition-colors"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>อ่านฉบับเต็ม</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendToAnalysis({
                        actId: item.actId,
                        actTitle: item.actTitle,
                        sectionId: item.id,
                        sectionLabel: item.sectionLabel,
                        content: item.content,
                        category: item.category,
                      });
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-[#d62839] text-slate-700 hover:text-white dark:bg-white/10 dark:text-slate-200 dark:hover:bg-[#d62839] transition-colors"
                    title="ดึงมาตรานี้ไปใช้วิเคราะห์ทันที"
                  >
                    <FileText className="h-3 w-3" />
                    <span>ใช้วิเคราะห์</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="py-14 text-center rounded-xl bg-slate-50/70 dark:bg-[#141419] border border-slate-200 dark:border-white/10 p-6 space-y-2.5">
          <Scale className="h-8 w-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            ไม่พบข้อกฎหมายที่ตรงกับเงื่อนไข
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            ลองพิมพ์เฉพาะเลขมาตรา/ข้อ (เช่น 515, 141, 126) หรือเปลี่ยนฉบับกฎหมายที่เลือก
          </p>
          <button
            type="button"
            onClick={handleResetAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#d62839] text-white hover:bg-red-700 transition-colors"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 120, behavior: "smooth" });
            }}
            disabled={page <= 1 || loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#18181e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>ก่อนหน้า</span>
          </button>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            หน้า {page} จาก {totalPages}
          </span>

          <button
            type="button"
            onClick={() => {
              setPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 120, behavior: "smooth" });
            }}
            disabled={page >= totalPages || loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#18181e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span>ถัดไป</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Full Text Reader Modal */}
      {readingSectionId && (
        <LawReaderModal
          sectionId={readingSectionId}
          onClose={() => setReadingSectionId(null)}
          onSelectSection={(newId) => setReadingSectionId(newId)}
          onSendToAnalysis={(sec) => {
            setReadingSectionId(null);
            handleSendToAnalysis({
              actId: sec.actId,
              actTitle: sec.actTitle,
              sectionId: sec.id,
              sectionLabel: sec.sectionLabel,
              content: sec.content,
              category: sec.category,
            });
          }}
        />
      )}
    </div>
  );
}
