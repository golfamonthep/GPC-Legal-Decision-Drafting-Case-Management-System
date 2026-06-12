"use client";

import { useState } from "react";
import { Link, Loader2, AlertCircle } from "lucide-react";

interface DocumentLinkModalProps {
  caseId: string;
  isGraphConfigured: boolean;
  graphMessage: string;
}

export function DocumentLinkModal({ caseId, isGraphConfigured, graphMessage }: DocumentLinkModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      webUrl: formData.get("webUrl"),
      documentCategory: formData.get("documentCategory"),
      notes: formData.get("notes"),
    };

    try {
      const response = await fetch(`/api/cases/${caseId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "เกิดข้อผิดพลาดในการเชื่อมโยงเอกสาร");
      }

      setIsOpen(false);
      window.location.reload(); // Simple reload to show new document
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
      >
        <Link className="-ml-0.5 mr-1.5 h-4 w-4 text-slate-400" />
        เชื่อมโยงเอกสารจาก OneDrive/SharePoint
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">เชื่อมโยงเอกสาร (Metadata)</h3>
            
            {!isGraphConfigured && (
              <div className="mb-4 rounded-md bg-yellow-50 p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">{graphMessage}</p>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">ชื่อเอกสาร</label>
                <input required type="text" name="title" className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">ลิงก์ URL (SharePoint/OneDrive)</label>
                <input required type="url" name="webUrl" placeholder="https://sharepoint.com/..." className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">ประเภทเอกสาร (Category)</label>
                <select required name="documentCategory" className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border">
                  <option value="คำร้องทุกข์">คำร้องทุกข์</option>
                  <option value="อุทธรณ์">อุทธรณ์</option>
                  <option value="คำชี้แจงคู่กรณี">คำชี้แจงคู่กรณี</option>
                  <option value="พยานหลักฐาน">พยานหลักฐาน</option>
                  <option value="คำสั่ง">คำสั่ง</option>
                  <option value="คำวินิจฉัย">คำวินิจฉัย</option>
                  <option value="ร่างคำวินิจฉัย">ร่างคำวินิจฉัย</option>
                  <option value="เอกสารประกอบการประชุม">เอกสารประกอบการประชุม</option>
                  <option value="อื่น ๆ">อื่น ๆ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">หมายเหตุ</label>
                <textarea name="notes" rows={2} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border"></textarea>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
