"use client";

import { useState, useMemo } from "react";
import { 
  FileText, 
  Search, 
  ExternalLink, 
  Download, 
  Sparkles, 
  Shield, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  Building,
  Gavel,
  BookOpen
} from "lucide-react";
import regulationsData from "@/data/thai-law/policeworker-regulations.json";

interface RegulationItem {
  id: string;
  title: string;
  shortTitle: string;
  category: string;
  year: number;
  dateIssued?: string;
  sourceUrl: string;
  localFile?: string;
  summary: string;
  isNew: boolean;
  badgeText?: string | null;
  authority?: string;
}

const CATEGORIES = [
  "ทั้งหมด",
  "วินัยและการร้องทุกข์อุทธรณ์",
  "การมอบอำนาจหน้าที่และโครงสร้างบริหาร",
  "นโยบายและแผนยุทธศาสตร์ ตร.",
  "ก.พ.ค.ตร. และการพิทักษ์ระบบคุณธรรม",
  "การแต่งตั้งและกำลังพล",
  "ระเบียบการตำรวจไม่เกี่ยวกับคดี",
  "ระเบียบการตำรวจเกี่ยวกับคดีและงานสอบสวน"
];

const POPULAR_SEARCHES = [
  { label: "วินัย 2569 (NEW)", query: "วินัย 2569" },
  { label: "คำสั่ง ตร. 424-2569 (NEW)", query: "424-2569" },
  { label: "นโยบาย ผบ.ตร. 2570", query: "นโยบาย" },
  { label: "ก.พ.ค.ตร.", query: "ก.พ.ค.ตร." },
  { label: "การแต่งตั้ง 2567-2569", query: "แต่งตั้ง" },
  { label: "มอบอำนาจหน้าที่ รอง ผบ.ตร.", query: "มอบอำนาจ" },
  { label: "ระเบียบไม่เกี่ยวกับคดี", query: "ไม่เกี่ยวกับคดี" }
];

export default function PoliceWorkerRegulations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [onlyNew, setOnlyNew] = useState(false);

  const items = regulationsData as RegulationItem[];

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(items.map(i => i.year))).filter(Boolean).sort((a, b) => b - a);
    return years;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Category filter
      if (selectedCategory !== "ทั้งหมด" && item.category !== selectedCategory) {
        return false;
      }
      // Year filter
      if (selectedYear !== "all" && item.year !== parseInt(selectedYear, 10)) {
        return false;
      }
      // Only new filter
      if (onlyNew && !item.isNew) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = item.title.toLowerCase().includes(q);
        const inSummary = item.summary.toLowerCase().includes(q);
        const inCategory = item.category.toLowerCase().includes(q);
        const inYear = item.year.toString().includes(q);
        const inBadge = item.badgeText ? item.badgeText.toLowerCase().includes(q) : false;
        return inTitle || inSummary || inCategory || inYear || inBadge;
      }
      return true;
    });
  }, [items, selectedCategory, selectedYear, onlyNew, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Hero Banner with Status Indicators */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-50/70 via-slate-50 to-indigo-50/40 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 p-6 md:p-8 text-slate-900 dark:text-white shadow-md dark:shadow-xl border border-indigo-200/80 dark:border-indigo-900/40">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-semibold tracking-wide">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              อัปเดตสารระบบกฎหมาย ระเบียบ คำสั่ง ตร. ล่าสุด ๒๕๖๙ - ๒๕๗๐
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              คลังระเบียบ คำสั่ง และนโยบายสำนักงานตำรวจแห่งชาติ
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed">
              เชื่อมโยงฐานข้อมูลสารบรรณและงานนิติการตำรวจจาก <span className="text-indigo-600 dark:text-indigo-300 font-semibold">PoliceWorker.one</span> ครบถ้วน {items.length} ฉบับ พร้อมระบบสกัดข้อความ OCR ด้วย PaddleOCR และ Typhoon-OCR
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col gap-3 shrink-0">
            <div className="bg-white dark:bg-white/10 backdrop-blur-md rounded-xl p-3 border border-indigo-100 dark:border-white/10 shadow-sm flex items-center gap-3">
              <Gavel className="h-6 w-6 text-amber-500 dark:text-amber-400" />
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-300">กฎ ก.ตร. วินัย 2569</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">ฉบับสมบูรณ์ 91 หน้า</div>
              </div>
            </div>
            <div className="bg-white dark:bg-white/10 backdrop-blur-md rounded-xl p-3 border border-indigo-100 dark:border-white/10 shadow-sm flex items-center gap-3">
              <Building className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-300">คำสั่ง ตร. ที่ 424/2569</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">มอบอำนาจ รอง ผบ.ตร.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อกฎหมาย, ระเบียบ, คำสั่ง ตร., วินัย 2569, เลขที่คำสั่ง, พ.ร.บ. ..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ล้าง
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">ทุกปี พ.ศ.</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>ปี พ.ศ. {yr}</option>
              ))}
            </select>

            <button
              onClick={() => setOnlyNew(!onlyNew)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                onlyNew 
                  ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              เฉพาะประกาศล่าสุด (NEW)
            </button>
          </div>
        </div>

        {/* Popular chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> ยอดนิยม:
          </span>
          {POPULAR_SEARCHES.map(item => (
            <button
              key={item.label}
              onClick={() => {
                setSearchQuery(item.query);
                setSelectedCategory("ทั้งหมด");
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/90 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>พบระเบียบ/คำสั่งทั้งหมด <strong className="text-slate-900 dark:text-slate-200 font-bold">{filteredItems.length}</strong> ฉบับ</span>
        <span>แหล่งข้อมูล: ก.ตร. / สำนักงานตำรวจแห่งชาติ (PoliceWorker.one)</span>
      </div>

      {/* Regulation Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => {
          return (
            <div
              key={item.id}
              className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between bg-white dark:bg-slate-900 shadow-sm hover:shadow-md ${
                item.isNew 
                  ? "border-amber-400/60 dark:border-amber-500/40 hover:border-amber-500 ring-1 ring-amber-400/20" 
                  : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
              }`}
            >
              <div className="space-y-3">
                {/* Badges Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.isNew && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <Sparkles className="h-3 w-3" />
                        {item.badgeText || "NEW"}
                      </span>
                    )}
                    {item.category.includes("ก.พ.ค.ตร.") && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <Shield className="h-3 w-3" />
                        ก.พ.ค.ตร.
                      </span>
                    )}
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      ปี พ.ศ. {item.year}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider truncate max-w-[120px]">
                    {item.category.split(" ")[0]}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-3">
                  {item.title}
                </h3>

                {/* Summary / Notes */}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              {/* Card Footer / Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 truncate">
                  {item.authority || "สำนักงานตำรวจแห่งชาติ"}
                </span>

                <div className="flex items-center gap-2">
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs font-semibold transition-colors"
                  >
                    <span>อ่านฉบับเต็ม</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <AlertCircle className="h-10 w-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200">ไม่พบระเบียบหรือคำสั่งที่ตรงกับเงื่อนไขการค้นหา</h4>
          <p className="text-xs text-slate-500">ลองล้างตัวกรองหรือใช้คำค้นหาที่สั้นลง เช่น "วินัย", "424", "แต่งตั้ง"</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("ทั้งหมด");
              setSelectedYear("all");
              setOnlyNew(false);
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
}
