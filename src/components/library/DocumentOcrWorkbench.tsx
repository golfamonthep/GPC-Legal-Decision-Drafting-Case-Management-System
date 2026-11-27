"use client";

import { useState } from "react";
import { 
  FileText, 
  Upload, 
  Loader2, 
  Check, 
  Copy, 
  Sparkles, 
  AlertCircle, 
  ShieldCheck, 
  Layers,
  ExternalLink
} from "lucide-react";

interface OcrLineItem {
  text: string;
  confidence?: number;
  row?: number;
}

interface OcrResultPayload {
  engine: string;
  text: string;
  lines?: OcrLineItem[];
  line_count?: number;
  avg_confidence?: number;
  rec2_enabled?: boolean;
  judge9_enabled?: boolean;
  dpi?: number;
  low_confidence_lines?: OcrLineItem[];
}

const PRESET_FILES = [
  {
    label: "หนังสือเวียน ตร. ว ๒๔๕๖ (แต่งตั้ง รอง ผบก. - สว. ๒๕๖๙)",
    path: "scratch/policeworker/circular_2456_2569.pdf",
    totalPages: 11,
    desc: "บันทึกข้อความ ตร. ที่ ๐๐๐๙.๒๓๑/ว ๒๔๕๖ ลง ๒๒ ต.ค. ๖๙ (๑๑ หน้า · ข้อ ๑-๑๓ และ ผนวก ก-ช)"
  },
  {
    label: "คำสั่ง ตร. ที่ ๕๑๕/๒๕๖๙ (มอบอำนาจการดำเนินการทางวินัย)",
    path: "public/documents/laws/tr_order_515_2569.pdf",
    totalPages: 7,
    desc: "คำสั่งสำนักงานตำรวจแห่งชาติ ที่ ๕๑๕/๒๕๖๙ ลง ๒๔ พ.ย. ๖๙ (๗ หน้า · ยกเลิก ๔๓๖/๒๕๔๘)"
  },
  {
    label: "กฎ ก.ตร. วินัย 2569 (ฉบับราชกิจจานุเบกษา)",
    path: "public/documents/laws/ktr_discipline_2569.pdf",
    totalPages: 91,
    desc: "กฎ ก.ตร. ว่าด้วยการดำเนินการทางวินัย พ.ศ. ๒๕๖๙ (๑๒ ต.ค. ๖๙ · ๙๑ หน้า)"
  },
  {
    label: "คำสั่ง ตร. ที่ 424/2569 (มอบหมายอำนาจ รอง ผบ.ตร.)",
    path: "scratch/policeworker/order-424-2569.pdf",
    totalPages: 18,
    desc: "คำสั่ง ตร. ที่ ๔๒๔/๒๕๖๙ ลง ๑ ต.ค. ๖๙"
  }
];

