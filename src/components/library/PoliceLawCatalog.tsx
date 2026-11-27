"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Scale,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  Copy,
  ArrowUpRight,
  Sparkles,
  Gavel,
  FileText,
  ExternalLink,
  AlignLeft,
  List,
  ShieldCheck,
} from "lucide-react";
import { PoliceLawSection, PoliceLawAct, LawGpcScope } from "@/lib/thai-law/types";
import LawReaderModal from "./LawReaderModal";
import LawPdfViewerModal, { LawPdfViewerTarget } from "./LawPdfViewerModal";

export const LIBRARY_LAW_TRANSFER_KEY = "gpc_library_law_transfer";

const PINNED_ACT_IDS = [
  "tr-order-515-2569",
  "ktr-discipline-2569",
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

const LONG_SECTION_THRESHOLD = 680;

function resolveTargetTierForLaw(
  actId: string,
  category?: string,
  content?: string
): "discipline_appeal" | "sub_general" | "general" {
  if (actId === "tr-circular-2456-2569") return "sub_general";
  if (
    actId === "ktr-appointment-2567" ||
    actId === "kpkt-grievance-2567" ||
    actId === "ktr-petition-2547"
  ) {
    return "general";
  }
  if (
    actId === "tr-order-515-2569" ||
    actId === "ktr-discipline-2569" ||
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
    if (
      /(แต่งตั้ง|อาวุโส|ร้องทุกข์|มาตรา\s*(?:77|78|79|80|81|82|85|87|147|148|149|๗๗|๗๘|๗๙|๘๐|๘๑|๘๒|๘๕|๘๗|๑๔๗|๑๔๘|๑๔๙))/.test(
        content
      )
    ) {
      return "general";
    }
    if (
      /(วินัย|อุทธรณ์|ปลดออก|ไล่ออก|พักราชการ|สอบสวน|มาตรา\s*(?:105|112|115|116|117|119|120|124|125|126|127|131|137|138|141|142|๑๐๕|๑๑๒|๑๑๕|๑๑๖|๑๑๗|๑๑๙|๑๒๐|๑๒๔|๑๒๕|๑๒๖|๑๒๗|๑๓๑|๑๓๗|๑๓๘|๑๔๑|๑๔๒))/.test(
        content
      )
    ) {
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

export default function PoliceLawCatalog({
  initialActId = null,
  initialQuery = "",
}: PoliceLawCatalogProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [activeScope, setActiveScope] = useState<LawGpcScope>("all");
  const [selectedActId, setSelectedActId] = useState<string>(initialActId || "all");
  const [hideRepealed, setHideRepealed] = useState(true);
  const [viewMode, setViewMode] = useState<"document" | "compact">("document");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  const [items, setItems] = useState<PoliceLawSection[]>([]);
  const [acts, setActs] = useState<PoliceLawAct[]>([]);
  const [scopes, setScopes] = useState<
    { id: LawGpcScope; label: string; count: number; actCount: number }[]
  >([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Expanded long sections & copied feedback
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Searchable Law Picker Popover state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [actFilterText, setActFilterText] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Modals: Full-section reader & Royal Gazette PDF Viewer
  const [readingSectionId, setReadingSectionId] = useState<string | null>(null);
  const [pdfTarget, setPdfTarget] = useState<LawPdfViewerTarget | null>(null);

  // Track committed search query separately from live input text
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [prevInitialActId, setPrevInitialActId] = useState<string | null>(initialActId);

  if (initialActId && initialActId !== prevInitialActId) {
    setPrevInitialActId(initialActId);
    setSelectedActId(initialActId);
    setActiveScope("all");
    setPage(1);
  }

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

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      q: submittedQuery,
      scope: activeScope,
      actId: selectedActId,
      hideRepealed: hideRepealed ? "1" : "0",
      page: String(page),
      pageSize: String(pageSize),
    });

    fetch(`/api/thai-law?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Search failed");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items || []);
        setActs(data.acts || []);
        setScopes(data.scopes || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Error loading law catalog:", err);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [submittedQuery, activeScope, selectedActId, hideRepealed, page, pageSize]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setPage(1);
    setSubmittedQuery(query);
  };

  const handleSelectAct = (actId: string) => {
    setLoading(true);
    setSelectedActId(actId);
    setPickerOpen(false);
    setActFilterText("");
    setPage(1);
  };

  const handleSelectScope = (scopeId: LawGpcScope) => {
    setLoading(true);
    setActiveScope(scopeId);
    setSelectedActId("all");
    setPage(1);
  };

  const handleResetAll = () => {
    setLoading(true);
    setQuery("");
    setSubmittedQuery("");
    setActiveScope("all");
    setSelectedActId("all");
    setPage(1);
  };

  const handleCopySection = (item: PoliceLawSection) => {
    const textToCopy = `${item.actTitle}\n${item.sectionLabel}\n\n${item.content}${
      item.notes ? `\n\nหมายเหตุ: ${item.notes}` : ""
    }\n(แหล่งที่มา: ${item.source})`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === item.id ? null : prev));
    }, 1800);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openActPdf = (act: PoliceLawAct) => {
    if (!act.officialPdfUrl) return;
    setPdfTarget({
      title: act.shortTitle || act.title,
      subtitle: act.officialPdfLabel,
      pdfUrl: act.officialPdfUrl,
      source: act.source,
    });
  };

  const openSectionPdf = (item: PoliceLawSection, actMeta?: PoliceLawAct) => {
    const url = item.officialPdfUrl || actMeta?.officialPdfUrl;
    if (!url) return;
    setPdfTarget({
      title: `${actMeta?.shortTitle || item.actTitle} · ${item.sectionLabel}`,
      subtitle: item.officialPdfLabel || actMeta?.officialPdfLabel,
      pdfUrl: url,
      source: item.source,
    });
  };

  const selectedAct = useMemo(
    () => acts.find((a) => a.id === selectedActId) || null,
    [acts, selectedActId]
  );

  const pinnedActs = useMemo(
    () =>
      PINNED_ACT_IDS.map((id) => acts.find((a) => a.id === id)).filter(
        Boolean
      ) as PoliceLawAct[],
    [acts]
  );

  const pickerGroupedActs = useMemo(() => {
    const q = actFilterText.trim().toLowerCase();
    const visible = acts.filter((a) => {
      if (hideRepealed && a.isRepealed && a.id !== selectedActId) return false;
      if (!q) return true;
      const hay = `${a.title} ${a.shortTitle || ""} ${a.sysid} ${a.category}`.toLowerCase();
      return hay.includes(q);
    });

    const groups: {
      scope: Exclude<LawGpcScope, "all">;
      label: string;
      acts: PoliceLawAct[];
    }[] = [
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
    const targetTier = resolveTargetTierForLaw(
      payload.actId,
      payload.category,
      payload.content
    );
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
          <div ref={pickerRef} className="relative lg:w-[350px] shrink-0">
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
                    {selectedAct
                      ? selectedAct.shortTitle || selectedAct.title
                      : `กฎหมายทุกฉบับ (${acts.filter((a) => !hideRepealed || !a.isRepealed).length} ฉบับ)`}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${
                  pickerOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {pickerOpen && (
              <div className="absolute left-0 top-full mt-2 z-40 w-full sm:w-[460px] rounded-2xl bg-white dark:bg-[#16161c] border border-slate-200 dark:border-white/15 shadow-2xl overflow-hidden">
                <div className="p-3 border-b border-slate-100 dark:border-white/10 space-y-2.5 bg-slate-50/70 dark:bg-[#1b1b22]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      value={actFilterText}
                      onChange={(e) => setActFilterText(e.target.value)}
                      placeholder="พิมพ์ชื่อกฎหมาย หรือเลขที่ เช่น 515, วินัย 2569, อุทธรณ์, แต่งตั้ง..."
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
                      ไม่พบชื่อกฎหมายที่ตรงกับ &ldquo;{actFilterText}&rdquo;
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
                                    {act.officialPdfUrl && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 font-semibold">
                                        PDF ราชกิจจาฯ
                                      </span>
                                    )}
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
                placeholder="ค้นหาเลขมาตรา ข้อ หรือคำสำคัญ เช่น 141, 125, 515, มอบอำนาจวินัย, อาวุโส..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50/70 dark:bg-[#18181e] border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#d62839]/25 focus:border-[#d62839] transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setQuery("");
                    setSubmittedQuery("");
                    setPage(1);
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

        {/* Pinned Core Laws (1-Click Quick Pick + Direct PDF Access) */}
        {pinnedActs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-white/5">
            <span className="text-[11px] font-medium text-slate-400 mr-1">
              กฎหมายหลัก (มี PDF ราชกิจจาฯ):
            </span>
            {pinnedActs.map((act) => {
              const isSelected = selectedActId === act.id;
              return (
                <div
                  key={act.id}
                  className={`inline-flex items-center rounded-full border transition-all overflow-hidden ${
                    isSelected
                      ? "bg-[#d62839] text-white border-[#d62839] shadow-xs"
                      : act.id === "tr-order-515-2569" || act.id === "ktr-discipline-2569"
                        ? "bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-amber-300/80 dark:border-amber-700/50"
                        : "bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectAct(isSelected ? "all" : act.id)}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 text-xs font-medium hover:opacity-85 transition-opacity"
                  >
                    {(act.id === "tr-order-515-2569" || act.id === "ktr-discipline-2569") &&
                      !isSelected && (
                        <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      )}
                    <span>{act.shortTitle}</span>
                  </button>
                  {act.officialPdfUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openActPdf(act);
                      }}
                      title={`เปิดไฟล์ PDF ต้นฉบับ: ${act.shortTitle}`}
                      className={`inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-bold border-l transition-colors ${
                        isSelected
                          ? "border-white/25 bg-black/15 hover:bg-black/25 text-white"
                          : "border-slate-200/80 dark:border-white/10 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      <FileText className="h-2.5 w-2.5" />
                      <span>PDF</span>
                    </button>
                  )}
                </div>
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
                setLoading(true);
                setHideRepealed(e.target.checked);
                setPage(1);
              }}
              className="rounded border-slate-300 text-[#d62839] focus:ring-[#d62839]"
            />
            <span>ซ่อนฉบับยกเลิกแล้ว</span>
          </label>
        </div>
      </div>

      {/* Selected Law Context Header (with Prominent Royal Gazette PDF Button) */}
      {selectedAct && (
        <div className="rounded-2xl bg-slate-50 dark:bg-[#16161c] border border-slate-200/90 dark:border-white/10 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {selectedAct.officialPdfUrl && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <ShieldCheck className="h-3 w-3" />
                  ตรวจเทียบฉบับราชกิจจานุเบกษาแล้ว
                </span>
              )}
              {selectedAct.isNew && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  <Sparkles className="h-3 w-3" />
                  อัปเดตล่าสุด ๒๕๖๙
                </span>
              )}
              {selectedActScopeTag && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${selectedActScopeTag.cls}`}
                >
                  <Gavel className="h-3 w-3" />
                  {selectedActScopeTag.text}
                </span>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {selectedAct.sectionCount || total} มาตรา/ข้อ
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {selectedAct.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{selectedAct.source}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {selectedAct.officialPdfUrl ? (
              <button
                type="button"
                onClick={() => openActPdf(selectedAct)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>เปิด PDF ราชกิจจาฯ ต้นฉบับ</span>
              </button>
            ) : selectedAct.sourceUrl ? (
              <a
                href={selectedAct.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-semibold transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>เปิดต้นฉบับราชกิจจาฯ/กฤษฎีกา</span>
              </a>
            ) : null}

            <button
              type="button"
              onClick={() =>
                handleSendToAnalysis({
                  actId: selectedAct.id,
                  actTitle: selectedAct.title,
                  category: selectedAct.category,
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#d62839] hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <span>นำไปใช้วิเคราะห์</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleSelectAct("all")}
              className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              ดูทุกฉบับ
            </button>
          </div>
        </div>
      )}

      {/* Results Counter + Reading Layout Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-0.5">
        <div>
          {loading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#d62839]" />
              กำลังโหลดตัวบทกฎหมาย...
            </span>
          ) : (
            <span>
              แสดง{" "}
              <strong className="text-slate-900 dark:text-white font-semibold">
                {total.toLocaleString()}
              </strong>{" "}
              มาตรา/ข้อ
              {submittedQuery && (
                <span>
                  {" "}
                  สำหรับ &ldquo;
                  <strong className="text-slate-800 dark:text-slate-200">{submittedQuery}</strong>
                  &rdquo;
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

          {/* Reading Mode Toggle: Document (default) vs Compact Index */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181e] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("document")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                viewMode === "document"
                  ? "bg-white dark:bg-[#24242d] text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              }`}
              title="แสดงเนื้อหาตัวบทแบบอ่านต่อเนื่องเหมือนประมวลกฎหมาย"
            >
              <AlignLeft className="h-3 w-3" />
              <span>ตัวบทอ่านง่าย</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("compact")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                viewMode === "compact"
                  ? "bg-white dark:bg-[#24242d] text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              }`}
              title="แสดงแบบสารบัญรายการย่อเพื่อกวาดตาเร็ว"
            >
              <List className="h-3 w-3" />
              <span>สารบัญย่อ</span>
            </button>
          </div>

          {totalPages > 1 && (
            <span className="hidden sm:inline">
              หน้า {page} / {totalPages}
            </span>
          )}
        </div>
      </div>

      {/* Main Statute List (Clean Legal Document View — No Awkward Card Boxes) */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2.5">
          <Loader2 className="h-7 w-7 animate-spin text-[#d62839]" />
          <p className="text-xs">กำลังโหลดตัวบทกฎหมาย...</p>
        </div>
      ) : items.length > 0 ? (
        viewMode === "document" ? (
          <div className="rounded-2xl bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-white/10 shadow-2xs overflow-hidden divide-y divide-slate-200/75 dark:divide-white/8">
            {items.map((item) => {
              const actMeta = acts.find((a) => a.id === item.actId);
              const pdfUrl = item.officialPdfUrl || actMeta?.officialPdfUrl;
              const isLong = item.content.length > LONG_SECTION_THRESHOLD;
              const isExpanded = Boolean(expandedIds[item.id]);
              const displayContent =
                isLong && !isExpanded
                  ? `${item.content.slice(0, LONG_SECTION_THRESHOLD).trimEnd()}...`
                  : item.content;
              const showActBadge = selectedActId === "all";

              return (
                <article
                  key={item.id}
                  className="px-5 py-5 sm:px-7 sm:py-6 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6">
                    {/* Left Statute Number Column */}
                    <div className="sm:w-44 shrink-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-red-50/90 dark:bg-red-950/50 border border-red-200/80 dark:border-red-900/50 text-sm font-bold text-[#b81d2d] dark:text-red-300">
                          {item.sectionLabel}
                        </span>
                        {item.sectionNumArabic &&
                          item.sectionNumArabic !== item.sectionNum &&
                          item.sectionNumArabic !== "0" && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({item.sectionNumArabic})
                            </span>
                          )}
                      </div>

                      {showActBadge && (
                        <button
                          type="button"
                          onClick={() => handleSelectAct(item.actId)}
                          className="block text-left text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-[#d62839] dark:hover:text-red-400 leading-snug transition-colors"
                          title={`กรองดูเฉพาะ ${item.actTitle}`}
                        >
                          {actMeta?.shortTitle || item.actTitle}
                        </button>
                      )}

                      {actMeta?.isNew && showActBadge && (
                        <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold">
                          ใหม่ ๒๕๖๙
                        </span>
                      )}
                    </div>

                    {/* Right Readable Statute Body */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="text-[14.5px] sm:text-[15px] text-slate-800 dark:text-slate-200 leading-[1.85] whitespace-pre-line font-normal">
                        {displayContent}
                      </div>

                      {isLong && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#d62839] dark:text-red-400 hover:underline"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3.5 w-3.5" />
                              <span>ย่อข้อความลง</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3.5 w-3.5" />
                              <span>แสดงเนื้อหาเต็มของมาตรานี้</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Subtle Action Strip */}
                      <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                        {pdfUrl ? (
                          <button
                            type="button"
                            onClick={() => openSectionPdf(item, actMeta)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white border border-emerald-200/80 dark:border-emerald-800/60 font-medium transition-colors"
                            title="เปิดดูไฟล์ PDF ต้นฉบับราชกิจจานุเบกษาเพื่อเทียบตัวบท"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>เปิด PDF ราชกิจจาฯ</span>
                          </button>
                        ) : item.sourceUrl ? (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 font-medium transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>ต้นฉบับกฤษฎีกา</span>
                          </a>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => handleCopySection(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 font-medium transition-colors"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-700 dark:text-emerald-400">คัดลอกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>คัดลอก</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setReadingSectionId(item.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 font-medium transition-colors"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>อ่านเต็มจอ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSendToAnalysis({
                              actId: item.actId,
                              actTitle: item.actTitle,
                              sectionId: item.id,
                              sectionLabel: item.sectionLabel,
                              content: item.content,
                              category: item.category,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-[#d62839] text-[#b81d2d] hover:text-white dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-[#d62839] dark:hover:text-white font-semibold transition-colors sm:ml-auto"
                          title="ดึงมาตรานี้ไปใช้วิเคราะห์ทันที"
                        >
                          <Scale className="h-3 w-3" />
                          <span>ใช้วิเคราะห์</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Compact Index View (Clean Table-like Rows for Rapid Scanning) */
          <div className="rounded-2xl bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-white/10 shadow-2xs overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
            {items.map((item) => {
              const actMeta = acts.find((a) => a.id === item.actId);
              const pdfUrl = item.officialPdfUrl || actMeta?.officialPdfUrl;
              return (
                <div
                  key={item.id}
                  onClick={() => setReadingSectionId(item.id)}
                  className="group cursor-pointer px-4 sm:px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                >
                  <div className="sm:w-44 shrink-0 flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#d62839] dark:group-hover:text-red-400 transition-colors">
                      {item.sectionLabel}
                    </span>
                    {item.sectionNumArabic &&
                      item.sectionNumArabic !== item.sectionNum &&
                      item.sectionNumArabic !== "0" && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          ({item.sectionNumArabic})
                        </span>
                      )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {selectedActId === "all" && (
                      <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate">
                        {actMeta?.shortTitle || item.actTitle}
                      </div>
                    )}
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 truncate">
                      {item.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {pdfUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openSectionPdf(item, actMeta);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/50 dark:text-emerald-300 transition-colors"
                      >
                        <FileText className="h-3 w-3" />
                        <span>PDF</span>
                      </button>
                    )}
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
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-[#d62839] hover:text-white dark:bg-white/10 dark:text-slate-200 transition-colors"
                    >
                      <span>ใช้วิเคราะห์</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="py-14 text-center rounded-2xl bg-slate-50/70 dark:bg-[#141419] border border-slate-200 dark:border-white/10 p-6 space-y-2.5">
          <Scale className="h-8 w-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            ไม่พบข้อกฎหมายที่ตรงกับเงื่อนไข
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            ลองพิมพ์เฉพาะเลขมาตรา/ข้อ (เช่น 141, 125, 515) หรือเปลี่ยนฉบับกฎหมายที่เลือก
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
              setLoading(true);
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
              setLoading(true);
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
          onOpenPdf={(target) => {
            setReadingSectionId(null);
            setPdfTarget(target);
          }}
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

      {/* Royal Gazette / Official PDF Viewer Modal */}
      <LawPdfViewerModal target={pdfTarget} onClose={() => setPdfTarget(null)} />
    </div>
  );
}
