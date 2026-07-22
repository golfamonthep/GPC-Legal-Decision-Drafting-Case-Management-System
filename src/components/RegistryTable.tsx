'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Prisma } from '@/generated/prisma';

type CaseWithRelations = Prisma.CaseGetPayload<{
  include: { owner: true; legalOfficer: true }
}>;

interface RegistryTableProps {
  data: CaseWithRelations[];
  metadata: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

function renderSortIcon(column: string, currentSortBy: string, currentSortOrder: string) {
  if (currentSortBy !== column) return null;
  return currentSortOrder === 'asc'
    ? <ChevronUp className="inline h-4 w-4" />
    : <ChevronDown className="inline h-4 w-4" />;
}

function getDeadlineStyle(date: Date | null) {
  if (!date) return '';
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'text-red-600 font-semibold bg-red-50';
  if (diffDays <= 7) return 'text-amber-600 font-semibold bg-amber-50';
  return 'text-slate-700';
}

function formatDate(date: Date | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function RegistryTable({ data, metadata }: RegistryTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSortBy = searchParams.get('sortBy') || 'receivedDate';
  const currentSortOrder = searchParams.get('sortOrder') || 'desc';

  const handleSort = (column: string) => {
    const params = new URLSearchParams(searchParams);
    if (currentSortBy === column) {
      params.set('sortOrder', currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sortBy', column);
      params.set('sortOrder', 'asc');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="min-w-max w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap">ลำดับ</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap">ประเภทเรื่อง</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap cursor-pointer hover:bg-slate-100" onClick={() => handleSort('blackNumber')}>
                เรื่องดำ {renderSortIcon('blackNumber', currentSortBy, currentSortOrder)}
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap">เรื่องแดง</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap">ชื่อผู้ร้องทุกข์/ผู้อุทธรณ์</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 min-w-[200px]">คู่กรณี</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 min-w-[250px]">เรื่อง</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap cursor-pointer hover:bg-slate-100" onClick={() => handleSort('receivedDate')}>
                วันที่รับเรื่อง {renderSortIcon('receivedDate', currentSortBy, currentSortOrder)}
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap cursor-pointer hover:bg-slate-100" onClick={() => handleSort('commissioner')}>
                กรรมการเจ้าของสำนวน {renderSortIcon('commissioner', currentSortBy, currentSortOrder)}
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap">นิติกร</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap cursor-pointer hover:bg-slate-100" onClick={() => handleSort('status')}>
                สถานะ {renderSortIcon('status', currentSortBy, currentSortOrder)}
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap cursor-pointer hover:bg-slate-100" onClick={() => handleSort('dueDate30')}>
                ครบ 30 วัน {renderSortIcon('dueDate30', currentSortBy, currentSortOrder)}
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap">ครบ 60 วัน</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap">ครบ 90 วัน</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap">ครบ 120 วัน</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap">ครบ 240 วัน</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap">วันประชุม</th>
              <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 whitespace-nowrap">ผลคำวินิจฉัย</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={18} className="px-6 py-12 text-center text-slate-500">
                  ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const order = (metadata.page - 1) * metadata.pageSize + index + 1;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{order}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.type === 'ร้องทุกข์' ? 'bg-indigo-100 text-indigo-800' : 'bg-fuchsia-100 text-fuchsia-800'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">{item.blackNumber}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-red-600">{item.redNumber || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">{item.petitionerName}</td>
                    <td className="px-4 py-3 text-slate-700 line-clamp-2">{item.respondentName}</td>
                    <td className="px-4 py-3 text-slate-700">{item.subject}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(item.receivedDate)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">{item.owner?.name || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">{item.legalOfficer?.name || item.legalOfficerName || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        item.currentStatus === 'รอดำเนินการ' ? 'bg-slate-100 text-slate-800' :
                        item.currentStatus === 'อยู่ระหว่างพิจารณา' ? 'bg-blue-100 text-blue-800' :
                        item.currentStatus === 'รอพิจารณาคำวินิจฉัย' ? 'bg-purple-100 text-purple-800' :
                        item.currentStatus === 'วินิจฉัยแล้ว' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.currentStatus}
                      </span>
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap ${getDeadlineStyle(item.dueDate30)}`}>{formatDate(item.dueDate30)}</td>
                    <td className={`px-4 py-3 whitespace-nowrap ${getDeadlineStyle(item.dueDate60)}`}>{formatDate(item.dueDate60)}</td>
                    <td className={`px-4 py-3 whitespace-nowrap ${getDeadlineStyle(item.dueDate90)}`}>{formatDate(item.dueDate90)}</td>
                    <td className={`px-4 py-3 whitespace-nowrap ${getDeadlineStyle(item.dueDate120)}`}>{formatDate(item.dueDate120)}</td>
                    <td className={`px-4 py-3 whitespace-nowrap ${getDeadlineStyle(item.dueDate240)}`}>{formatDate(item.dueDate240)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(item.meetingDate)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-medium">{item.decisionResult || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6 mt-auto">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-700">
              แสดง <span className="font-medium">{(metadata.page - 1) * metadata.pageSize + 1}</span> ถึง <span className="font-medium">{Math.min(metadata.page * metadata.pageSize, metadata.total)}</span> จาก <span className="font-medium">{metadata.total}</span> รายการ
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(Math.max(1, metadata.page - 1))}
                disabled={metadata.page === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>

              <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">
                หน้า {metadata.page} / {metadata.totalPages || 1}
              </span>

              <button
                onClick={() => handlePageChange(Math.min(metadata.totalPages, metadata.page + 1))}
                disabled={metadata.page >= metadata.totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
