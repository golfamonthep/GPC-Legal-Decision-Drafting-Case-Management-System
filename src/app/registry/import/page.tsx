'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Settings, CheckSquare } from 'lucide-react';
import ExcelUploader from '@/components/ImportExcel/ExcelUploader';
import ColumnMapper, { ColumnMapping } from '@/components/ImportExcel/ColumnMapper';
import PreviewTable from '@/components/ImportExcel/PreviewTable';

export default function ImportRegistryPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [rowData, setRowData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);

  const handleDataLoaded = (headers: string[], data: any[]) => {
    setExcelHeaders(headers);
    setRowData(data);
    setStep(2);
  };

  const handleMappingComplete = (newMapping: ColumnMapping) => {
    setMapping(newMapping);
    setStep(3);
  };

  const resetToUpload = () => {
    setExcelHeaders([]);
    setRowData([]);
    setMapping(null);
    setStep(1);
  };

  const handleConfirmImport = () => {
    // Placeholder for actual import logic
    alert('ระบบจำลองการนำเข้าข้อมูลสำเร็จแล้ว (ยังไม่ได้บันทึกลงฐานข้อมูลจริง)');
    resetToUpload();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link 
          href="/registry" 
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-thai">นำเข้าข้อมูลสารบบคดี (Import)</h1>
          <p className="mt-1 text-sm text-slate-500">
            นำเข้าข้อมูลจากไฟล์ Excel (.xlsx, .xlsm) เข้าสู่ระบบ
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-100 -z-10"></div>
          
          <div className="flex flex-col items-center bg-white px-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-300 bg-slate-50 text-slate-400'}`}>
              <Upload className="h-5 w-5" />
            </div>
            <span className={`text-xs mt-2 font-medium font-thai ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>อัปโหลดไฟล์</span>
          </div>

          <div className="flex flex-col items-center bg-white px-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-300 bg-slate-50 text-slate-400'}`}>
              <Settings className="h-5 w-5" />
            </div>
            <span className={`text-xs mt-2 font-medium font-thai ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>จับคู่คอลัมน์</span>
          </div>

          <div className="flex flex-col items-center bg-white px-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-300 bg-slate-50 text-slate-400'}`}>
              <CheckSquare className="h-5 w-5" />
            </div>
            <span className={`text-xs mt-2 font-medium font-thai ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>ตรวจสอบความถูกต้อง</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {step === 1 && (
          <div className="max-w-2xl mx-auto mt-10">
            <ExcelUploader onDataLoaded={handleDataLoaded} />
          </div>
        )}

        {step === 2 && (
          <ColumnMapper 
            excelHeaders={excelHeaders} 
            onMappingComplete={handleMappingComplete} 
            onCancel={resetToUpload} 
          />
        )}

        {step === 3 && mapping && (
          <div className="h-[600px]">
            <PreviewTable 
              rowData={rowData} 
              mapping={mapping} 
              onCancel={() => setStep(2)} 
              onConfirmImport={handleConfirmImport}
            />
          </div>
        )}
      </div>
    </div>
  );
}
