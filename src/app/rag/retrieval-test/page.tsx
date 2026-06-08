"use client";

import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function RetrievalTestPage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"keyword" | "vector" | "hybrid">("hybrid");
  const [filters, setFilters] = useState({
    sourceStatus: "ใช้งาน",
    reliabilityLevels: "official,internal", // comma separated for easy handling
    caseType: "",
    legalCategory: "",
    sourceType: "",
    year: "",
    decisionResult: ""
  });
  
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setSearched(true);
    
    const parsedFilters: any = {};
    if (filters.sourceStatus) parsedFilters.sourceStatus = filters.sourceStatus;
    if (filters.reliabilityLevels) parsedFilters.reliabilityLevels = filters.reliabilityLevels.split(',').map(s => s.trim());
    if (filters.caseType) parsedFilters.caseType = filters.caseType;
    if (filters.legalCategory) parsedFilters.legalCategory = filters.legalCategory;
    if (filters.sourceType) parsedFilters.sourceType = filters.sourceType;
    if (filters.year) parsedFilters.year = parseInt(filters.year);
    if (filters.decisionResult) parsedFilters.decisionResult = filters.decisionResult;

    try {
      const res = await fetch("/api/rag/retrieval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          mode,
          filters: parsedFilters,
          topK: 8
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch results");
      
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ทดสอบระบบสืบค้น (Retrieval Test)</h1>
            <p className="mt-1 text-sm text-gray-500">
              ทดสอบคุณภาพการค้นหาข้อมูลทางกฎหมาย (Keyword, Vector, Hybrid) ก่อนการนำไปสร้างคำตอบด้วย AI
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSearch} className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">ข้อความที่ต้องการค้นหา (Query)</label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="ป้อนคำค้นหา เช่น การอุทธรณ์คำสั่งลงโทษทางวินัย..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">โหมดการค้นหา</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="hybrid">Hybrid Search (แนะนำ)</option>
                  <option value="vector">Vector Search (Semantic)</option>
                  <option value="keyword">Keyword Search (Exact)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทคดี</label>
                <select
                  value={filters.caseType}
                  onChange={(e) => setFilters({...filters, caseType: e.target.value})}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="ร้องทุกข์">ร้องทุกข์</option>
                  <option value="อุทธรณ์">อุทธรณ์</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่กฎหมาย</label>
                <input
                  type="text"
                  value={filters.legalCategory}
                  onChange={(e) => setFilters({...filters, legalCategory: e.target.value})}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="เช่น วินัย, การออกจากราชการ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทเอกสาร</label>
                <select
                  value={filters.sourceType}
                  onChange={(e) => setFilters({...filters, sourceType: e.target.value})}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="SupremeAdministrativeCourt">คำพิพากษาศาลปกครองสูงสุด</option>
                  <option value="GPC_Decision">คำวินิจฉัย ก.พ.ค.ตร.</option>
                  <option value="Act">พรบ. / กฎระเบียบ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานะเอกสาร</label>
                <select
                  value={filters.sourceStatus}
                  onChange={(e) => setFilters({...filters, sourceStatus: e.target.value})}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="ใช้งาน">ใช้งาน</option>
                  <option value="ร่าง">ร่าง</option>
                  <option value="ยกเลิก">ยกเลิก</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ระดับความน่าเชื่อถือ</label>
                <select
                  value={filters.reliabilityLevels}
                  onChange={(e) => setFilters({...filters, reliabilityLevels: e.target.value})}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="official,internal">Official & Internal</option>
                  <option value="official">Official เท่านั้น</option>
                  <option value="internal">Internal เท่านั้น</option>
                  <option value="unofficial">Unofficial</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ปีที่ออก</label>
                <input
                  type="number"
                  value={filters.year}
                  onChange={(e) => setFilters({...filters, year: e.target.value})}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="เช่น 2566"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ผลคำวินิจฉัย</label>
                <input
                  type="text"
                  value={filters.decisionResult}
                  onChange={(e) => setFilters({...filters, decisionResult: e.target.value})}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="เช่น ยกคำร้อง"
                />
              </div>
            </div>
          </form>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">เกิดข้อผิดพลาดในการค้นหา</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {searched && !loading && !error && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">
              ผลการค้นหา ({results.length} รายการ)
            </h2>
            
            {results.length === 0 ? (
              <div className="text-center bg-white p-12 rounded-xl border border-gray-200">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบข้อมูล</h3>
                <p className="mt-1 text-sm text-gray-500">
                  ลองปรับเปลี่ยนคำค้นหาหรือตัวกรอง
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    
                    {/* Warning for inactive/draft */}
                    {result.sourceStatus !== "ใช้งาน" && (
                      <div className="mb-4 bg-amber-50 border-l-4 border-amber-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <ShieldAlert className="h-5 w-5 text-amber-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-amber-700">
                              คำเตือน: ข้อมูลนี้มีสถานะเป็น <strong>{result.sourceStatus}</strong> (ไม่ได้ใช้งาน)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-lg font-medium text-blue-900">{result.sourceTitle}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {result.sourceType}
                          </span>
                          {result.citationMetadata?.referenceNumber && (
                            <span className="inline-flex items-center">
                              เลขที่อ้างอิง: {result.citationMetadata.referenceNumber}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                            {result.reliabilityLevel}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 text-xs">
                        <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                          Combined: {(result.combinedScore || 0).toFixed(4)}
                        </div>
                        {mode !== 'keyword' && (
                          <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-100">
                            Sim: {(result.similarityScore || 0).toFixed(4)}
                          </div>
                        )}
                        {mode !== 'vector' && (
                          <div className="px-3 py-1 bg-green-50 text-green-700 rounded-md border border-green-100">
                            KW: {(result.keywordScore || 0).toFixed(4)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-100">
                      {result.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
