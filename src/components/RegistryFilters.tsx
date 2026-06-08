'use client';

import React, { useState, useEffect } from 'react';
import { Search, Download, Upload, Filter } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface RegistryFiltersProps {
  initialSearchTerm: string;
  caseType: string;
  status: string;
  commissioner: string;
  legalOfficer: string;
  year: string;
  nearDeadline: boolean;
  overdue: boolean;
  commissionerOptions: string[];
  legalOfficerOptions: string[];
}

export default function RegistryFilters({
  initialSearchTerm,
  caseType,
  status,
  commissioner,
  legalOfficer,
  year,
  nearDeadline,
  overdue,
  commissionerOptions,
  legalOfficerOptions
}: RegistryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  // Debounce search term changes
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== initialSearchTerm) {
        updateFilter('search', searchTerm);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, initialSearchTerm]);

  const updateFilter = (key: string, value: string | boolean) => {
    const params = new URLSearchParams(searchParams);
    
    // Reset to page 1 when filtering
    params.set('page', '1');

    if (value === 'all' || value === false || value === '') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 space-y-4">
      {/* Top row: Search and Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            placeholder="ค้นหาชื่อผู้ร้อง, เลขคดี, หรือเรื่อง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => router.push('/registry/import')}
            className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Upload className="h-4 w-4 mr-2" />
            นำเข้า (Import)
          </button>
          <button
            onClick={() => alert('ส่งออกข้อมูลเป็น Excel (Placeholder)')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            ส่งออก (Export)
          </button>
        </div>
      </div>

      {/* Bottom row: Filters */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
        <div className="flex items-center text-slate-500 mr-2">
          <Filter className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">ตัวกรอง:</span>
        </div>
        
        <select
          value={caseType}
          onChange={(e) => updateFilter('caseType', e.target.value)}
          className="block w-full sm:w-auto pl-3 pr-8 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">ทุกประเภทเรื่อง</option>
          <option value="ร้องทุกข์">ร้องทุกข์</option>
          <option value="อุทธรณ์">อุทธรณ์</option>
        </select>

        <select
          value={status}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="block w-full sm:w-auto pl-3 pr-8 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">ทุกสถานะ</option>
          <option value="รอดำเนินการ">รอดำเนินการ</option>
          <option value="อยู่ระหว่างพิจารณา">อยู่ระหว่างพิจารณา</option>
          <option value="รอพิจารณาคำวินิจฉัย">รอพิจารณาคำวินิจฉัย</option>
          <option value="วินิจฉัยแล้ว">วินิจฉัยแล้ว</option>
          <option value="จำหน่ายคดี">จำหน่ายคดี</option>
        </select>

        <select
          value={year}
          onChange={(e) => updateFilter('year', e.target.value)}
          className="block w-full sm:w-auto pl-3 pr-8 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">ทุกปี</option>
          <option value="2569">2569</option>
          <option value="2568">2568</option>
        </select>

        <select
          value={commissioner}
          onChange={(e) => updateFilter('commissioner', e.target.value)}
          className="block w-full sm:w-auto pl-3 pr-8 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">กรรมการฯ ทุกท่าน</option>
          {commissionerOptions.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={legalOfficer}
          onChange={(e) => updateFilter('legalOfficer', e.target.value)}
          className="block w-full sm:w-auto pl-3 pr-8 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">นิติกรทุกคน</option>
          {legalOfficerOptions.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <div className="flex items-center space-x-4 ml-auto">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={nearDeadline}
              onChange={(e) => updateFilter('nearDeadline', e.target.checked)}
            />
            <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            <span className="ms-2 text-sm font-medium text-slate-700">ใกล้ครบกำหนด</span>
          </label>
          
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={overdue}
              onChange={(e) => updateFilter('overdue', e.target.checked)}
            />
            <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
            <span className="ms-2 text-sm font-medium text-slate-700">เกินกำหนด</span>
          </label>
        </div>
      </div>
    </div>
  );
}
