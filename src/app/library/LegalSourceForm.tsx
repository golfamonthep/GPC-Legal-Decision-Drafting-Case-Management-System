"use client";

import { useState } from "react";
import { updateLegalSourceMetadata } from "../actions";

export default function LegalSourceForm({ 
  source, 
  onClose,
  onUpdated
}: { 
  source: any; 
  onClose: () => void;
  onUpdated: (updated: any) => void;
}) {
  const [formData, setFormData] = useState({
    title: source.title || "",
    documentType: source.documentType || "",
    referenceNumber: source.referenceNumber || "",
    year: source.year || "",
    caseType: source.caseType || "",
    legalCategory: source.legalCategory || "",
    issueTags: source.issueTags ? source.issueTags.join(", ") : "",
    lawNames: source.lawNames ? source.lawNames.join(", ") : "",
    sectionNumbers: source.sectionNumbers ? source.sectionNumbers.join(", ") : "",
    decisionResult: source.decisionResult || "",
    sourceStatus: source.sourceStatus || "ใช้งาน",
    reliabilityLevel: source.reliabilityLevel || "official",
    effectiveDate: source.effectiveDate ? new Date(source.effectiveDate).toISOString().split('T')[0] : "",
    expiredDate: source.expiredDate ? new Date(source.expiredDate).toISOString().split('T')[0] : "",
    sourceFileUrl: source.sourceFileUrl || ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        year: formData.year ? parseInt(formData.year.toString()) : undefined,
        issueTags: formData.issueTags.split(",").map((s: string) => s.trim()).filter(Boolean),
        lawNames: formData.lawNames.split(",").map((s: string) => s.trim()).filter(Boolean),
        sectionNumbers: formData.sectionNumbers.split(",").map((s: string) => s.trim()).filter(Boolean),
        effectiveDate: formData.effectiveDate ? new Date(formData.effectiveDate) : undefined,
        expiredDate: formData.expiredDate ? new Date(formData.expiredDate) : undefined,
      };
      
      const updated = await updateLegalSourceMetadata(source.id, dataToSave as any);
      onUpdated(updated);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto pt-20 pb-10">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl">
        <h2 className="text-xl font-bold mb-4">แก้ไขข้อมูลเอกสาร (Metadata)</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">เรื่อง/ชื่อเอกสาร</label>
            <input required type="text" name="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700">ประเภทเอกสาร</label>
            <input type="text" name="documentType" value={formData.documentType} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700">เลขที่อ้างอิง</label>
            <input type="text" name="referenceNumber" value={formData.referenceNumber} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">ปี (พ.ศ.)</label>
            <input type="number" name="year" value={formData.year} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">ประเภทคดี</label>
            <input type="text" name="caseType" value={formData.caseType} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">หมวดหมู่กฎหมาย</label>
            <input type="text" name="legalCategory" value={formData.legalCategory} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">ประเด็นกฎหมาย (คั่นด้วยลูกน้ำ)</label>
            <input type="text" name="issueTags" value={formData.issueTags} onChange={handleChange} placeholder="เช่น วินัยร้ายแรง, ละทิ้งหน้าที่" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">ชื่อกฎหมาย (คั่นด้วยลูกน้ำ)</label>
            <input type="text" name="lawNames" value={formData.lawNames} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">มาตรา (คั่นด้วยลูกน้ำ)</label>
            <input type="text" name="sectionNumbers" value={formData.sectionNumbers} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">ผลคำวินิจฉัย</label>
            <input type="text" name="decisionResult" value={formData.decisionResult} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">สถานะเอกสาร</label>
            <select name="sourceStatus" value={formData.sourceStatus} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border">
              <option value="ใช้งาน">ใช้งาน</option>
              <option value="รอทบทวน">รอทบทวน</option>
              <option value="ยกเลิก">ยกเลิก</option>
              <option value="ซ้ำ">ซ้ำ</option>
              <option value="ร่าง">ร่าง</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">ระดับความน่าเชื่อถือ</label>
            <select name="reliabilityLevel" value={formData.reliabilityLevel} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border">
              <option value="official">Official</option>
              <option value="internal">Internal</option>
              <option value="draft">Draft</option>
              <option value="reference only">Reference Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">วันที่มีผลบังคับใช้</label>
            <input type="date" name="effectiveDate" value={formData.effectiveDate} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">วันที่หมดอายุ</label>
            <input type="date" name="expiredDate" value={formData.expiredDate} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">URL ไฟล์ต้นฉบับ</label>
            <input type="text" name="sourceFileUrl" value={formData.sourceFileUrl} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm p-2 border" />
          </div>

          <div className="sm:col-span-2 flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-slate-700 hover:bg-slate-50">ยกเลิก</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
