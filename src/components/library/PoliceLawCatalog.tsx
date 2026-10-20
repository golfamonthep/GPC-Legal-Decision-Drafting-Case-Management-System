"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { 
  Search, 
  X, 
  Scale, 
  BookOpen, 
  Filter, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  FileText,
  ShieldAlert,
  Loader2,
  SlidersHorizontal,
  Bookmark
} from "lucide-react";
import { PoliceLawSection, PoliceLawAct } from "@/lib/thai-law/types";
import LawReaderModal from "./LawReaderModal";

const QUICK_SUGGESTIONS = [
  { label: "ม.105 (อุทธรณ์)", query: "105" },
  { label: "การร้องทุกข์", query: "การร้องทุกข์" },
  { label: "การสืบสวนข้อเท็จจริง", query: "สืบสวนข้อเท็จจริง" },
  { label: "การสอบสวนพิจารณา", query: "สอบสวนพิจารณา" },
  { label: "การสั่งพักราชการ", query: "พักราชการ" },
  { label: "ความผิดชัดแจ้ง", query: "ปรากฏชัดแจ้ง" },
  { label: "ม.157 ป.อาญา", query: "157" },
  { label: "ความรับผิดทางละเมิด", query: "ละเมิด" },
  { label: "พ.ร.บ.จราจรทางบก", query: "จราจรทางบก" },
];

