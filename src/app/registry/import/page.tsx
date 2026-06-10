'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Settings, CheckSquare, AlertCircle } from 'lucide-react';
import ExcelUploader from '@/components/ImportExcel/ExcelUploader';
import ColumnMapper, { ColumnMapping } from '@/components/ImportExcel/ColumnMapper';
import PreviewTable, { ProcessedRow } from '@/components/ImportExcel/PreviewTable';

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

  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedRows?: number;
    skippedErrorRows?: number;
    skippedDuplicateRows?: number;
    failedRows?: number;
    messages?: string[];
    errorMsg?: string;
  } | null>(null);

  const handleConfirmImport = async (validRows: ProcessedRow[]) => {
    setIsImporting(true);
    try {
      const response = await fetch('/api/registry/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validRows })
      });
      const data = await response.json();
      
      if (!response.ok) {
        setImportResult({
          success: false,
          errorMsg: 'นำเข้าข้อมูลไม่สำเร็จ เนื่องจากระบบใช้เวลานานเกินกำหนด กรุณาลองใหม่ หรือแบ่งนำเข้าเป็นชุด'
        });
      } else {
        setImportResult({
          success: true,
          importedRows: data.importedRows,
          skippedErrorRows: data.skippedErrorRows,
          skippedDuplicateRows: data.skippedDuplicateRows,
          failedRows: data.failedRows,
          messages: data.messages
        });
      }
    } catch (error) {
      console.error(error);
      setImportResult({
        success: false,
        errorMsg: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาลองใหม่'
      });
    } finally {
      setIsImporting(false);
    }
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
          <div className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 inline-block font-thai">
            กรุณาตรวจสอบข้อมูลตัวอย่างก่อนยืนยันการนำเข้า ระบบจะไม่ลบหรือเขียนทับข้อมูลเดิม<br/>
            บางช่องในทะเบียนคุมอาจเว้นว่างได้ ระบบจะแจ้งเป็นคำเตือนและยังสามารถนำเข้าได้ หากข้อมูลหลักของแถวนั้นเพียงพอ
          </div>
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

        {importResult && (
          <div className="max-w-2xl mx-auto mt-10 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="text-center">
              {importResult.success ? (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="h-8 w-8 text-green-600" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              )}
              
              <h2 className="text-2xl font-bold font-thai text-slate-800 mb-2">
                {importResult.success ? 'นำเข้าข้อมูลเสร็จสิ้น' : 'เกิดข้อผิดพลาด'}
              </h2>
              
              {importResult.success ? (
                <div className="text-slate-600 mb-6 font-thai">
                  <p className="text-lg">นำเข้าสำเร็จ <span className="font-bold text-green-600">{importResult.importedRows}</span> แถว</p>
                  <p>ข้ามแถวที่ไม่ผ่าน <span className="font-bold text-slate-800">{importResult.skippedErrorRows}</span> แถว</p>
                  <p>ข้ามข้อมูลซ้ำ <span className="font-bold text-amber-600">{importResult.skippedDuplicateRows}</span> แถว</p>
                  {importResult.failedRows && importResult.failedRows > 0 ? <p className="text-red-600">นำเข้าล้มเหลว <span className="font-bold">{importResult.failedRows}</span> แถว</p> : null}
                </div>
              ) : (
                <div className="text-slate-600 mb-6 font-thai text-lg">
                  <p className="text-red-600">{importResult.errorMsg}</p>
                </div>
              )}

              {importResult.messages && importResult.messages.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-4 text-left border border-slate-200 h-48 overflow-y-auto mb-6">
                  <h4 className="font-medium font-thai text-slate-700 mb-2">รายละเอียด:</h4>
                  <ul className="text-sm text-slate-600 font-thai list-disc pl-5 space-y-1">
                    {importResult.messages.map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => {
                  setImportResult(null);
                  if (importResult.success) {
                    resetToUpload();
                  }
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm font-thai"
              >
                {importResult.success ? 'กลับไปหน้าอัปโหลด' : 'ลองใหม่อีกครั้ง'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && mapping && !importResult && (
          <div className="h-[600px]">
            <PreviewTable 
              rowData={rowData} 
              mapping={mapping} 
              onCancel={() => setStep(2)} 
              onConfirmImport={handleConfirmImport}
            />
            {isImporting && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
                <div className="bg-white p-4 rounded-lg shadow-lg text-center border border-slate-200">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm font-medium text-slate-700 font-thai">กำลังนำเข้าข้อมูล...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
