"use client";

import React, { useEffect } from "react";
import { X, ExternalLink, Download, FileText, ShieldCheck } from "lucide-react";

export interface LawPdfViewerTarget {
  title: string;
  subtitle?: string;
  pdfUrl: string;
  source?: string;
}

interface LawPdfViewerModalProps {
  target: LawPdfViewerTarget | null;
  onClose: () => void;
}

export default function LawPdfViewerModal({ target, onClose }: LawPdfViewerModalProps) {
  useEffect(() => {
    if (!target) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [target, onClose]);

  if (!target) return null;

  const iframeSrc = `${target.pdfUrl}#view=FitH&toolbar=1&navpanes=0`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={target.title}
    >
      <div
        className="relative w-full max-w-6xl h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181e]">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/60 text-[#d62839] dark:text-red-400 shrink-0 mt-0.5">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                  <ShieldCheck className="h-3 w-3" />
                  ไฟล์ต้นฉบับราชกิจจานุเบกษา / ทางการ
                </span>
                {target.subtitle && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {target.subtitle}
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate mt-0.5">
                {target.title}
              </h2>
              {target.source && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {target.source}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={target.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#202028] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>เปิดแท็บใหม่</span>
            </a>
            <a
              href={target.pdfUrl}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#d62839] hover:bg-red-700 text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>ดาวน์โหลด PDF</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
              title="ปิดหน้าต่าง (Esc)"
              aria-label="ปิดหน้าต่าง PDF"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Embedded PDF Viewer */}
        <div className="flex-1 bg-slate-100 dark:bg-[#0d0d10] relative">
          <iframe
            src={iframeSrc}
            title={target.title}
            className="w-full h-full border-0"
          />
        </div>

        {/* Subtle Footer Fallback for Mobile Browsers */}
        <div className="px-4 sm:px-6 py-2.5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181e] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            หากเบราว์เซอร์บนมือถือไม่แสดงไฟล์ PDF ในกรอบ สามารถกด &ldquo;เปิดแท็บใหม่&rdquo; หรือ &ldquo;ดาวน์โหลด PDF&rdquo; เพื่อเปิดอ่านได้ทันที
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 dark:text-slate-300 font-medium hover:underline"
          >
            ปิดหน้าต่าง (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
