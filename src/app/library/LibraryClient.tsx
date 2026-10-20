"use client";

import { useState, useMemo, useTransition } from "react";
import { 
  BookOpen, 
  ExternalLink, 
  Edit2, 
  AlertCircle, 
  Database, 
  Loader2, 
  Trash2, 
  Cpu,
  Scale,
  Sparkles
} from "lucide-react";
import LegalSourceForm from "./LegalSourceForm";
import { ingestLegalSource, deleteChunks } from "./actions";
import { generateAllMissingEmbeddings } from "./actions/embedding";
import PoliceLawCatalog from "@/components/library/PoliceLawCatalog";

export default function LibraryClient({ initialResources }: { initialResources: any[] }) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'archive'>('catalog');
  const [resources, setResources] = useState(initialResources || []);
  const [editingSource, setEditingSource] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [ingestingId, setIngestingId] = useState<string | null>(null);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  
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
    setResources(resources.map(r => r.id === updated.id ? { ...r, ...updated } : r));
  };

  const handleIngest = async (id: string) => {
    if (!confirm("ยืนยันการนำเข้าข้อมูลเพื่อสร้าง Chunks หรือไม่?")) return;
    setIngestingId(id);
    startTransition(async () => {
      try {
        await ingestLegalSource(id, "user-id-placeholder");
        alert("นำเข้าข้อมูลสำเร็จ");
      } catch (err: any) {
        alert("เกิดข้อผิดพลาด: " + err.message);
      } finally {
        setIngestingId(null);
      }
    });
  };

  const handleDeleteChunks = async (id: string) => {
    if (!confirm("คุณต้องการลบ Chunks และล้างข้อมูลการนำเข้าใช่หรือไม่?")) return;
    startTransition(async () => {
      try {
        await deleteChunks(id, "user-id-placeholder");
        alert("ลบข้อมูล Chunks สำเร็จ");
      } catch (err: any) {
        alert("เกิดข้อผิดพลาด: " + err.message);
      }
    });
  };

  const handleGenerateAllEmbeddings = async () => {
    if (!confirm("ยืนยันการสร้าง Embeddings สำหรับ Chunks ทั้งหมดที่ยังไม่มี Embeddings หรือไม่?")) return;
    setIsGeneratingEmbeddings(true);
    try {
      const res = await generateAllMissingEmbeddings("user-id-placeholder");
      if (res.success) {
        alert(`สร้าง Embeddings สำเร็จจำนวน ${res.count} chunks`);
      } else {
        alert("เกิดข้อผิดพลาด: " + res.error);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="sm:flex sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
        <div className="sm:flex-auto">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              คลังความรู้กฎหมาย
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 font-semibold border border-red-200 dark:border-red-900/40">
              POLICE LAW REPO
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            ระบบสืบค้นแคตตาล็อกกฎหมายตำรวจ (กฤษฎีกา / PyThaiNLP) และฐานข้อมูลคำวินิจฉัย ก.พ.ค.ตร.
          </p>
        </div>

        {activeTab === 'archive' && (
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={handleGenerateAllEmbeddings}
              disabled={isGeneratingEmbeddings}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isGeneratingEmbeddings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
              <span>Generate Missing Embeddings</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation Tabs */}
      <div className="mt-6 flex border-b border-slate-200 dark:border-white/10 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'catalog'
              ? 'border-[#d62839] text-[#d62839] dark:text-red-400 dark:border-red-500'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>แคตตาล็อกกฎหมายตำรวจ (พ.ร.บ.ตำรวจ 2565 / กฤษฎีกา)</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold">
            2,337 มาตรา
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('archive')}
          className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'archive'
              ? 'border-[#d62839] text-[#d62839] dark:text-red-400 dark:border-red-500'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>คลังคำวินิจฉัยและเอกสารอ้างอิง</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-medium">
            {resources.length} รายการ
          </span>
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'catalog' ? (
        <div className="mt-6">
          <PoliceLawCatalog />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-[#121215] p-5 rounded-xl shadow-sm border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                type="text" 
                placeholder="ค้นหาชื่อเรื่อง หรือประเด็นกฎหมายในคลังเอกสาร..." 
                className="flex-1 rounded-lg border border-slate-300 dark:border-white/10 dark:bg-[#18181e] dark:text-white p-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <select 
                className="rounded-lg border border-slate-300 dark:border-white/10 dark:bg-[#18181e] dark:text-white p-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                value={filters.documentType} onChange={e => setFilters({...filters, documentType: e.target.value})}
              >
                <option value="">ประเภทเอกสาร (ทั้งหมด)</option>
                {uniqueDocTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <select 
                className="rounded-lg border border-slate-300 dark:border-white/10 dark:bg-[#18181e] dark:text-white p-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})}
              >
                <option value="">ปี (ทั้งหมด)</option>
                {uniqueYears.map(y => <option key={String(y)} value={String(y)}>{y}</option>)}
              </select>

              <select 
                className="rounded-lg border border-slate-300 dark:border-white/10 dark:bg-[#18181e] dark:text-white p-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                value={filters.caseType} onChange={e => setFilters({...filters, caseType: e.target.value})}
              >
                <option value="">ประเภทคดี (ทั้งหมด)</option>
                {uniqueCaseTypes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select 
                className="rounded-lg border border-slate-300 dark:border-white/10 dark:bg-[#18181e] dark:text-white p-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                value={filters.decisionResult} onChange={e => setFilters({...filters, decisionResult: e.target.value})}
              >
                <option value="">ผลคำวินิจฉัย (ทั้งหมด)</option>
                {uniqueResults.map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              <select 
                className="rounded-lg border border-slate-300 dark:border-white/10 dark:bg-[#18181e] dark:text-white p-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                value={filters.sourceStatus} onChange={e => setFilters({...filters, sourceStatus: e.target.value})}
              >
                <option value="">สถานะเอกสาร (ทั้งหมด)</option>
                {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => (
              <div
                key={resource.id}
                className="group relative flex flex-col justify-between rounded-xl bg-white dark:bg-[#121215] p-6 shadow-sm border border-slate-200 dark:border-white/10 hover:border-red-500/60 dark:hover:border-red-500/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-x-3 text-sm text-slate-500 dark:text-slate-400">
                      <BookOpen className="h-4 w-4 text-slate-400" />
                      <span>{resource.documentType || resource.type}</span>
                    </div>
                    <button 
                      onClick={() => setEditingSource(resource)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="แก้ไข Metadata"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>

                  {(resource.sourceStatus === 'ร่าง' || resource.sourceStatus !== 'ใช้งาน') && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-900/40">
                      <AlertCircle className="h-3 w-3" />
                      สถานะ: {resource.sourceStatus}
                    </div>
                  )}

                  <h3 className="mt-4 text-base font-semibold leading-6 text-slate-900 dark:text-white line-clamp-3">
                    {resource.title}
                  </h3>
                  
                  <div className="mt-3 space-y-1">
                    {resource.referenceNumber && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">เลขที่อ้างอิง: {resource.referenceNumber}</p>
                    )}
                    {resource.year && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">ปี: {resource.year}</p>
                    )}
                    {resource.issueTags && resource.issueTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {resource.issueTags.map((tag: string) => (
                          <span key={tag} className="inline-flex items-center rounded-md bg-slate-100 dark:bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Ingestion Status Area */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">การนำเข้าข้อมูล (Ingestion)</span>
                          {resource.ingestionJobs && resource.ingestionJobs.length > 0 && (
                            <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                              resource.ingestionJobs[0].status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300' :
                              resource.ingestionJobs[0].status === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}>
                              {resource.ingestionJobs[0].status}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleIngest(resource.id)}
                            disabled={isPending || ingestingId === resource.id}
                            className="flex-1 inline-flex justify-center items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/40 disabled:opacity-50 transition-colors"
                          >
                            {ingestingId === resource.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Database className="h-3.5 w-3.5" />
                            )}
                            {(resource._count?.documentChunks ?? 0) > 0 ? "Re-ingest" : "Ingest"}
                          </button>
                          
                          {(resource._count?.documentChunks ?? 0) > 0 && (
                            <button
                              onClick={() => handleDeleteChunks(resource.id)}
                              disabled={isPending}
                              className="inline-flex justify-center items-center p-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 disabled:opacity-50 transition-colors"
                              title="ลบ Chunks"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {(resource._count?.documentChunks ?? 0) > 0 && (
                          <a href={`/library/${resource.id}/chunks`} className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 flex items-center justify-center mt-1 font-medium">
                            View {resource._count.documentChunks} Chunks <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <a href={resource.sourceFileUrl || resource.url || "#"} className="flex items-center text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400">
                    อ่านต้นฉบับ
                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
            {filteredResources.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#121215] rounded-xl border border-slate-200 dark:border-white/10 border-dashed">
                ไม่พบข้อมูลเอกสารคำวินิจฉัยที่ตรงกับเงื่อนไขการค้นหา
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
      )}
    </div>
  );
}
