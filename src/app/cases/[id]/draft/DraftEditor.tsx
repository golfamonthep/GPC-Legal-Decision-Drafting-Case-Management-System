"use client";

import { useRef, useState } from "react";
import { 
  ArrowLeft, Save, Sparkles, CheckSquare, FileText, 
  Search, BookOpen, CheckCircle, Clock, AlertCircle,
  FileSearch, Scale, FileOutput, FilePlus, FolderSync
} from "lucide-react";
import Link from "next/link";
import { updateSection, updateAllSections, SectionStatus, applyReviewSuggestion } from "./actions";

export function DraftEditor({
  caseData,
  draftData,
  templateExists = false,
  canEditDraft = true,
  aiDraftEnabled = false,
  aiReviewEnabled = false,
  aiUnavailableReason = 'บัญชีนี้ไม่มีสิทธิ์ใช้ AI',
}: {
  caseData: any;
  draftData: any;
  templateExists?: boolean;
  canEditDraft?: boolean;
  aiDraftEnabled?: boolean;
  aiReviewEnabled?: boolean;
  aiUnavailableReason?: string;
}) {
  const [sections, setSections] = useState(draftData.sections);
  const sectionsRef = useRef(draftData.sections);
  const updateSectionsState = (updater: (prev: any[]) => any[]) => {
    setSections((prev: any[]) => {
      const next = updater(prev);
      sectionsRef.current = next;
      return next;
    });
  };

  const [isSaving, setIsSaving] = useState(false);
  const [savingSectionId, setSavingSectionId] = useState<string | null>(null);

  // New states for AI Assistant
  const [activeAiSectionId, setActiveAiSectionId] = useState<string | null>(null);
  const [aiInstruction, setAiInstruction] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiResult, setAiResult] = useState<{
    generatedText: string;
    sourcesUsed: any[];
    sectionId: string;
    baselineContent: string;
    baselineUpdatedAt: string | Date | null;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // New states for AI Wording Review
  const [activeReviewSectionId, setActiveReviewSectionId] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState("language_only");
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // New states for Citation Coverage Checker
  const [activeCoverageSectionId, setActiveCoverageSectionId] = useState<string | null>(null);
  const [coverageMode, setCoverageMode] = useState("facts");
  const [isCheckingCoverage, setIsCheckingCoverage] = useState(false);
  const [coverageResult, setCoverageResult] = useState<any>(null);
  const [coverageError, setCoverageError] = useState<string | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const hasContent = sections.some((s: any) => s.content && s.content.trim().length > 0);

  const handleSectionChange = (id: string, content: string) => {
    updateSectionsState((prev: any[]) => 
      prev.map((s: any) => s.id === id ? { ...s, content } : s)
    );
  };

  const handleStatusChange = (id: string, status: string) => {
    updateSectionsState((prev: any[]) => 
      prev.map((s: any) => s.id === id ? { ...s, status } : s)
    );
  };

  const handleSaveSection = async (id: string) => {
    if (!canEditDraft) return;
    setSavingSectionId(id);
    try {
      const section = sectionsRef.current.find((s: any) => s.id === id);
      if (section) {
        const updated = await updateSection(
          section.id,
          section.content,
          section.status,
          section.updatedAt,
        );
        updateSectionsState((prev: any[]) =>
          prev.map((s: any) =>
            s.id === id ? { ...s, updatedAt: updated.updatedAt, status: updated.status } : s,
          ),
        );
      }
    } catch (err: any) {
      alert(err?.message || "ไม่สามารถบันทึกส่วนร่างคำวินิจฉัยได้");
    } finally {
      setSavingSectionId(null);
    }
  };

  const handleSaveAll = async () => {
    if (!canEditDraft) return;
    setIsSaving(true);
    try {
      const res = await updateAllSections(
        sectionsRef.current.map((s: any) => ({
          id: s.id,
          content: s.content,
          status: s.status,
          expectedUpdatedAt: s.updatedAt,
        })),
        caseData.id,
      );
      if (res?.sections) {
        const updatedById = new Map(res.sections.map((s: any) => [s.id, s]));
        updateSectionsState((prev: any[]) =>
          prev.map((s: any) => {
            const u = updatedById.get(s.id);
            return u ? { ...s, updatedAt: u.updatedAt, status: u.status } : s;
          }),
        );
      }
    } catch (err: any) {
      alert(err?.message || "ไม่สามารถบันทึกร่างทั้งหมดได้");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAi = async (sectionId: string, sectionType: string) => {
    const baselineSection = sectionsRef.current.find((s: any) => s.id === sectionId);
    if (!baselineSection) return;
    const baselineContent = String(baselineSection.content ?? "");
    const baselineUpdatedAt = baselineSection.updatedAt ?? null;

    setIsGeneratingAi(true);
    setAiError(null);
    setAiResult(null);

    try {
      const res = await fetch("/api/draft/section-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: caseData.id,
          draftId: draftData.id,
          sectionId,
          sectionType,
          userInstruction: aiInstruction,
          legalCategory: caseData.legalCategory,
          expectedCaseUpdatedAt: caseData.updatedAt,
          expectedDraftUpdatedAt: draftData.updatedAt,
          expectedSectionUpdatedAt: baselineUpdatedAt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate draft");
      }

      const currentSection = sectionsRef.current.find((s: any) => s.id === sectionId);
      if (
        !currentSection ||
        String(currentSection.content ?? "") !== baselineContent ||
        String(currentSection.updatedAt ?? "") !== String(baselineUpdatedAt ?? "")
      ) {
        throw new Error(
          "ร่างส่วนนี้ถูกแก้ไขระหว่างประมวลผล AI ระบบยกเลิกผลลัพธ์เพื่อไม่ให้ทับร่างมนุษย์",
        );
      }

      setAiResult({
        ...data,
        sectionId,
        baselineContent,
        baselineUpdatedAt: data.revision?.sectionUpdatedAt ?? baselineUpdatedAt,
      });
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAcceptAiDraft = (sectionId: string) => {
    if (!canEditDraft || !aiResult || aiResult.sectionId !== sectionId) return;
    const currentSection = sectionsRef.current.find((s: any) => s.id === sectionId);
    if (
      !currentSection ||
      String(currentSection.content ?? "") !== aiResult.baselineContent ||
      (aiResult.baselineUpdatedAt &&
        currentSection.updatedAt &&
        new Date(currentSection.updatedAt).getTime() !==
          new Date(aiResult.baselineUpdatedAt).getTime())
    ) {
      setAiError(
        "ร่างส่วนนี้ถูกแก้ไขหลังจาก AI สร้างข้อเสนอ ระบบยกเลิกการนำไปใช้เพื่อไม่ให้ทับร่างมนุษย์ กรุณาสร้างร่างใหม่",
      );
      setAiResult(null);
      return;
    }
    handleSectionChange(sectionId, aiResult.generatedText);
    setActiveAiSectionId(null);
  };

  const handleReviewWording = async (sectionId: string, sectionType: string) => {
    setIsReviewing(true);
    setReviewError(null);
    setReviewResult(null);

    const section = sectionsRef.current.find((s: any) => s.id === sectionId);
    if (!section || !section.content.trim()) {
      setReviewError("ไม่มีข้อความให้ตรวจ กรุณาพิมพ์ข้อความก่อน");
      setIsReviewing(false);
      return;
    }
    const baselineContent = String(section.content);
    const baselineUpdatedAt = section.updatedAt ?? null;

    try {
      const res = await fetch("/api/draft/review-wording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: caseData.id,
          draftId: draftData.id,
          sectionId,
          sectionType,
          currentSectionText: baselineContent,
          reviewMode,
          expectedCaseUpdatedAt: caseData.updatedAt,
          expectedDraftUpdatedAt: draftData.updatedAt,
          expectedSectionUpdatedAt: baselineUpdatedAt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to review wording");
      }

      const currentSection = sectionsRef.current.find((s: any) => s.id === sectionId);
      if (
        !currentSection ||
        String(currentSection.content ?? "") !== baselineContent ||
        String(currentSection.updatedAt ?? "") !== String(baselineUpdatedAt ?? "")
      ) {
        throw new Error(
          "ร่างส่วนนี้ถูกแก้ไขระหว่างตรวจถ้อยคำ ระบบยกเลิกผลลัพธ์เพื่อไม่ให้ทับร่างมนุษย์",
        );
      }

      setReviewResult({
        ...data,
        sectionId,
        baselineContent,
        baselineUpdatedAt: data.revision?.sectionUpdatedAt ?? baselineUpdatedAt,
      });
    } catch (err: any) {
      setReviewError(err.message);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleCheckCoverage = async (sectionId: string, sectionType: string) => {
    setIsCheckingCoverage(true);
    setCoverageError(null);
    setCoverageResult(null);

    const section = sectionsRef.current.find((s: any) => s.id === sectionId);
    if (!section || !section.content.trim()) {
      setCoverageError("ไม่มีข้อความให้ตรวจ กรุณาพิมพ์ข้อความก่อน");
      setIsCheckingCoverage(false);
      return;
    }
    const baselineContent = String(section.content);
    const baselineUpdatedAt = section.updatedAt ?? null;

    try {
      const res = await fetch("/api/draft/check-citations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: caseData.id,
          draftId: draftData.id,
          sectionId,
          sectionType,
          currentSectionText: baselineContent,
          coverageMode,
          expectedCaseUpdatedAt: caseData.updatedAt,
          expectedDraftUpdatedAt: draftData.updatedAt,
          expectedSectionUpdatedAt: baselineUpdatedAt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to check coverage");
      }

      const currentSection = sectionsRef.current.find((s: any) => s.id === sectionId);
      if (
        !currentSection ||
        String(currentSection.content ?? "") !== baselineContent ||
        String(currentSection.updatedAt ?? "") !== String(baselineUpdatedAt ?? "")
      ) {
        throw new Error(
          "ร่างส่วนนี้ถูกแก้ไขระหว่างตรวจแหล่งอ้างอิง ระบบยกเลิกผลลัพธ์เพื่อป้องกันความคลาดเคลื่อน",
        );
      }

      setCoverageResult({
        ...data,
        sectionId,
        baselineContent,
        baselineUpdatedAt: data.revision?.sectionUpdatedAt ?? baselineUpdatedAt,
      });
    } catch (err: any) {
      setCoverageError(err.message);
    } finally {
      setIsCheckingCoverage(false);
    }
  };

  const handleApplyReviewSuggestion = async (sectionId: string, suggestedText: string) => {
    if (!canEditDraft) return;
    const currentSection = sectionsRef.current.find((s: any) => s.id === sectionId);
    if (
      !currentSection ||
      !reviewResult ||
      reviewResult.sectionId !== sectionId ||
      String(currentSection.content ?? "") !== reviewResult.baselineContent ||
      (reviewResult.baselineUpdatedAt &&
        currentSection.updatedAt &&
        new Date(currentSection.updatedAt).getTime() !==
          new Date(reviewResult.baselineUpdatedAt).getTime())
    ) {
      setReviewError(
        "ร่างส่วนนี้ถูกแก้ไขหลังจาก AI ตรวจถ้อยคำ ระบบยกเลิกการนำไปใช้เพื่อไม่ให้ทับร่างมนุษย์ กรุณาตรวจถ้อยคำใหม่",
      );
      setReviewResult(null);
      return;
    }

    if (confirm("คุณแน่ใจหรือไม่ที่จะนำข้อเสนอแนะนี้ไปแทนที่ข้อความเดิม?")) {
      try {
        const updated = await applyReviewSuggestion(
          sectionId,
          suggestedText,
          caseData.id,
          reviewResult.baselineUpdatedAt ?? currentSection.updatedAt,
        );
        updateSectionsState((prev: any[]) =>
          prev.map((s: any) =>
            s.id === sectionId
              ? { ...s, content: suggestedText, updatedAt: updated.updatedAt }
              : s,
          ),
        );
        setActiveReviewSectionId(null);
      } catch (err: any) {
        setReviewError(err?.message || "ไม่สามารถนำข้อเสนอไปใช้ได้เนื่องจากข้อมูลเปลี่ยน");
      }
    }
  };

  const handleExportDocx = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/cases/${caseData.id}/export-docx`, {
        method: "GET",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "ไม่สามารถส่งออกไฟล์ DOCX ได้ กรุณาลองใหม่อีกครั้ง");
      }

      // Handle file download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Try to get filename from Content-Disposition header
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `คำวินิจฉัย-${caseData.blackNumber.split('/').join('-')}.docx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\\*=(?:UTF-8'')?([^;]+)/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const sectionTemplates = [
    { type: "heading", title: "1. เรื่องเดิม / สรุปคำร้อง", placeholder: "พิมพ์ข้อเท็จจริงตามคำร้องของผู้อุทธรณ์/ผู้ร้องทุกข์...", rows: 5 },
    { type: "parties", title: "2. คำชี้แจงของคู่กรณี", placeholder: "พิมพ์สรุปคำชี้แจงโต้แย้งของผู้ถูกร้อง...", rows: 5 },
    { type: "established_facts", title: "3. ข้อเท็จจริงที่รับฟังเป็นยุติ", placeholder: "พิมพ์ข้อเท็จจริงที่ปราศจากข้อสงสัยและรับฟังได้เป็นยุติ...", rows: 4 },
    { type: "jurisdiction", title: "4. อำนาจรับพิจารณา / เขตอำนาจ", placeholder: "ระบุหลักกฎหมายที่ให้อำนาจ ก.พ.ค.ตร. ในการพิจารณา...", rows: 3 },
    { type: "issues", title: "5. ประเด็นที่ต้องวินิจฉัย", placeholder: "1. การกระทำของผู้ถูกร้องชอบด้วยกฎหมายหรือไม่...", rows: 4 },
    { type: "applicable_laws", title: "6. ข้อกฎหมายที่เกี่ยวข้อง", placeholder: "อ้างอิงมาตรา หรือกฎ ก.ตร. ที่นำมาใช้ในการพิจารณา...", rows: 4 },
    { type: "reasoning", title: "7. การวินิจฉัยและเหตุผล", placeholder: "พิมพ์เหตุผลประกอบการวินิจฉัยในแต่ละประเด็น...", rows: 8 },
    { type: "conclusion", title: "8. ผลการวินิจฉัย (มติ)", placeholder: "ให้ยกคำร้อง หรือ มีคำสั่งแก้ไขเปลี่ยนแปลง...", rows: 3 },
  ];

  const statusOptions = [
    { value: "pending", label: "ยังไม่เริ่ม" },
    { value: "in_progress", label: "กำลังร่าง" },
    { value: "reviewing", label: "รอตรวจ" },
    { value: "completed", label: "ตรวจแล้ว" }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] flex flex-col bg-slate-100 lg:overflow-hidden">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link href={`/cases/${caseData.id}`} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-md transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4" /> กลับ
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">พื้นที่ร่างคำวินิจฉัย</h1>
            <p className="text-xs text-slate-500 mt-0.5 truncate">คดีหมายเลขดำที่ {caseData.blackNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSaveAll}
            disabled={isSaving || !canEditDraft}
            className="inline-flex items-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <Save className="-ml-0.5 mr-2 h-4 w-4" /> {isSaving ? "กำลังบันทึก..." : "บันทึกร่างทั้งหมด"}
          </button>
        </div>
      </div>

      {/* Main Two-Panel Layout */}
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
        
        {/* Left Panel: Context & Checklist */}
        <div className="w-full lg:w-[380px] bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col lg:overflow-y-auto custom-scrollbar shrink-0">
          <div className="p-4 sm:p-5 space-y-6">
            
            {/* Case Facts Section */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                ข้อเท็จจริง (Case Facts)
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="block text-slate-500 text-xs font-medium mb-1">ผู้ร้อง / ผู้อุทธรณ์</span>
                  <p className="font-medium text-slate-800">{caseData.petitionerName}</p>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs font-medium mb-1">ผู้ถูกร้อง / คู่กรณี</span>
                  <p className="font-medium text-slate-800">{caseData.respondentName}</p>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs font-medium mb-1">ประเภทคดี</span>
                  <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                    {caseData.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <ReviewChecklist />
            
          </div>
        </div>

        {/* Right Panel: Editor Area */}
        <div className="flex-1 min-w-0 flex flex-col bg-slate-100">
          
          {/* AI Tools Toolbar (Disabled) */}
          <div className="bg-white px-4 sm:px-6 py-3 border-b border-slate-200 flex flex-wrap gap-2 items-center shadow-sm z-10 shrink-0">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1">
              <Sparkles className="h-4 w-4" /> เครื่องมือช่วยร่าง
            </div>
            
            <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-md text-sm font-medium cursor-not-allowed">
              <FileSearch className="h-4 w-4" /> สรุปคำร้อง
            </button>
            {!aiDraftEnabled && !aiReviewEnabled && (
              <span className="text-xs text-slate-500" role="status">{aiUnavailableReason} · ยังร่างและส่งออกด้วยมือได้ตามปกติ</span>
            )}
            <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-md text-sm font-medium cursor-not-allowed">
              <FileSearch className="h-4 w-4" /> สรุปคำแก้
            </button>
            <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-md text-sm font-medium cursor-not-allowed">
              <Search className="h-4 w-4" /> เสนอประเด็นวินิจฉัย
            </button>
            <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-md text-sm font-medium cursor-not-allowed">
              <BookOpen className="h-4 w-4" /> ค้นแนวคำวินิจฉัย
            </button>
            
            <div className="hidden sm:block h-6 w-px bg-slate-300 mx-1"></div>
            
            <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-md text-sm font-medium cursor-not-allowed">
              <CheckCircle className="h-4 w-4" /> ตรวจถ้อยคำ
            </button>
            <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-md text-sm font-medium cursor-not-allowed">
              <Scale className="h-4 w-4" /> ตรวจข้อกฎหมาย
            </button>
            
            <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap items-center gap-2">
              {!hasContent && (
                <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                  ยังไม่มีร่างคำวินิจฉัยสำหรับส่งออก
                </span>
              )}
              {hasContent && !templateExists && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                  ยังไม่พบไฟล์แม่แบบ ระบบจะส่งออกด้วยรูปแบบมาตรฐานชั่วคราว
                </span>
              )}
              <button 
                onClick={handleExportDocx}
                disabled={isExporting || !hasContent}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileOutput className="h-4 w-4" /> {isExporting ? "กำลังส่งออก..." : (templateExists ? "ส่งออกตามแม่แบบคำวินิจฉัย" : "ส่งออก DOCX")}
              </button>
              <button 
                disabled
                title="ยังไม่ได้ตั้งค่า Microsoft Graph สำหรับจัดเก็บไฟล์"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-md text-sm font-medium cursor-not-allowed transition-colors"
              >
                <FolderSync className="h-4 w-4" /> บันทึกไปยัง OneDrive
              </button>
            </div>
          </div>

          {/* Document Editor Canvas */}
          <div className="flex-1 lg:overflow-y-auto p-3 sm:p-8 custom-scrollbar">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-12">
              
              {/* Document Header */}
              <div className="bg-slate-900 text-white px-4 sm:px-10 py-6 sm:py-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                <h1 className="text-xl sm:text-2xl font-bold mb-2">ร่างคำวินิจฉัย</h1>
                <p className="text-slate-300 text-xs sm:text-sm">
                  คณะกรรมการพิทักษ์ระบบคุณธรรมข้าราชการตำรวจ (ก.พ.ค.ตร.)
                </p>
                <div className="mt-6 flex flex-col sm:flex-row justify-between gap-1 text-xs sm:text-sm text-slate-400 font-mono">
                  <span>คดีหมายเลขดำที่ {caseData.blackNumber}</span>
                  <span>คดีหมายเลขแดงที่ {caseData.redNumber || "........................"}</span>
                </div>
              </div>

              {/* Document Body */}
              <div className="p-4 sm:p-10">
                {sections.map((section: any) => {
                  const template = sectionTemplates.find(t => t.type === section.sectionType);
                  if (!template) return null;
                  
                  return (
                    <div key={section.id} className="mb-6 p-4 sm:p-5 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-blue-300 transition-colors">
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <h3 className="text-base font-bold text-slate-800">{template.title}</h3>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <select 
                            value={section.status}
                            disabled={!canEditDraft}
                            onChange={(e) => handleStatusChange(section.id, e.target.value)}
                            className="text-xs font-medium border-slate-200 rounded bg-slate-50 px-2 py-1 disabled:opacity-50"
                          >
                            {statusOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => handleSaveSection(section.id)}
                            disabled={savingSectionId === section.id || !canEditDraft}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded border border-slate-200 transition-colors flex items-center disabled:opacity-50"
                          >
                            <Save className="w-3 h-3 mr-1" /> {savingSectionId === section.id ? "กำลังบันทึก..." : "บันทึก"}
                          </button>
                        </div>
                      </div>
                      <textarea
                        rows={template.rows}
                        value={section.content}
                        readOnly={!canEditDraft}
                        onChange={(e) => handleSectionChange(section.id, e.target.value)}
                        className="block w-full rounded-md border-0 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-4 bg-slate-50 focus:bg-white transition-colors"
                        placeholder={template.placeholder}
                      />
                      
                      {/* AI Assistant Button */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          disabled={!aiDraftEnabled}
                          onClick={() => {
                            setActiveAiSectionId(activeAiSectionId === section.id ? null : section.id);
                            setAiInstruction("");
                            setAiResult(null);
                            setAiError(null);
                            setActiveReviewSectionId(null);
                            setActiveCoverageSectionId(null);
                          }}
                          className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded border border-indigo-200 transition-colors flex items-center gap-1.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> ช่วยร่างส่วนนี้
                        </button>
                        <button
                          disabled={!aiReviewEnabled}
                          onClick={() => {
                            setActiveReviewSectionId(activeReviewSectionId === section.id ? null : section.id);
                            setReviewResult(null);
                            setReviewError(null);
                            setActiveAiSectionId(null);
                            setActiveCoverageSectionId(null);
                          }}
                          className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded border border-emerald-200 transition-colors flex items-center gap-1.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> ตรวจถ้อยคำ
                        </button>
                        <button
                          disabled={!aiReviewEnabled}
                          onClick={() => {
                            setActiveCoverageSectionId(activeCoverageSectionId === section.id ? null : section.id);
                            setCoverageResult(null);
                            setCoverageError(null);
                            setActiveAiSectionId(null);
                            setActiveReviewSectionId(null);
                          }}
                          className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded border border-blue-200 transition-colors flex items-center gap-1.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FileSearch className="w-3.5 h-3.5" /> ตรวจแหล่งอ้างอิง
                        </button>
                      </div>

                      {/* AI Assistant Inline Panel */}
                      {activeAiSectionId === section.id && (
                        <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg shadow-inner">
                          <div className="mb-3">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">คำสั่งเพิ่มเติม (Instruction)</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={aiInstruction}
                                onChange={(e) => setAiInstruction(e.target.value)}
                                placeholder="เช่น สรุปข้อโต้แย้งจากคำให้การของผู้ถูกร้อง พร้อมอ้างอิง..."
                                className="flex-1 rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                              />
                              <button
                                onClick={() => handleGenerateAi(section.id, section.sectionType)}
                                disabled={isGeneratingAi || !aiInstruction}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {isGeneratingAi ? "กำลังค้นหาและร่าง..." : "สร้างร่าง"}
                              </button>
                            </div>
                          </div>

                          {aiError && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md mb-3 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                              {aiError}
                            </div>
                          )}

                          {aiResult && (
                            <div className="space-y-4">
                              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm relative">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-indigo-600" /> ร่างข้อความจาก AI
                                  </h4>
                                  <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    ข้อความนี้เป็นร่างจาก AI ต้องตรวจสอบโดยนิติกร/กรรมการก่อนใช้งานจริง
                                  </span>
                                </div>
                                <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50/80 p-4 rounded-md border border-slate-100 shadow-inner">
                                  {aiResult.generatedText}
                                </div>
                                
                                <div className="mt-4 flex justify-end">
                                  <button
                                    disabled={!canEditDraft}
                                    onClick={() => handleAcceptAiDraft(section.id)}
                                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                                  >
                                    <CheckCircle className="w-4 h-4" /> นำข้อความไปใช้ในช่องร่าง
                                  </button>
                                </div>
                              </div>

                              {aiResult.sourcesUsed && aiResult.sourcesUsed.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ข้อมูลอ้างอิงที่ใช้</h4>
                                  <ul className="space-y-2">
                                    {aiResult.sourcesUsed.map((source: any, idx: number) => (
                                      <li key={idx} className="text-xs text-slate-700 bg-white p-3 rounded border border-slate-200 flex flex-col gap-1">
                                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                                          <BookOpen className="w-3 h-3 text-slate-400" />
                                          {source.sourceTitle}
                                        </div>
                                        {source.citationMetadata?.referenceNumber && (
                                          <div className="text-slate-500 pl-5">
                                            อ้างอิง: {source.citationMetadata.referenceNumber}
                                          </div>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Wording Review Panel */}
                      {activeReviewSectionId === section.id && (
                        <div className="mt-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg shadow-inner">
                          <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-700 mb-2">เลือกโหมดการตรวจ</label>
                            <div className="flex gap-2 flex-wrap">
                              <select
                                value={reviewMode}
                                onChange={(e) => setReviewMode(e.target.value)}
                                className="rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-3 py-2"
                              >
                                <option value="language_only">ตรวจภาษาราชการ (Language)</option>
                                <option value="legal_style">ตรวจถ้อยคำกฎหมาย (Legal Style)</option>
                                <option value="consistency">ตรวจความสอดคล้อง (Consistency)</option>
                                <option value="risk_check">ตรวจความเสี่ยงข้อเท็จจริง (Risk Check)</option>
                                <option value="full_section_review">ตรวจครบทุกด้าน (Full Review)</option>
                              </select>
                              <button
                                onClick={() => handleReviewWording(section.id, section.sectionType)}
                                disabled={isReviewing}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
                              >
                                {isReviewing ? "กำลังตรวจสอบ..." : "เริ่มตรวจสอบ"}
                              </button>
                            </div>
                          </div>

                          {reviewError && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md mb-3 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                              {reviewError}
                            </div>
                          )}

                          {reviewResult && (
                            <div className="space-y-4">
                              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                  <h4 className="text-sm font-bold text-slate-800">ผลการตรวจสอบ</h4>
                                  <span className={`px-2 py-1 rounded text-xs font-bold border ${reviewResult.riskLevel === 'low' ? 'bg-green-50 text-green-700 border-green-200' : reviewResult.riskLevel === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    ระดับความเสี่ยง: {reviewResult.riskLevel.toUpperCase()}
                                  </span>
                                </div>

                                <div className="text-sm text-slate-700 mb-4 bg-slate-50 p-3 rounded border border-slate-100">
                                  <strong>ภาพรวมการตรวจ: </strong>
                                  {reviewResult.overallAssessment}
                                </div>

                                {reviewResult.issues && reviewResult.issues.length > 0 ? (
                                  <div className="mb-4 space-y-3">
                                    <strong className="text-sm text-slate-800">ประเด็นที่พบ:</strong>
                                    {reviewResult.issues.map((issue: any, idx: number) => (
                                      <div key={idx} className="bg-orange-50 border border-orange-100 p-3 rounded-md text-sm">
                                        <div className="flex gap-2 items-center mb-1">
                                          <span className="font-semibold text-orange-800">[{issue.type}]</span>
                                          <span className="text-xs px-1.5 py-0.5 bg-white border border-orange-200 rounded text-orange-600">Severity: {issue.severity}</span>
                                        </div>
                                        <p className="mb-1"><span className="font-semibold">ข้อความเดิม:</span> <span className="line-through text-slate-500">{issue.originalText}</span></p>
                                        <p className="mb-1 text-slate-800"><span className="font-semibold">เหตุผล:</span> {issue.explanationThai}</p>
                                        <p className="text-green-700"><span className="font-semibold">ข้อเสนอแนะ:</span> {issue.suggestedText}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm text-green-700 mb-4 p-3 bg-green-50 rounded border border-green-100">
                                    <CheckCircle className="w-4 h-4 inline mr-1 -mt-0.5" /> ไม่พบประเด็นที่ต้องแก้ไข
                                  </div>
                                )}

                                {reviewResult.improvedSectionText && reviewResult.improvedSectionText !== section.content && (
                                  <div className="mt-4">
                                    <strong className="text-sm text-slate-800 block mb-2">ข้อความที่ปรับปรุงแล้ว:</strong>
                                    <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap bg-emerald-50/50 p-4 rounded-md border border-emerald-100 shadow-inner">
                                      {reviewResult.improvedSectionText}
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                      <button
                                        disabled={!canEditDraft}
                                        onClick={() => handleApplyReviewSuggestion(section.id, reviewResult.improvedSectionText)}
                                        className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                                      >
                                        <CheckCircle className="w-4 h-4" /> นำข้อเสนอไปใช้
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {reviewResult.citationNotes && (
                                  <div className="mt-4 text-xs text-slate-600 bg-blue-50 p-3 rounded border border-blue-100 whitespace-pre-wrap">
                                    <BookOpen className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-blue-500" />
                                    <strong>หมายเหตุแหล่งอ้างอิง: </strong>
                                    {reviewResult.citationNotes}
                                  </div>
                                )}

                                {reviewResult.humanReviewWarning && (
                                  <div className="mt-4 text-xs text-yellow-800 bg-yellow-50 p-3 rounded border border-yellow-200">
                                    <AlertCircle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                                    <strong>คำเตือน: </strong>
                                    {reviewResult.humanReviewWarning}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Citation Coverage Check Panel */}
                      {activeCoverageSectionId === section.id && (
                        <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg shadow-inner">
                          <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-700 mb-2">เลือกโหมดการตรวจแหล่งอ้างอิง</label>
                            <div className="flex gap-2 flex-wrap">
                              <select
                                value={coverageMode}
                                onChange={(e) => setCoverageMode(e.target.value)}
                                className="rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                              >
                                <option value="facts">ตรวจฐานข้อเท็จจริง (Facts)</option>
                                <option value="legal_basis">ตรวจฐานข้อกฎหมาย (Legal Basis)</option>
                                <option value="reasoning">ตรวจฐานเหตุผลวินิจฉัย (Reasoning)</option>
                                <option value="precedent">ตรวจแนวคำวินิจฉัยเดิม (Precedent)</option>
                                <option value="full_section_coverage">ตรวจครบทุกด้าน (Full Coverage)</option>
                              </select>
                              <button
                                onClick={() => handleCheckCoverage(section.id, section.sectionType)}
                                disabled={isCheckingCoverage}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
                              >
                                {isCheckingCoverage ? "กำลังตรวจสอบ..." : "เริ่มตรวจสอบ"}
                              </button>
                            </div>
                          </div>

                          {coverageError && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md mb-3 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                              {coverageError}
                            </div>
                          )}

                          {coverageResult && (
                            <div className="space-y-4">
                              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm">
                                <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                                  <h4 className="text-sm font-bold text-slate-800">ผลการตรวจแหล่งอ้างอิง</h4>
                                  <div className="flex gap-2 flex-wrap">
                                    <span className={`px-2 py-1 rounded text-xs font-bold border ${coverageResult.overallCoverage === 'sufficient' ? 'bg-green-50 text-green-700 border-green-200' : coverageResult.overallCoverage === 'partial' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : coverageResult.overallCoverage === 'insufficient' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                      {coverageResult.overallCoverage === 'sufficient' ? 'มีแหล่งอ้างอิงครบถ้วน' :
                                       coverageResult.overallCoverage === 'partial' ? 'มีแหล่งอ้างอิงบางส่วน' :
                                       coverageResult.overallCoverage === 'not_applicable' ? 'ไม่ต้องมีแหล่งอ้างอิง' :
                                       'ขาดแหล่งอ้างอิงที่เพียงพอ'}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-bold border ${coverageResult.riskLevel === 'low' ? 'bg-green-50 text-green-700 border-green-200' : coverageResult.riskLevel === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                      ระดับความเสี่ยง: {coverageResult.riskLevel.toUpperCase()}
                                    </span>
                                    <span className="px-2 py-1 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                      คะแนนความครบถ้วนของแหล่งอ้างอิง: {coverageResult.coverageScore}%
                                    </span>
                                  </div>
                                </div>

                                {coverageResult.checkedClaims && coverageResult.checkedClaims.length > 0 && (
                                  <div className="mb-4 space-y-3">
                                    <strong className="text-sm text-slate-800">ข้อความที่ตรวจพบ:</strong>
                                    {coverageResult.checkedClaims.map((claim: any, idx: number) => {
                                      const badgeColor = claim.supportStatus === 'supported' ? 'bg-green-100 text-green-800' :
                                                        claim.supportStatus === 'partially_supported' ? 'bg-yellow-100 text-yellow-800' :
                                                        claim.supportStatus === 'unsupported' ? 'bg-red-100 text-red-800' :
                                                        'bg-slate-100 text-slate-800';
                                      
                                      const badgeText = claim.supportStatus === 'supported' ? 'มีแหล่งรองรับ' :
                                                        claim.supportStatus === 'partially_supported' ? 'มีแหล่งรองรับบางส่วน' :
                                                        claim.supportStatus === 'unsupported' ? 'ยังไม่พบแหล่งรองรับ' :
                                                        'ยังไม่ได้ตรวจ';

                                      return (
                                        <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-md text-sm">
                                          <div className="flex gap-2 items-center mb-2 flex-wrap">
                                            <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-semibold border border-slate-300">
                                              ประเภทข้อความ: {claim.claimType}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${badgeColor}`}>
                                              สถานะแหล่งรองรับ: {badgeText}
                                            </span>
                                          </div>
                                          <p className="mb-2"><span className="font-semibold text-slate-700">ข้อความ:</span> {claim.claimText}</p>
                                          <p className="mb-2 text-slate-600"><span className="font-semibold">ผลวิเคราะห์:</span> {claim.explanationThai}</p>
                                          {claim.recommendedActionThai && (
                                            <p className="text-blue-700"><span className="font-semibold">ข้อเสนอแนะ:</span> {claim.recommendedActionThai}</p>
                                          )}
                                          {claim.supportingSourceChunkIds && claim.supportingSourceChunkIds.length > 0 && (
                                            <p className="mt-2 text-xs text-slate-500">
                                              <BookOpen className="w-3 h-3 inline mr-1 -mt-0.5" />
                                              เชื่อมโยงกับแหล่งอ้างอิง: {claim.supportingSourceChunkIds.length} รายการ
                                            </p>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}

                                {coverageResult.missingSupport && coverageResult.missingSupport.length > 0 && (
                                  <div className="mb-4 space-y-3">
                                    <strong className="text-sm text-red-700 flex items-center gap-1">
                                      <AlertCircle className="w-4 h-4" /> ข้อความที่ยังไม่มีแหล่งรองรับ:
                                    </strong>
                                    {coverageResult.missingSupport.map((missing: any, idx: number) => (
                                      <div key={idx} className="bg-red-50 border border-red-200 p-3 rounded-md text-sm">
                                        <p className="mb-1"><span className="font-semibold text-slate-800">ข้อความ:</span> {missing.statement}</p>
                                        <p className="mb-1 text-red-700"><span className="font-semibold">เหตุผลที่ต้องมีแหล่งอ้างอิง:</span> {missing.whySupportIsNeededThai}</p>
                                        <p className="text-blue-700"><span className="font-semibold">ข้อเสนอแนะในการเติมแหล่งอ้างอิง:</span> {missing.suggestedSourceTypeThai}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {coverageResult.sourceSummary && (
                                  <div className="mt-4 text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 whitespace-pre-wrap">
                                    <strong>สรุปภาพรวมแหล่งอ้างอิง: </strong>
                                    {coverageResult.sourceSummary}
                                  </div>
                                )}

                                {coverageResult.retrievedChunksUsed && coverageResult.retrievedChunksUsed.length > 0 && (
                                  <div className="mt-4">
                                    <strong className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">แหล่งอ้างอิงที่พบ</strong>
                                    <ul className="space-y-2">
                                      {coverageResult.retrievedChunksUsed.map((source: any, idx: number) => (
                                        <li key={idx} className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                                          <span className="font-semibold">{source.sourceTitle}</span>
                                          {source.citationMetadata?.referenceNumber && ` (อ้างอิง: ${source.citationMetadata.referenceNumber})`}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {coverageResult.humanReviewWarning && (
                                  <div className="mt-4 text-xs text-yellow-800 bg-yellow-50 p-3 rounded border border-yellow-200 flex items-start gap-1.5">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <div>
                                      <strong>ต้องตรวจโดยมนุษย์: </strong>
                                      {coverageResult.humanReviewWarning}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                <div className="mt-10 pt-8 border-t border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-3">9. สิทธิการฟ้องคดี</h3>
                  <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      หากผู้ร้อง/ผู้อุทธรณ์ไม่เห็นด้วยกับคำวินิจฉัยนี้ มีสิทธิฟ้องคดีต่อศาลปกครองสูงสุดภายใน 90 วัน นับแต่วันที่ได้รับแจ้งหรือรับทราบคำวินิจฉัย ตามพระราชบัญญัติตำรวจแห่งชาติ พ.ศ. 2565
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

function ReviewChecklist() {
  const items = [
    "ตรวจชื่อคู่กรณี",
    "ตรวจเลขเรื่องดำ/เรื่องแดง",
    "ตรวจวันยื่นคำร้อง/อุทธรณ์",
    "ตรวจอำนาจรับไว้พิจารณา",
    "ตรวจประเด็นวินิจฉัย",
    "ตรวจข้อกฎหมาย",
    "ตรวจพยานหลักฐาน",
    "ตรวจผลคำวินิจฉัย",
    "ตรวจสิทธิฟ้องศาลปกครองสูงสุด"
  ];

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <CheckSquare className="h-5 w-5 text-blue-600" />
        รายการตรวจสอบร่างคำวินิจฉัย
      </h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <label key={i} className="flex items-start cursor-pointer group">
            <div className="flex items-center h-5">
              <input
                id={`check-${i}`}
                name={`check-${i}`}
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
            </div>
            <div className="ml-3 text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
              {item}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
