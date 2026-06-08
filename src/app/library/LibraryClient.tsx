"use client";

import { useState, useMemo } from "react";
import { BookOpen, ExternalLink, Edit2, AlertCircle } from "lucide-react";
import LegalSourceForm from "./LegalSourceForm";

export default function LibraryClient({ initialResources }: { initialResources: any[] }) {
  const [resources, setResources] = useState(initialResources);
  const [editingSource, setEditingSource] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [filters, setFilters] = useState({
    documentType: "",
    year: "",
    caseType: "",
    decisionResult: "",
    sourceStatus: ""
  });

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      // Search by title or issue tags
      const query = searchQuery.toLowerCase();
      const matchSearch = !query || 
        r.title.toLowerCase().includes(query) || 
        (r.issueTags && r.issueTags.some((tag: string) => tag.toLowerCase().includes(query)));
      
      const matchDocType = !filters.documentType || r.documentType === filters.documentType;
      const matchYear = !filters.year || r.year?.toString() === filters.year;
      const matchCaseType = !filters.caseType || r.caseType === filters.caseType;
      const matchDecision = !filters.decisionResult || r.decisionResult === filters.decisionResult;
      const matchStatus = !filters.sourceStatus || r.sourceStatus === filters.sourceStatus;

      return matchSearch && matchDocType && matchYear && matchCaseType && matchDecision && matchStatus;
    });
  }, [resources, searchQuery, filters]);

  // Unique values for filter dropdowns
  const uniqueYears = Array.from(new Set(resources.map(r => r.year).filter(Boolean))).sort();
  const uniqueDocTypes = Array.from(new Set(resources.map(r => r.documentType).filter(Boolean)));
  const uniqueCaseTypes = Array.from(new Set(resources.map(r => r.caseType).filter(Boolean)));
  const uniqueResults = Array.from(new Set(resources.map(r => r.decisionResult).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(resources.map(r => r.sourceStatus).filter(Boolean)));

  const handleUpdate = (updated: any) => {
    setResources(resources.map(r => r.id === updated.id ? updated : r));
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-900">
            คลังความรู้กฎหมาย
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            ฐานข้อมูลคำวินิจฉัย ก.พ.ค.ตร., คำพิพากษาศาลปกครองสูงสุด, และกฎหมายที่เกี่ยวข้อง (รองรับ Metadata)
          </p>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input 
            type="text" 
            placeholder="ค้นหาชื่อเรื่อง หรือประเด็นกฎหมาย..." 
            className="flex-1 rounded-md border-slate-300 border p-2 text-sm shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <select 
            className="rounded-md border-slate-300 border p-2 text-sm shadow-sm"
            value={filters.documentType} onChange={e => setFilters({...filters, documentType: e.target.value})}
          >
            <option value="">ประเภทเอกสาร (ทั้งหมด)</option>
            {uniqueDocTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select 
            className="rounded-md border-slate-300 border p-2 text-sm shadow-sm"
            value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})}
          >
            <option value="">ปี (ทั้งหมด)</option>
            {uniqueYears.map(y => <option key={String(y)} value={String(y)}>{y}</option>)}
          </select>

          <select 
            className="rounded-md border-slate-300 border p-2 text-sm shadow-sm"
            value={filters.caseType} onChange={e => setFilters({...filters, caseType: e.target.value})}
          >
            <option value="">ประเภทคดี (ทั้งหมด)</option>
            {uniqueCaseTypes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            className="rounded-md border-slate-300 border p-2 text-sm shadow-sm"
            value={filters.decisionResult} onChange={e => setFilters({...filters, decisionResult: e.target.value})}
          >
            <option value="">ผลคำวินิจฉัย (ทั้งหมด)</option>
            {uniqueResults.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select 
            className="rounded-md border-slate-300 border p-2 text-sm shadow-sm"
            value={filters.sourceStatus} onChange={e => setFilters({...filters, sourceStatus: e.target.value})}
          >
            <option value="">สถานะเอกสาร (ทั้งหมด)</option>
            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredResources.map((resource) => (
          <div
            key={resource.id}
            className="group relative flex flex-col justify-between rounded-lg bg-white p-6 shadow-sm border border-slate-200 hover:border-blue-500 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-x-3 text-sm text-slate-500">
                  <BookOpen className="h-4 w-4 text-slate-400" />
                  <span>{resource.documentType || resource.type}</span>
                </div>
                <button 
                  onClick={() => setEditingSource(resource)}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  title="แก้ไข Metadata"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>

              {(resource.sourceStatus === 'ร่าง' || resource.sourceStatus !== 'ใช้งาน') && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
                  <AlertCircle className="h-3 w-3" />
                  สถานะ: {resource.sourceStatus}
                </div>
              )}

              <h3 className="mt-4 text-lg font-medium leading-6 text-slate-900 line-clamp-3">
                {resource.title}
              </h3>
              
              <div className="mt-3 space-y-1">
                {resource.referenceNumber && (
                  <p className="text-sm text-slate-500">เลขที่อ้างอิง: {resource.referenceNumber}</p>
                )}
                {resource.year && (
                  <p className="text-sm text-slate-500">ปี: {resource.year}</p>
                )}
                {resource.issueTags && resource.issueTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {resource.issueTags.map((tag: string) => (
                      <span key={tag} className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <a href={resource.sourceFileUrl || resource.url || "#"} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
                อ่านต้นฉบับ
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </div>
          </div>
        ))}
        {filteredResources.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
            ไม่พบข้อมูลเอกสารที่ตรงกับเงื่อนไขการค้นหา
          </div>
        )}
      </div>

      {editingSource && (
        <LegalSourceForm 
          source={editingSource} 
          onClose={() => setEditingSource(null)} 
          onUpdated={handleUpdate} 
        />
      )}
    </div>
  );
}
