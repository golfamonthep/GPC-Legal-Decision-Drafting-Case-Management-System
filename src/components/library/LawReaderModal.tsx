"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Scale, 
  BookOpen, 
  AlertCircle,
  FileText
} from "lucide-react";
import { PoliceLawSection, PoliceLawAct } from "@/lib/thai-law/types";

interface LawReaderModalProps {
  sectionId: string | null;
  onClose: () => void;
  onSelectSection: (id: string) => void;
}

export default function LawReaderModal({
  sectionId,
  onClose,
  onSelectSection,
}: LawReaderModalProps) {
  const [data, setData] = useState<{
    section: PoliceLawSection | null;
    prevSection: PoliceLawSection | null;
    nextSection: PoliceLawSection | null;
    act: PoliceLawAct | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!sectionId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/thai-law/${encodeURIComponent(sectionId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load section");
        return res.json();
      })
      .then((resData) => {
        if (isMounted) {
          setData(resData);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading law section:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sectionId]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!sectionId) return null;

  const section = data?.section;
  const act = data?.act;
  const prevSection = data?.prevSection;
  const nextSection = data?.nextSection;

  const handleCopy = () => {
    if (!section) return;
    const textToCopy = `${section.actTitle}\n${section.sectionLabel}\n\n${section.content}${
      section.notes ? `\n\nหมายเหตุ: ${section.notes}` : ""
    }\n(แหล่งที่มา: ${section.source})`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#18181e]">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/40">
                <Scale className="h-3 w-3" />
                {section?.category || "กฎหมายตำรวจ"}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ระบบสืบค้นแคตตาล็อกกฎหมาย
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
              {section?.actTitle || "กำลังโหลด..."}
            </h2>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#d62839] dark:text-red-400">
              <span className="px-2 py-0.5 rounded bg-red-100/70 dark:bg-red-900/40 border border-red-200 dark:border-red-800">
                {section?.sectionLabel}
              </span>
              {section?.sectionNumArabic && section?.sectionNumArabic !== section?.sectionNum && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  (เลขอารบิก: {section.sectionNumArabic})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#202028] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shadow-sm"
              title="คัดลอกตัวบทกฎหมาย"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600 dark:text-emerald-400">คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>คัดลอก</span>
                </>
              )}
            </button>

            {section?.sourceUrl && (
              <a
                href={section.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#202028] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shadow-sm"
                title="เปิดต้นฉบับสำนักงานคณะกรรมการกฤษฎีกา"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">ต้นฉบับกฤษฎีกา</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              title="ปิดหน้าต่าง (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white dark:bg-[#121215]">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
              <p className="text-sm">กำลังโหลดเนื้อหาตัวบทฉบับเต็ม...</p>
            </div>
          ) : section ? (
            <>
              {/* Statutory Section Content */}
              <div className="rounded-xl bg-slate-50 dark:bg-[#16161c] border border-slate-200 dark:border-white/5 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#d62839]" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      ตัวบทฉบับทางการ
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {section.id}
                  </span>
                </div>

                <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed text-base font-normal whitespace-pre-line tracking-wide">
                  {section.content}
                </div>
              </div>

              {/* Notes / Amendments */}
              {section.notes && (
                <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-4">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                        หมายเหตุ / การแก้ไขเพิ่มเติม
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed whitespace-pre-line">
                        {section.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata & Attribution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>แหล่งที่มาข้อมูล: {section.source}</span>
                </div>
                {act?.sysid && (
                  <div className="flex items-center gap-1.5 sm:justify-end">
                    <span>Krisdika System ID: #{act.sysid}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              ไม่พบเนื้อหามาตราดังกล่าว
            </div>
          )}
        </div>

        {/* Footer Navigation (Prev / Next Section) */}
        <div className="flex items-center justify-between gap-3 p-4 sm:px-6 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#18181e]">
          <div>
            {prevSection ? (
              <button
                onClick={() => onSelectSection(prevSection.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>{prevSection.sectionLabel}</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-600 pl-2">
                มาตราแรก
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            {section?.sectionLabel}
          </div>

          <div>
            {nextSection ? (
              <button
                onClick={() => onSelectSection(nextSection.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
              >
                <span>{nextSection.sectionLabel}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-600 pr-2">
                มาตราสุดท้าย
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
