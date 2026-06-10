"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function CaseListFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (name: string, value: string) => {
    router.push(`?${createQueryString(name, value)}`);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 border border-slate-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div>
          <label className="block text-xs font-medium text-slate-700">ประเภทคดี</label>
          <select 
            className="mt-1 block w-full rounded-md border-slate-300 py-1.5 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 border"
            value={searchParams.get("type") || ""}
            onChange={(e) => handleFilterChange("type", e.target.value)}
          >
            <option value="">ทั้งหมด</option>
            <option value="ร้องทุกข์">ร้องทุกข์</option>
            <option value="อุทธรณ์">อุทธรณ์</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700">สถานะ</label>
          <select 
            className="mt-1 block w-full rounded-md border-slate-300 py-1.5 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 border"
            value={searchParams.get("completionStatus") || ""}
            onChange={(e) => handleFilterChange("completionStatus", e.target.value)}
          >
            <option value="">ทั้งหมด</option>
            <option value="open">กำลังดำเนินการ</option>
            <option value="completed">เสร็จสิ้นแล้ว</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700">เลขเรื่องแดง</label>
          <select 
            className="mt-1 block w-full rounded-md border-slate-300 py-1.5 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 border"
            value={searchParams.get("redNumberStatus") || ""}
            onChange={(e) => handleFilterChange("redNumberStatus", e.target.value)}
          >
            <option value="">ทั้งหมด</option>
            <option value="hasRed">มีเลขแดงแล้ว</option>
            <option value="noRed">ยังไม่มีเลขแดง</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700">คุณภาพข้อมูล (QA)</label>
          <select 
            className="mt-1 block w-full rounded-md border-slate-300 py-1.5 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 border"
            value={searchParams.get("qaMissingFields") || ""}
            onChange={(e) => handleFilterChange("qaMissingFields", e.target.value)}
          >
            <option value="">ทั้งหมด</option>
            <option value="missing">พบข้อมูลไม่ครบถ้วน</option>
          </select>
        </div>

        {/* Legal officer and other specific status filters could be added here. 
            For simplicity, using text input for legal officer. */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-slate-700">ค้นหานิติกร</label>
          <input 
            type="text" 
            placeholder="ชื่อนิติกร..."
            className="mt-1 block w-full rounded-md border-slate-300 py-1.5 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 border"
            value={searchParams.get("legalOfficer") || ""}
            onChange={(e) => handleFilterChange("legalOfficer", e.target.value)}
          />
        </div>

      </div>
    </div>
  );
}
