'use client';

import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { ColumnMapping } from './ColumnMapper';
import { parseThaiDate } from '@/lib/dateUtils';

interface PreviewTableProps {
  rowData: any[];
  mapping: ColumnMapping;
  onCancel: () => void;
  onConfirmImport: (validRows: ProcessedRow[]) => void;
}

export interface ProcessedRow {
  index: number;
  data: Record<string, any>;
  status: 'valid' | 'warning' | 'error';
  messages: string[];
}

export default function PreviewTable({ rowData, mapping, onCancel, onConfirmImport }: PreviewTableProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'warning' | 'error'>('all');

  const processedData = useMemo(() => {
    const results: ProcessedRow[] = [];
    const blackCases = new Set<string>();
    const redCases = new Set<string>();

    rowData.forEach((row, idx) => {
      // Map data based on mapping
      const mappedData: Record<string, any> = {};
      Object.keys(mapping).forEach((key) => {
        const excelHeader = mapping[key as keyof ColumnMapping];
        mappedData[key] = excelHeader ? row[excelHeader] : '';
      });

      const messages: string[] = [];
      let status: 'valid' | 'warning' | 'error' = 'valid';

      // 1. Minimum import rule
      const meaningfulFields = ['blackCaseNo', 'redCaseNo', 'complainantName', 'subject', 'accusedName', 'proceedingNote'];
      const hasMeaningful = meaningfulFields.some(k => mappedData[k] && String(mappedData[k]).trim() !== '');
      if (!hasMeaningful) {
        status = 'error';
        messages.push(`ไม่พบข้อมูลสาระสำคัญในแถวนี้ (ต้องมีอย่างน้อยหนึ่งช่อง: เรื่องดำ, เรื่องแดง, ผู้ร้องทุกข์, เรื่อง, คู่กรณี, หรือการดำเนินการ)`);
      }

      // 1.5 Warnings for important blank fields
      const importantBlankWarnings = [
        { key: 'redCaseNo', label: 'เรื่องแดง' },
        { key: 'receivedDate', label: 'วันที่รับเรื่อง' },
        { key: 'status', label: 'สถานะ' },
        { key: 'legalOfficer', label: 'นิติกร' },
        { key: 'accusedName', label: 'คู่กรณีในการร้องทุกข์' },
        { key: 'proceedingNote', label: 'การดำเนินการ' },
        { key: 'decisionResult', label: 'ผลคำวินิจฉัย' },
        { key: 'meetingDate', label: 'นัดประชุม' },
        { key: 'deadline30', label: 'ครบ 30 วัน' },
        { key: 'deadline60', label: 'ครบ 60 วัน' },
        { key: 'oneDriveUrl', label: 'OneDrive link' },
        { key: 'note', label: 'หมายเหตุ' },
      ];
      
      const blankLabels: string[] = [];
      importantBlankWarnings.forEach(f => {
        if (!mappedData[f.key] || String(mappedData[f.key]).trim() === '') {
          blankLabels.push(f.label);
        }
      });
      
      if (blankLabels.length > 0) {
        if (status !== 'error') status = 'warning';
        messages.push(`ช่องข้อมูลเสริมที่เว้นว่าง: ${blankLabels.join(', ')}`);
      }

      // 2. Duplicate Black Case No (within this file)
      const blackNo = mappedData['blackCaseNo'];
      if (blackNo && String(blackNo).trim() !== '') {
        if (blackCases.has(blackNo)) {
          status = 'error';
          messages.push(`หมายเลขคดีดำซ้ำในไฟล์นี้: ${blackNo}`);
        } else {
          blackCases.add(blackNo);
        }
      }

      // 3. Duplicate Red Case No (within this file)
      const redNo = mappedData['redCaseNo'];
      if (redNo && String(redNo).trim() !== '') {
        if (redCases.has(redNo)) {
          status = 'error';
          messages.push(`หมายเลขคดีแดงซ้ำในไฟล์นี้: ${redNo}`);
        } else {
          redCases.add(redNo);
        }
      }

      // 4. Invalid Dates
      const dateKeys = ['receivedDate', 'deadline30', 'deadline60', 'deadline90', 'deadline120', 'deadline240', 'meetingDate'];
      dateKeys.forEach(dk => {
        const dVal = mappedData[dk];
        if (dVal && String(dVal).trim() !== '') {
          if (String(dVal).includes('#VALUE!')) {
            if (status !== 'error') status = 'warning';
            messages.push(`ไม่สามารถอ่านวันที่จากค่าใน Excel ได้ ระบบจะเว้นค่านี้ไว้ (${dk})`);
            mappedData[dk] = '';
          } else {
            const parsed = parseThaiDate(dVal);
            if (!parsed) {
              if (status !== 'error') status = 'warning';
              messages.push(`รูปแบบวันที่ไม่ถูกต้อง ระบบจะเว้นค่านี้ไว้ (${dk}): ${dVal}`);
              mappedData[dk] = ''; // Store empty so it doesn't break import
            }
          }
        }
      });

      // Status checks (Warning if not a standard status)
      const knownStatuses = [
        'อยู่ระหว่างดำเนินการ', 
        'อยู่ระหว่างพิจารณา', 
        'รอดำเนินการ', 
        'เสร็จสิ้น', 
        'แล้วเสร็จ', 
        'ยุติเรื่อง', 
        'จำหน่ายเรื่อง'
      ];
      if (mappedData['status'] && String(mappedData['status']).trim() !== '' && !knownStatuses.includes(String(mappedData['status']).trim())) {
        if (status !== 'error') status = 'warning';
        messages.push(`สถานะไม่ตรงกับระบบ: ${mappedData['status']} (หากเว้นว่างจะกำหนดเป็น อยู่ระหว่างดำเนินการ)`);
      }

      results.push({
        index: idx + 1,
        data: mappedData,
        status,
        messages
      });
    });

    return results;
  }, [rowData, mapping]);

  const stats = useMemo(() => {
    return {
      total: processedData.length,
      valid: processedData.filter(r => r.status === 'valid').length,
      warning: processedData.filter(r => r.status === 'warning').length,
      error: processedData.filter(r => r.status === 'error').length,
    };
  }, [processedData]);

  const filteredData = useMemo(() => {
    if (filterStatus === 'all') return processedData;
    return processedData.filter(r => r.status === filterStatus);
  }, [processedData, filterStatus]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium text-slate-800 font-thai">ตรวจสอบข้อมูล (Preview)</h3>
          <p className="text-sm text-slate-500 mt-1">
            แถวที่มีคำเตือนยังสามารถนำเข้าได้ ระบบจะไม่นำเข้าเฉพาะแถวที่ไม่ผ่านเท่านั้น
          </p>
        </div>
        
        <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
          <button 
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md ${filterStatus === 'all' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            ทั้งหมด ({stats.total})
          </button>
          <button 
            onClick={() => setFilterStatus('valid')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center ${filterStatus === 'valid' ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> ผ่าน ({stats.valid})
          </button>
          <button 
            onClick={() => setFilterStatus('warning')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center ${filterStatus === 'warning' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1" /> เตือน ({stats.warning})
          </button>
          <button 
            onClick={() => setFilterStatus('error')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center ${filterStatus === 'error' ? 'bg-red-50 text-red-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <AlertCircle className="h-3.5 w-3.5 mr-1" /> ไม่ผ่าน ({stats.error})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">สถานะ</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">แถวที่</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/5">เรื่องดำ/แดง</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/5">เรื่อง/นิติกร</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/5">คู่กรณี/การดำเนินการ</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">รายละเอียดเพิ่มเติม</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                  <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p>ไม่พบข้อมูลตามตัวกรองที่เลือก</p>
                </td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr key={row.index} className={row.status === 'error' ? 'bg-red-50/30' : row.status === 'warning' ? 'bg-amber-50/30' : 'hover:bg-slate-50'}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.status === 'valid' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> ผ่าน</span>}
                    {row.status === 'warning' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><AlertTriangle className="w-3 h-3 mr-1" /> นำเข้าได้ แต่มีคำเตือน</span>}
                    {row.status === 'error' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" /> ไม่นำเข้า</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                    {row.index}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    <div className="font-medium">{row.data.blackCaseNo || '-'}</div>
                    <div className="text-xs text-slate-500">{row.data.redCaseNo || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    <div className="line-clamp-2" title={row.data.subject}>{row.data.subject || '-'}</div>
                    <div className="text-xs text-slate-500 mt-1">{row.data.caseType || '-'}</div>
                    <div className="text-xs text-slate-500 mt-1 truncate" title={row.data.legalOfficer}>นิติกร: {row.data.legalOfficer || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900 max-w-xs">
                    <div className="font-medium truncate" title={row.data.accusedName}>คู่กรณี: {row.data.accusedName || '-'}</div>
                    {row.data.proceedingNote && (
                      <div className="text-xs text-slate-500 mt-1 truncate" title={row.data.proceedingNote}>
                        ดำเนินการ: {row.data.proceedingNote}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {row.messages.length > 0 ? (
                      <ul className="list-disc pl-4 space-y-1">
                        {row.messages.map((msg, i) => (
                          <li key={i} className={row.status === 'error' ? 'text-red-600' : 'text-amber-600'}>{msg}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-green-600 flex items-center">
                        ข้อมูลครบถ้วน
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 whitespace-nowrap"
        >
          กลับไปตั้งค่าใหม่
        </button>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="text-sm font-thai text-right">
            <p>ระบบจะนำเข้าแถวที่ผ่านและแถวที่มีคำเตือน รวม <span className="font-semibold">{stats.valid + stats.warning}</span> แถว</p>
            {stats.error > 0 && <p className="text-red-600">มีแถวที่ไม่ผ่านจำนวน {stats.error} แถว ระบบจะข้ามแถวเหล่านี้</p>}
          </div>
          <button
            onClick={() => onConfirmImport(processedData.filter(r => r.status !== 'error'))}
            disabled={stats.total === 0 || stats.valid + stats.warning === 0}
            className={`px-5 py-2 rounded-lg text-sm font-medium text-white flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap ${
              stats.valid + stats.warning > 0 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-sm' 
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            ยืนยันนำเข้าแถวที่ผ่านและแถวที่มีคำเตือน
          </button>
        </div>
      </div>
    </div>
  );
}
