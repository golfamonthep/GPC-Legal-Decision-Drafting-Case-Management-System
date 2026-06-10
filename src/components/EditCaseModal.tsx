"use client";

import { useState, useTransition } from "react";
import { Case } from "@/types";
import { updateCase } from "@/app/actions/caseActions";
import { X } from "lucide-react";
import { format } from "date-fns";

interface EditCaseModalProps {
  caseData: Case | any; // Using any as a fallback for prisma generated types if Case is not perfectly aligned
  onClose: () => void;
}

export function EditCaseModal({ caseData, onClose }: EditCaseModalProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    type: caseData.type || "",
    blackNumber: caseData.blackNumber || "",
    redNumber: caseData.redNumber || "",
    petitionerName: caseData.petitionerName || "",
    respondentName: caseData.respondentName || "",
    subject: caseData.subject || "",
    legalCategory: caseData.legalCategory || "",
    receivedDate: caseData.receivedDate ? format(new Date(caseData.receivedDate), 'yyyy-MM-dd') : "",
    meetingDate: caseData.meetingDate ? format(new Date(caseData.meetingDate), 'yyyy-MM-dd') : "",
    currentStatus: caseData.currentStatus || "",
    legalOfficerName: caseData.legalOfficerName || "",
    decisionResult: caseData.decisionResult || "",
    proceedingNote: caseData.proceedingNote || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("การแก้ไขข้อมูลนี้จะถูกบันทึกประวัติในระบบตรวจสอบย้อนหลัง คุณต้องการบันทึกการเปลี่ยนแปลงหรือไม่?")) {
      return;
    }

    startTransition(async () => {
      try {
        await updateCase(caseData.id, formData);
        onClose();
      } catch (error) {
        console.error("Failed to update case", error);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 sm:p-0 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mt-10 mb-10 sm:mt-0 sm:mb-0">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white rounded-t-lg">
          <h3 className="text-lg font-semibold text-slate-900">แก้ไขข้อมูลคดี</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  <strong>คำเตือน:</strong> การแก้ไขข้อมูลนี้จะถูกบันทึกประวัติในระบบตรวจสอบย้อนหลัง
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  การระบุเลขเรื่องแดงใช้เพื่อช่วยคำนวณสถานะการดำเนินงาน แต่จะไม่เปลี่ยนสถานะโดยอัตโนมัติ
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">หมายเลขคดีดำ <span className="text-red-500">*</span></label>
              <input required type="text" name="blackNumber" value={formData.blackNumber} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">หมายเลขคดีแดง</label>
              <input type="text" name="redNumber" value={formData.redNumber} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700">ประเภทคดี <span className="text-red-500">*</span></label>
              <select required name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border">
                <option value="ร้องทุกข์">ร้องทุกข์</option>
                <option value="อุทธรณ์">อุทธรณ์</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">หมวดหมู่กฎหมาย</label>
              <input type="text" name="legalCategory" value={formData.legalCategory} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">เรื่อง <span className="text-red-500">*</span></label>
              <input required type="text" name="subject" value={formData.subject} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">ผู้ร้องทุกข์ / ผู้อุทธรณ์ <span className="text-red-500">*</span></label>
              <input required type="text" name="petitionerName" value={formData.petitionerName} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">ผู้ถูกร้อง / คู่กรณีในการร้องทุกข์/อุทธรณ์ <span className="text-red-500">*</span></label>
              <input required type="text" name="respondentName" value={formData.respondentName} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">วันที่รับเรื่อง</label>
              <input type="date" name="receivedDate" value={formData.receivedDate} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">วันนัดพิจารณา (วันประชุม)</label>
              <input type="date" name="meetingDate" value={formData.meetingDate} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">นิติกรผู้รับผิดชอบ</label>
              <input type="text" name="legalOfficerName" value={formData.legalOfficerName} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">สถานะ <span className="text-red-500">*</span></label>
              <input required type="text" name="currentStatus" value={formData.currentStatus} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">ผลคำวินิจฉัย</label>
              <input type="text" name="decisionResult" value={formData.decisionResult} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">การดำเนินการ (Proceeding Note)</label>
              <textarea name="proceedingNote" rows={4} value={formData.proceedingNote} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border" />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-x-6 border-t border-slate-200 pt-4">
            <button type="button" onClick={onClose} className="text-sm font-semibold leading-6 text-slate-900">
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-blue-300"
            >
              {isPending ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