export default function DocumentOcrWorkbench() {
  const [selectedFileMode, setSelectedFileMode] = useState<"preset" | "upload">("preset");
  const [presetIndex, setPresetIndex] = useState(0);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [engine, setEngine] = useState<"openthai-text" | "openthai-markdown" | "paddle" | "typhoon">("openthai-text");
  const [page, setPage] = useState(1);
  const [dewarp, setDewarp] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResultPayload | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRunOcr = async () => {
    setIsLoading(true);
    setError(null);
    setOcrResult(null);

    try {
      if (selectedFileMode === "upload") {
        if (!uploadFile) {
          throw new Error("กรุณาเลือกไฟล์ที่ต้องการถอดข้อความ");
        }
        const formData = new FormData();
        formData.append("file", uploadFile);
        formData.append("engine", engine);
        formData.append("page", page.toString());
        if (dewarp) formData.append("dewarp", "true");
        if (apiKey) formData.append("apiKey", apiKey);

        const res = await fetch("/api/ocr", {
          method: "POST",
          body: formData
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || "เกิดข้อผิดพลาดในการรัน OCR");
        }
        setOcrResult(json.data);
      } else {
        const target = PRESET_FILES[presetIndex];
        const res = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filePath: target.path,
            engine,
            page,
            dewarp,
            apiKey
          })
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || "เกิดข้อผิดพลาดในการรัน OCR");
        }
        setOcrResult(json.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ OCR Engine");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!ocrResult?.text) return;
    navigator.clipboard.writeText(ocrResult.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activePreset = PRESET_FILES[presetIndex];

  return (
    <div className="space-y-6">
      {/* Engine Status Banner */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 rounded-2xl p-6 text-slate-900 dark:text-white border border-indigo-200/80 dark:border-slate-700 shadow-md dark:shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-500/30">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              OpenThai 2.2 OCR (27 พ.ย. ๒๕๖๙ · judge9 ๙/๕ + Dewarp)
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              ระบบถอดข้อความเอกสารราชการ (OpenThai 2.2 · PaddleOCR · Typhoon)
            </h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300">
              อัปเกรดเป็น iApp OpenThai 2.2 ล่าสุด: อ่านราชกิจจานุเบกษา 97.8%, คำพิพากษาศาลปกครอง 97.0%, ตารางเอกสารไทย 95.0% พร้อมตัวจำแนกเลขไทย ๙/๕ (judge9.onnx) และปรับหน้าภาพถ่ายมือถืออัตโนมัติ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://huggingface.co/iapp/OpenThai2.2-OCR-Text-20261127"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-white dark:bg-white/10 border border-indigo-200 dark:border-indigo-500/30 shadow-sm text-xs hover:border-indigo-400 transition-colors"
            >
              <div className="text-indigo-600 dark:text-indigo-300 text-[10px] font-bold flex items-center gap-1">
                <span>OPENTHAI 2.2.1 TEXT</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </div>
              <div className="font-bold text-slate-900 dark:text-white">OpenThai2.2-OCR-Text (rec2+judge9)</div>
            </a>
            <a
              href="https://huggingface.co/iapp/OpenThai2.2-OCR-Markdown-20261127"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-white dark:bg-white/10 border border-indigo-200 dark:border-indigo-500/30 shadow-sm text-xs hover:border-indigo-400 transition-colors"
            >
              <div className="text-indigo-600 dark:text-indigo-300 text-[10px] font-bold flex items-center gap-1">
                <span>OPENTHAI 2.2 MD</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </div>
              <div className="font-bold text-slate-900 dark:text-white">OpenThai2.2-OCR-Markdown (0.6B)</div>
            </a>
            <div className="px-3 py-2 rounded-xl bg-white dark:bg-white/10 border border-indigo-100 dark:border-white/10 shadow-sm text-xs">
              <div className="text-slate-500 dark:text-slate-400 text-[10px]">PADDLE / TYPHOON</div>
              <div className="font-bold text-slate-900 dark:text-white">PP-OCR + SCB 10X</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-500" />
              เลือกเอกสารต้นทาง
            </h3>

            {/* Mode Toggle */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSelectedFileMode("preset")}
                className={`py-2 rounded-lg transition-all ${
                  selectedFileMode === "preset"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                เอกสารระบบล่าสุด (NEW)
              </button>
              <button
                type="button"
                onClick={() => setSelectedFileMode("upload")}
                className={`py-2 rounded-lg transition-all ${
                  selectedFileMode === "upload"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                อัปโหลดไฟล์ใหม่
              </button>
            </div>

            {selectedFileMode === "preset" ? (
              <div className="space-y-2">
                {PRESET_FILES.map((pf, idx) => (
                  <button
                    key={pf.path}
                    type="button"
                    onClick={() => {
                      setPresetIndex(idx);
                      setPage(1);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      presetIndex === idx
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500/30"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40"
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {pf.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {pf.desc} ({pf.totalPages} หน้า)
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {uploadFile ? uploadFile.name : "ลากไฟล์มาวาง หรือคลิกเลือกไฟล์"}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  รองรับไฟล์ PDF, PNG, JPG, TIFF (ไม่เกิน 50MB)
                </div>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setUploadFile(e.target.files[0]);
                      setPage(1);
                    }
                  }}
                  className="mt-3 text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-xs hover:file:bg-indigo-700 cursor-pointer"
                />
              </div>
            )}

            {/* Engine & Settings */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  OCR Engine
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setEngine("openthai-text")}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      engine === "openthai-text"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <div>OpenThai2.2-OCR-Text (v2.2.1)</div>
                    <div className="text-[10px] font-normal text-slate-500">CPU ONNX · Dual rec2 + judge9 (๙/๕)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEngine("openthai-markdown")}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      engine === "openthai-markdown"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <div>OpenThai2.2-OCR-Markdown (v2.2.2)</div>
                    <div className="text-[10px] font-normal text-slate-500">Markdown + ตาราง HTML (95.0% · DFlash2)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEngine("paddle")}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      engine === "paddle"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <div>PaddleOCR</div>
                    <div className="text-[10px] font-normal text-slate-500">Local PP-OCRv5</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEngine("typhoon")}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      engine === "typhoon"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <div>Typhoon-OCR</div>
                    <div className="text-[10px] font-normal text-slate-500">SCB 10X Thai VLM</div>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    หน้าที่ต้องการอ่าน
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedFileMode === "preset" ? activePreset.totalPages : 100}
                    value={page}
                    onChange={(e) => setPage(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                  />
                </div>
                {selectedFileMode === "preset" && (
                  <div className="text-[11px] text-slate-400 pt-5">
                    จากทั้งหมด {activePreset.totalPages} หน้า
                  </div>
                )}
              </div>

              {selectedFileMode === "upload" && (engine === "openthai-text" || engine === "openthai-markdown") && (
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={dewarp}
                    onChange={(e) => setDewarp(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs leading-snug">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 block">
                      ปรับความโค้ง/เอียงภาพถ่ายมือถือ (OpenThai 2.2 Dewarp)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      เหมาะสำหรับภาพถ่ายกระดาษเอียงหรือโค้งงอ (หน้าสแกนเรียบ/PDF จะถูกข้ามอัตโนมัติไม่เสียรายละเอียด)
                    </span>
                  </span>
                </label>
              )}

              {engine === "typhoon" && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Typhoon API Key (ไม่บังคับ)
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="ใส่คีย์หรือใช้ค่า default"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                  <span className="text-[10px] text-slate-400">
                    หากไม่ระบุ ระบบจะใช้โหมด Offline Prompt Preparation
                  </span>
                </div>
              )}
            </div>

            {/* Run Button */}
            <button
              type="button"
              onClick={handleRunOcr}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังประมวลผล OCR...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  เริ่มถอดข้อความ (Execute OCR)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Column (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  ผลลัพธ์การถอดข้อความ
                </h3>
                {ocrResult && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                    {ocrResult.engine} (หน้า {page})
                  </span>
                )}
              </div>

              {ocrResult?.text && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>คัดลอกข้อความ</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex-1 py-4">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    กำลังประมวลผลการอ่านเอกสารด้วย{" "}
                    {engine === "openthai-text"
                      ? "OpenThai2.2-OCR-Text (v2.2.1 · Dual ONNX + judge9)"
                      : engine === "openthai-markdown"
                        ? "OpenThai2.2-OCR-Markdown (v2.2.2 · Nemotron 3.5 Parse)"
                        : engine === "paddle"
                          ? "PaddleOCR"
                          : "Typhoon-OCR"}
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm">
                    กำลังแปลงไฟล์หน้า {page} ตรวจหาตำแหน่งกล่องข้อความ (Detection) และสกัดตัวอักษร (Recognition)...
                  </p>
                </div>
              ) : error ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 text-red-500">
                  <AlertCircle className="h-8 w-8" />
                  <div className="text-sm font-bold">เกิดข้อผิดพลาด</div>
                  <p className="text-xs text-red-400 max-w-md">{error}</p>
                </div>
              ) : ocrResult ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-[480px] overflow-y-auto">
                    {ocrResult.text}
                  </div>

                  {ocrResult.lines && (
                    <div className="space-y-2">
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 px-1">
                        <span>
                          ตรวจพบข้อความทั้งหมด {ocrResult.line_count || ocrResult.lines.length} บรรทัด
                          {ocrResult.rec2_enabled ? " · Dual-Recognizer (rec2)" : ""}
                          {ocrResult.judge9_enabled ? " · judge9 (๙/๕)" : ""}
                          {ocrResult.dpi ? ` · ${ocrResult.dpi} DPI` : ""}
                        </span>
                        <span>Confidence เฉลี่ย: {
                          ((ocrResult.avg_confidence ?? (ocrResult.lines.reduce((acc: number, l: OcrLineItem) => acc + (l.confidence || 0), 0) / (ocrResult.lines.length || 1))) * 100).toFixed(1)
                        }%</span>
                      </div>
                      {Array.isArray(ocrResult.low_confidence_lines) && ocrResult.low_confidence_lines.length > 0 && (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                          <div className="font-bold">
                            จุดควรตรวจสอบเพิ่มเติม ({ocrResult.low_confidence_lines.length} บรรทัดที่ความมั่นใจต่ำกว่า 90%)
                          </div>
                          {ocrResult.low_confidence_lines.slice(0, 5).map((item: OcrLineItem, idx: number) => (
                            <div key={idx} className="font-mono text-[11px]">
                              • [{((item.confidence || 0) * 100).toFixed(1)}%] {item.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                  <FileText className="h-12 w-12 stroke-[1.2] opacity-40" />
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    ยังไม่มีผลลัพธ์การถอดข้อความ
                  </div>
                  <p className="text-xs text-slate-400 max-w-xs">
                    เลือกเอกสารหรืออัปโหลดไฟล์ แล้วกด &ldquo;เริ่มถอดข้อความ&rdquo; เพื่อดูตัวบทและตำแหน่งข้อความ
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