export default function PoliceLawCatalog() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [selectedActId, setSelectedActId] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(18);

  const [items, setItems] = useState<PoliceLawSection[]>([]);
  const [acts, setActs] = useState<PoliceLawAct[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Selected section for full text reading modal
  const [readingSectionId, setReadingSectionId] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const fetchResults = useCallback((
    qStr: string,
    catStr: string,
    actStr: string,
    pageNum: number
  ) => {
    setLoading(true);
    const params = new URLSearchParams({
      q: qStr,
      category: catStr,
      actId: actStr,
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
        setCategories(data.categories || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading law catalog:", err);
        setLoading(false);
      });
  }, [pageSize]);

  // Initial load
  useEffect(() => {
    fetchResults(query, activeCategory, selectedActId, page);
  }, [fetchResults, page, activeCategory, selectedActId]);

  // Trigger search on submit or debounce
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchResults(query, activeCategory, selectedActId, 1);
  };

  const handleCategoryChange = (catName: string) => {
    setActiveCategory(catName);
    setPage(1);
    fetchResults(query, catName, selectedActId, 1);
  };

  const handleActChange = (actId: string) => {
    setSelectedActId(actId);
    setPage(1);
    fetchResults(query, activeCategory, actId, 1);
  };

  const handleQuickChipClick = (q: string) => {
    setQuery(q);
    setPage(1);
    fetchResults(q, activeCategory, selectedActId, 1);
  };

  const handleClearSearch = () => {
    setQuery("");
    setPage(1);
    fetchResults("", activeCategory, selectedActId, 1);
  };

  // Filter acts based on active category
  const filteredActs = activeCategory === "ทั้งหมด"
    ? acts
    : acts.filter((a) => a.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900 to-red-950 text-white shadow-xl relative overflow-hidden border border-red-900/30">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden lg:block">
          <Scale className="w-56 h-56 text-white" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-600/30 text-red-200 border border-red-500/30">
            <Sparkles className="h-3.5 w-3.5 text-red-400" />
            <span>แคตตาล็อกกฎหมายตำรวจ · สำนักงานคณะกรรมการกฤษฎีกา / PyThaiNLP</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            สืบค้นข้อกฎหมายและระเบียบตำรวจ
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            รวบรวมพระราชบัญญัติตำรวจแห่งชาติ, กฎ ก.ตร. วินัย อุทธรณ์ ร้องทุกข์, ประมวลกฎหมายอาญา, และกฎหมายปกครองที่เกี่ยวข้อง ค้นหารายมาตราพร้อมบทคัดย่อและอ่านฉบับเต็มได้ทันที
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="pt-2">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="พิมพ์คีย์เวิร์ด หรือเลขมาตรา เช่น '105', 'อุทธรณ์', '157', 'ร้องทุกข์', 'พักราชการ'..."
                className="w-full pl-12 pr-28 py-3.5 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all shadow-inner"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-24 p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title="ล้างข้อความ"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-md flex items-center gap-1.5"
              >
                <span>ค้นหา</span>
              </button>
            </div>
          </form>

          {/* Quick Keywords Chips */}
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">คำค้นยอดนิยม:</span>
            {QUICK_SUGGESTIONS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleQuickChipClick(item.query)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  query === item.query
                    ? "bg-red-600 text-white border-red-500 font-semibold"
                    : "bg-white/10 text-slate-200 border-white/10 hover:bg-white/20 hover:border-white/30"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Controls: Categories & Act Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/10 shadow-sm">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => handleCategoryChange(cat.name)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#d62839] text-white shadow-sm font-semibold"
                    : "bg-slate-100 dark:bg-[#1e1e24] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Act Selector Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedActId}
            onChange={(e) => handleActChange(e.target.value)}
            className="w-full md:w-64 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#18181e] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="all">กฎหมายทุกฉบับ ({filteredActs.length} ฉบับ)</option>
            {filteredActs.map((act) => (
              <option key={act.id} value={act.id}>
                {act.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Header / Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <div>
          {loading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
              กำลังสืบค้นข้อมูล...
            </span>
          ) : (
            <span>
              พบ <strong className="text-slate-900 dark:text-white font-semibold">{total.toLocaleString()}</strong> มาตราที่ตรงกับเงื่อนไข
              {query && <span> สำหรับคำว่า &quot;<strong>{query}</strong>&quot;</span>}
            </span>
          )}
        </div>
        {totalPages > 1 && (
          <div>
            หน้า {page} จาก {totalPages}
          </div>
        )}
      </div>

      {/* Results Card Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          <p className="text-sm">กำลังค้นหาข้อกฎหมายและประมวลผลลัพธ์...</p>
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between rounded-xl p-5 bg-white dark:bg-[#15151a] border border-slate-200 dark:border-white/10 hover:border-red-500/60 dark:hover:border-red-500/50 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="space-y-3">
                {/* Header: Act title badge & Category */}
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5 truncate max-w-[200px]" title={item.actTitle}>
                    <Bookmark className="h-3 w-3 text-red-600 shrink-0" />
                    <span className="truncate">{item.actTitle}</span>
                  </span>

                  <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/30 font-medium">
                    {item.category.split(" ")[0]}
                  </span>
                </div>

                {/* Section Number Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-bold text-[#d62839] dark:text-red-400 group-hover:translate-x-0.5 transition-transform">
                    {item.sectionLabel}
                  </span>
                  {item.sectionNumArabic && item.sectionNumArabic !== item.sectionNum && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      ({item.type === "rule" ? "ข้อ" : "มาตรา"} {item.sectionNumArabic})
                    </span>
                  )}
                </div>

                {/* Brief Excerpt */}
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
                  {item.excerpt}
                </p>
              </div>

              {/* Card Footer: Metadata & Read Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={item.source}>
                  {item.source}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                      title="เปิดลิงก์กฤษฎีกาต้นฉบับ"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setReadingSectionId(item.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/50 dark:hover:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-900/40 transition-colors"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>อ่านฉบับเต็ม</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-xl bg-slate-50 dark:bg-[#15151a] border border-slate-200 dark:border-white/10 p-8 space-y-3">
          <Scale className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            ไม่พบข้อกฎหมายที่ตรงกับคำค้นหา
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            ลองปรับเปลี่ยนคำค้นหา เช่น พิมพ์เพียงเลขมาตรา (เช่น 105 หรือ 157) หรือเลือกดูหมวดหมู่อื่น
          </p>
          <button
            type="button"
            onClick={handleClearSearch}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
          >
            ล้างตัวกรองและคำค้นหา
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 200, behavior: "smooth" });
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
              window.scrollTo({ top: 200, behavior: "smooth" });
            }}
            disabled={page >= totalPages || loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#18181e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span>ถัดไป</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Law Reader Modal */}
      <LawReaderModal
        sectionId={readingSectionId}
        onClose={() => setReadingSectionId(null)}
        onSelectSection={(newId) => setReadingSectionId(newId)}
      />
    </div>
  );
}
