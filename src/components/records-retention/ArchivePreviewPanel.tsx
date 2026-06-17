"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Info, AlertTriangle, CheckCircle, Shield, Check } from "lucide-react";

interface CasePreviewResult {
  caseId: string;
  caseDisplayId: string;
  eligible: boolean;
  blockedReasons: string[];
  impact: {
    wouldMarkArchived: boolean;
    wouldPreserveDocuments: boolean;
    wouldPreserveAuditTrail: boolean;
    wouldAffectSearch: boolean;
    wouldAffectReports: boolean;
  };
}

interface ArchivePreviewResponse {
  ok: boolean;
  dryRun: boolean;
  eligibleCount: number;
  blockedCount: number;
  items: CasePreviewResult[];
  warnings: string[];
  error?: string;
}

interface EnvStatus {
  executionEnabled: boolean;
  environmentSafe: boolean;
  blockedReasons: string[];
}

export default function ArchivePreviewPanel() {
  const [caseIdsInput, setCaseIdsInput] = useState("");
  const [reason, setReason] = useState("");
  const [policyReference, setPolicyReference] = useState("");
  const [confirmationPhrase, setConfirmationPhrase] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  
  const [result, setResult] = useState<ArchivePreviewResponse | null>(null);
  const [executeResult, setExecuteResult] = useState<any | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null);

  useEffect(() => {
    fetch("/api/records-retention/archive/environment")
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setEnvStatus(data);
        }
      })
      .catch(err => console.error("Failed to check env status", err));
  }, []);

  const handlePreview = async () => {
    setError(null);
    setResult(null);
    setExecuteResult(null);

    const ids = caseIdsInput
      .split(",")
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (ids.length === 0) {
      setError("กรุณาระบุ Case ID อย่างน้อย 1 รายการ");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/records-retention/archive/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseIds: ids, reason, policyReference })
      });

      if (res.status === 401) {
        setError("Unauthorized (401) - กรุณาเข้าสู่ระบบใหม่");
      } else if (res.status === 403) {
        setError("Forbidden (403) - คุณไม่มีสิทธิ์ทดสอบจำลองการจัดเก็บข้อมูล (PREVIEW_ARCHIVE)");
      } else if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Error ${res.status}: ไม่สามารถตรวจสอบข้อมูลได้`);
      } else {
        const data: ArchivePreviewResponse = await res.json();
        setResult(data);
      }
    } catch (err: any) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!result || result.eligibleCount === 0) return;
    
    setError(null);
    setExecuting(true);
    
    const ids = caseIdsInput
      .split(",")
      .map(id => id.trim())
      .filter(id => id.length > 0);

    try {
      const res = await fetch("/api/records-retention/archive/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          caseIds: ids, 
          reason, 
          policyReference,
          confirmationPhrase 
        })
      });

      if (res.status === 401) {
        setError("Unauthorized (401) - กรุณาเข้าสู่ระบบใหม่");
      } else if (res.status === 403) {
        setError("Forbidden (403) - คุณไม่มีสิทธิ์จัดเก็บข้อมูล (ARCHIVE_CASE)");
      } else if (res.status === 423) {
        const data = await res.json().catch(() => ({}));
        setError(`Environment Blocked (423): ${data.error || "ระบบไม่อนุญาตให้จัดเก็บในสภาพแวดล้อมนี้"}`);
      } else if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Error ${res.status}: ไม่สามารถจัดเก็บข้อมูลได้`);
      } else {
        const data = await res.json();
        setExecuteResult(data);
        setConfirmationPhrase(""); // reset
      }
    } catch (err: any) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์เพื่อจัดเก็บข้อมูล");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg border border-slate-200 mt-6">
      <div className="px-4 py-5 sm:px-6 border-b border-slate-200 bg-slate-50 rounded-t-lg">
        <h3 className="text-base font-semibold leading-6 text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-500" />
          การจัดเก็บสำนวน (Archive Execution Panel)
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          แสดงตัวอย่างเท่านั้น ยังไม่มีการจัดเก็บ (Staging-only archive execution. Production execution is disabled.)
        </p>
      </div>

      <div className="px-4 py-5 sm:p-6 space-y-6">
        {envStatus && !envStatus.executionEnabled && (
          <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
            <div className="flex">
              <Shield className="h-5 w-5 text-amber-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Production Execution Disabled</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>ระบบถูกจำกัดให้สามารถทำงานได้แค่จำลองผลลัพธ์ (Dry-run preview) สาเหตุ: {envStatus.blockedReasons.join(", ")}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="caseIds" className="block text-sm font-medium leading-6 text-slate-900">
              ระบุ Case IDs (สำหรับการทดสอบระบบเท่านั้น คั่นด้วยเครื่องหมายจุลภาค ,)
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="caseIds"
                id="caseIds"
                className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="เช่น clw123..., clx456..."
                value={caseIdsInput}
                onChange={e => setCaseIdsInput(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium leading-6 text-slate-900">
                เหตุผลในการจัดเก็บ <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="reason"
                  id="reason"
                  className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="ต้องระบุเหตุผล"
                />
              </div>
            </div>
            <div>
              <label htmlFor="policyReference" className="block text-sm font-medium leading-6 text-slate-900">
                อ้างอิงนโยบาย (Optional)
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="policyReference"
                  id="policyReference"
                  className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={policyReference}
                  onChange={e => setPolicyReference(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handlePreview}
            disabled={loading || executing || caseIdsInput.trim() === ""}
            className="inline-flex items-center rounded-md bg-slate-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "กำลังตรวจสอบ..." : "ตรวจสอบผลกระทบก่อนจัดเก็บ"}
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3 text-sm text-red-800">{error}</div>
            </div>
          </div>
        )}
        
        {executeResult && (
          <div className="rounded-md bg-green-50 p-4 border border-green-200">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3 text-sm text-green-800">
                <p className="font-bold">จัดเก็บข้อมูลสำเร็จ</p>
                <p>จำนวนที่จัดเก็บ: {executeResult.archivedCount}</p>
                <p>เลขชุดดำเนินการ (Batch ID): {executeResult.archiveBatchId}</p>
                <p className="text-xs mt-1 text-green-700">Audit recorded. Viewable in admin audit tools.</p>
              </div>
            </div>
          </div>
        )}

        {result && !executeResult && (
          <div className="mt-6 border-t border-slate-200 pt-6">
            <h4 className="text-sm font-semibold text-slate-900 mb-4">ผลการตรวจสอบสิทธิ์/เงื่อนไข</h4>
            
            {result.warnings && result.warnings.length > 0 && (
              <div className="mb-4 space-y-2">
                {result.warnings.map((w, idx) => (
                  <div key={idx} className="rounded-md bg-amber-50 p-3 border border-amber-200 text-sm text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> {w}
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-green-700">{result.eligibleCount}</span>
                <span className="text-sm text-green-800 mt-1">รายการที่ดำเนินการได้</span>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-red-700">{result.blockedCount}</span>
                <span className="text-sm text-red-800 mt-1">รายการที่ยังดำเนินการไม่ได้</span>
              </div>
            </div>

            <div className="space-y-4">
              {result.items.map((item, idx) => (
                <div key={idx} className={`p-4 border rounded-lg ${item.eligible ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-slate-900">{item.caseDisplayId}</span>
                      <span className="text-xs text-slate-500 ml-2">ID: {item.caseId}</span>
                    </div>
                    {item.eligible ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                        <CheckCircle className="w-3 h-3" /> Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">
                        <AlertTriangle className="w-3 h-3" /> Blocked
                      </span>
                    )}
                  </div>
                  
                  {!item.eligible && item.blockedReasons.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-semibold text-slate-700">เหตุผลที่ไม่ผ่านเงื่อนไข:</span>
                      <ul className="mt-1 list-disc list-inside text-xs text-red-600">
                        {item.blockedReasons.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6 bg-slate-50 p-4 rounded-lg">
               {envStatus && envStatus.executionEnabled ? (
                 <div className="space-y-4">
                   <h4 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                     <Shield className="w-5 h-5 text-indigo-500" />
                     ดำเนินการจัดเก็บในสภาพแวดล้อมทดสอบเท่านั้น
                   </h4>
                   <p className="text-xs text-slate-500">
                     ตรวจสอบผล Preview ให้แน่ใจ การดำเนินการนี้จะเปลี่ยนสถานะเอกสารเป็น ARCHIVED ทันที
                   </p>
                   
                   <div>
                     <label htmlFor="phrase" className="block text-xs font-medium text-slate-700">
                       รหัสยืนยัน: <span className="font-mono text-indigo-600 font-bold">ARCHIVE PILOT CASES</span> หรือ <span className="font-mono text-indigo-600 font-bold">ยืนยันจัดเก็บสำนวน</span>
                     </label>
                     <input
                        type="text"
                        id="phrase"
                        className="mt-1 block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        value={confirmationPhrase}
                        onChange={(e) => setConfirmationPhrase(e.target.value)}
                        placeholder="พิมพ์เพื่อยืนยัน"
                     />
                   </div>

                   <button
                      type="button"
                      onClick={handleExecute}
                      disabled={executing || result.eligibleCount === 0 || !reason || !(confirmationPhrase === "ARCHIVE PILOT CASES" || confirmationPhrase === "ยืนยันจัดเก็บสำนวน")}
                      className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {executing ? "กำลังดำเนินการ..." : "ดำเนินการจัดเก็บ (Execute)"}
                    </button>
                 </div>
               ) : (
                 <div className="flex items-start gap-4">
                   <Shield className="w-6 h-6 text-slate-400 flex-shrink-0" />
                   <div>
                     <h4 className="text-sm font-medium text-slate-900">Execution Blocked</h4>
                     <p className="text-xs text-slate-500 mt-1">
                       Real archive execution is currently disabled for safety. Only dry-run previews are permitted.
                     </p>
                     <button
                        type="button"
                        disabled
                        className="mt-3 inline-flex items-center rounded-md bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 cursor-not-allowed"
                      >
                        Pending approval to execute
                      </button>
                   </div>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
