"use client";

import { useState } from "react";
import { 
  ArrowLeft, Save, Sparkles, CheckSquare, FileText, 
  Search, BookOpen, CheckCircle, Clock, AlertCircle,
  FileSearch, Scale, FileOutput, FilePlus
} from "lucide-react";
import Link from "next/link";
import { updateSection, updateAllSections, SectionStatus } from "./actions";

export function DraftEditor({ caseData, draftData }: { caseData: any, draftData: any }) {
  const [sections, setSections] = useState(draftData.sections);
  const [isSaving, setIsSaving] = useState(false);
  const [savingSectionId, setSavingSectionId] = useState<string | null>(null);

  const handleSectionChange = (id: string, content: string) => {
    setSections((prev: any) => 
      prev.map((s: any) => s.id === id ? { ...s, content } : s)
    );
  };

  const handleStatusChange = (id: string, status: string) => {
    setSections((prev: any) => 
      prev.map((s: any) => s.id === id ? { ...s, status } : s)
    );
  };

  const handleSaveSection = async (id: string) => {
    setSavingSectionId(id);
    const section = sections.find((s: any) => s.id === id);
    if (section) {
      await updateSection(section.id, section.content, section.status);
    }
    setSavingSectionId(null);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    await updateAllSections(
      sections.map((s: any) => ({ id: s.id, content: s.content, status: s.status })),
      caseData.id
    );
    setIsSaving(false);
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
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-100 overflow-hidden">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/cases/${caseData.id}`} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-md transition-colors">
            <ArrowLeft className="h-4 w-4" /> กลับ
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">พื้นที่ร่างคำวินิจฉัย</h1>
            <p className="text-xs text-slate-500 mt-0.5">คดีหมายเลขดำที่ {caseData.blackNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSaveAll}
            disabled={isSaving}
            className="inline-flex items-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <Save className="-ml-0.5 mr-2 h-4 w-4" /> {isSaving ? "กำลังบันทึก..." : "บันทึกร่างทั้งหมด"}
          </button>
        </div>
      </div>

      {/* Main Two-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Panel: Context & Checklist */}
        <div className="w-[380px] bg-slate-50 border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="p-5 space-y-6">
            
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
        <div className="flex-1 flex flex-col bg-slate-100">
          
          {/* AI Tools Toolbar (Disabled) */}
          <div className="bg-white px-6 py-3 border-b border-slate-200 flex flex-wrap gap-2 items-center shadow-sm z-10 shrink-0">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1">
              <Sparkles className="h-4 w-4" /> เครื่องมือช่วยร่าง
            </div>
            
            <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-md text-sm font-medium cursor-not-allowed">
              <FileSearch className="h-4 w-4" /> สรุปคำร้อง
            </button>
            <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-md text-sm font-medium cursor-not-allowed">
              <FileSearch className="h-4 w-4" /> สรุปคำแก้
            </button>
            <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-md text-sm font-medium cursor-not-allowed">
              <Search className="h-4 w-4" /> เสนอประเด็นวินิจฉัย
            </button>
            <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-md text-sm font-medium cursor-not-allowed">
              <BookOpen className="h-4 w-4" /> ค้นแนวคำวินิจฉัย
            </button>
            
            <div className="h-6 w-px bg-slate-300 mx-1"></div>
            
            <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-md text-sm font-medium cursor-not-allowed">
              <CheckCircle className="h-4 w-4" /> ตรวจถ้อยคำ
            </button>
            <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-md text-sm font-medium cursor-not-allowed">
              <Scale className="h-4 w-4" /> ตรวจข้อกฎหมาย
            </button>
            
            <div className="ml-auto">
              <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-md text-sm font-medium shadow-sm cursor-not-allowed">
                <FileOutput className="h-4 w-4" /> ส่งออก DOCX
              </button>
            </div>
          </div>

          {/* Document Editor Canvas */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-12">
              
              {/* Document Header */}
              <div className="bg-slate-900 text-white px-10 py-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                <h1 className="text-2xl font-bold mb-2">ร่างคำวินิจฉัย</h1>
                <p className="text-slate-300 text-sm">
                  คณะกรรมการพิทักษ์ระบบคุณธรรมข้าราชการตำรวจ (ก.พ.ค.ตร.)
                </p>
                <div className="mt-6 flex justify-between text-sm text-slate-400 font-mono">
                  <span>คดีหมายเลขดำที่ {caseData.blackNumber}</span>
                  <span>คดีหมายเลขแดงที่ {caseData.redNumber || "........................"}</span>
                </div>
              </div>

              {/* Document Body */}
              <div className="p-10">
                {sections.map((section: any) => {
                  const template = sectionTemplates.find(t => t.type === section.sectionType);
                  if (!template) return null;
                  
                  return (
                    <div key={section.id} className="mb-6 p-5 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-bold text-slate-800">{template.title}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <select 
                            value={section.status}
                            onChange={(e) => handleStatusChange(section.id, e.target.value)}
                            className="text-xs font-medium border-slate-200 rounded bg-slate-50 px-2 py-1"
                          >
                            {statusOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => handleSaveSection(section.id)}
                            disabled={savingSectionId === section.id}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded border border-slate-200 transition-colors flex items-center disabled:opacity-50"
                          >
                            <Save className="w-3 h-3 mr-1" /> {savingSectionId === section.id ? "กำลังบันทึก..." : "บันทึก"}
                          </button>
                        </div>
                      </div>
                      <textarea
                        rows={template.rows}
                        value={section.content}
                        onChange={(e) => handleSectionChange(section.id, e.target.value)}
                        className="block w-full rounded-md border-0 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-4 bg-slate-50 focus:bg-white transition-colors"
                        placeholder={template.placeholder}
                      />
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
