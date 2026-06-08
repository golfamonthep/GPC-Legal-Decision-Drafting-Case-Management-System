"use client";

import React, { useState } from 'react';
import { Search, AlertTriangle, FileText, CheckCircle2, ShieldAlert, BookOpen } from 'lucide-react';

export default function LegalQaPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<any[]>([]);
  const [modelUsed, setModelUsed] = useState<string | null>(null);

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setAnswer(null);
    setCitations([]);
    setModelUsed(null);
    
    try {
      const res = await fetch("/api/rag/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          mode: "hybrid",
          topK: 5
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch response");
      
      setAnswer(data.answer);
      setCitations(data.citations || []);
      setModelUsed(data.modelUsed);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex flex-col items-center justify-center text-center pb-4">
          <BookOpen className="h-12 w-12 text-blue-800 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">ผู้ช่วยกฎหมาย AI (Legal Q&A)</h1>
          <p className="mt-2 text-base text-gray-600 max-w-2xl">
            สอบถามข้อกฎหมายและแนวคำวินิจฉัยจากฐานข้อมูลที่ได้รับอนุมัติ ระบบจะตอบคำถามโดยอ้างอิงจากข้อมูลที่มีในระบบเท่านั้น
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <form onSubmit={handleAsk} className="p-6">
            <div className="flex flex-col gap-4">
              <label className="block text-sm font-medium text-gray-700">คำถามข้อกฎหมาย</label>
              <div className="relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="block w-full p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-base min-h-[120px] resize-y shadow-sm"
                  placeholder="ตัวอย่าง: การอุทธรณ์คำสั่งลงโทษทางวินัยอย่างร้ายแรงต้องทำภายในกี่วัน และต้องทำเป็นหนังสือหรือไม่?"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="inline-flex justify-center items-center py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      กำลังประมวลผลคำตอบ...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      ถามผู้ช่วย AI
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 shadow-sm">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</h3>
                <div className="mt-1 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {answer && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Warning Banner */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
              <div className="flex items-start">
                <ShieldAlert className="h-6 w-6 text-amber-600 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-base font-semibold text-amber-800">คำเตือนความน่าเชื่อถือ (Confidence Warning)</h3>
                  <div className="mt-1 text-sm text-amber-700 space-y-1">
                    <p>ระบบ AI สร้างคำตอบจากเอกสารที่ค้นพบเท่านั้น อาจมีความคลาดเคลื่อนหรือไม่สมบูรณ์</p>
                    <p className="font-bold text-base text-red-700">"ต้องตรวจโดยนิติกร/กรรมการก่อนใช้งานจริง"</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Answer Box */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-blue-900 flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-blue-600" />
                  คำตอบจาก AI
                </h2>
                {modelUsed && (
                  <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                    Model: {modelUsed}
                  </span>
                )}
              </div>
              <div className="p-6 max-w-none text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                {answer}
              </div>
            </div>

            {/* Citations / Sources */}
            {citations.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                  <FileText className="h-5 w-5 mr-2 text-gray-500" />
                  เอกสารที่ใช้อ้างอิง (Retrieved Chunks)
                </h3>
                <div className="grid gap-4">
                  {citations.map((cite, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                            อ้างอิงที่ {idx + 1}
                          </span>
                          <h4 className="font-medium text-gray-900">{cite.sourceTitle}</h4>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {cite.sourceType}
                        </span>
                      </div>
                      {cite.citationMetadata?.referenceNumber && (
                        <p className="text-xs text-gray-500 mb-2">
                          เลขที่อ้างอิง: {cite.citationMetadata.referenceNumber}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-2 line-clamp-3 bg-gray-50 p-3 rounded border border-gray-100">
                        {cite.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
