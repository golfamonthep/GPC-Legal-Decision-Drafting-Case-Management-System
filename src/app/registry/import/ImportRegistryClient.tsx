'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Settings, CheckSquare, AlertCircle } from 'lucide-react';
import ExcelUploader from '@/components/ImportExcel/ExcelUploader';
import ColumnMapper, { ColumnMapping } from '@/components/ImportExcel/ColumnMapper';
import PreviewTable, { ProcessedRow } from '@/components/ImportExcel/PreviewTable';

export type FixedCaseType = 'ร้องทุกข์' | 'อุทธรณ์';

interface ImportRegistryClientProps {
  fixedCaseType?: FixedCaseType;
}

export function ImportRegistryClient({ fixedCaseType }: ImportRegistryClientProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [rowData, setRowData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedRows?: number;
    insertedRows?: number;
    updatedRows?: number;
    skippedErrorRows?: number;
    skippedDuplicateRows?: number;
    skippedConflictRows?: number;
    failedRows?: number;
    messages?: string[];
    errorMsg?: string;
  } | null>(null);

  const handleDataLoaded = (headers: string[], data: any[]) => {
    if (fixedCaseType) {
      const syntheticHeader = 'ประเภทเรื่อง';
      const normalizedHeaders = headers.includes(syntheticHeader)
        ? headers
        : [syntheticHeader, ...headers];
      const normalizedRows = data.map((row) => ({
        ...row,
        [syntheticHeader]: fixedCaseType,
      }));

      setExcelHeaders(normalizedHeaders);
      setRowData(normalizedRows);
    } else {
      setExcelHeaders(headers);
      setRowData(data);
    }
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
    setImportResult(null);
    setStep(1);
  };

  const handleConfirmImport = async (validRows: ProcessedRow[]) => {
    setIsImporting(true);
    try {
      const response = await fetch('/api/registry/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validRows }),
      });
      const data = await response.json();

      if (!response.ok) {
        setImportResult({
          success: false,
          errorMsg: data.message || data.error || 'นำเข้าข้อมูลไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่',
          messages: Array.isArray(data.details) ? data.details : undefined,
        });
      } else {
        setImportResult({
          success: true,
          importedRows: data.importedRows,
          insertedRows: data.insertedRows,
          updatedRows: data.updatedRows,
          skippedErrorRows: data.skippedErrorRows,
          skippedDuplicateRows: data.skippedDuplicateRows,
          skippedConflictRows: data.skippedConflictRows,
          failedRows: data.failedRows,
          messages: data.messages,
        });
      }
    } catch (error) {
      console.error(error);
      setImportResult({
        success: false,
        errorMsg: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาลองใหม่',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const registerTitle = fixedCaseType === 'อุทธรณ์'
    ? 'นำเข้าทะเบียนคุมเรื่องอุทธรณ์'
    : fixedCaseType === 'ร้องทุกข์'
      ? 'นำเข้าทะเบียนคุมเรื่องร้องทุกข์'
      : 'นำเข้าข้อมูลสารบบคดี';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/upload"
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-thai">{registerTitle}</h1>
          <p className="mt-1 text-sm text-slate-500">
            นำเข้าข้อมูลจากไฟล์ Excel (.xlsx, .xlsm) เข้าสู่ระบบ
          </p>
          {fixedCaseType && (
            <div className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
              ระบบจะกำหนดทุกแถวเป็น “{fixedCaseType}” โดยอัตโนมัติ
            </div>
          )}
          <div className="mt-2 text-sm text-amber-800 bg-amber-50 p-3 rounded border border-amber-200 inline-block font-thai">
            <strong>ไฟล์ที่อัปโหลดถือเป็นทะเบียนล่าสุด:</strong> รายการหมายเลขดำเดิมจะได้รับการอัปเดตตามไฟล์ และรายการที่ยังไม่มีจะถูกเพิ่มใหม่<br />
            ระบบจะไม่ลบรายการอัตโนมัติ แถวที่มีคำเตือนยังนำเข้าได้ ส่วนแถวที่ไม่ผ่านหรือหมายเลขซ้ำภายในไฟล์จะถูกข้าม
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-100 -z-10" />

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
                {importResult.success ? 'ซิงก์ข้อมูลทะเบียนเสร็จสิ้น' : 'เกิดข้อผิดพลาด'}
              </h2>

              {importResult.success ? (
                <div className="text-slate-600 mb-6 font-thai space-y-1">
                  <p className="text-lg">ประมวลผลสำเร็จ <span className="font-bold text-green-600">{importResult.importedRows ?? 0}</span> แถว</p>
                  <p>เพิ่มรายการใหม่ <span className="font-bold text-blue-600">{importResult.insertedRows ?? 0}</span> แถว</p>
                  <p>อัปเดตรายการเดิม <span className="font-bold text-violet-600">{importResult.updatedRows ?? 0}</span> แถว</p>
                  <p>ข้ามแถวที่ไม่ผ่าน <span className="font-bold text-slate-800">{importResult.skippedErrorRows ?? 0}</span> แถว</p>
                  <p>ข้ามข้อมูลซ้ำในไฟล์ <span className="font-bold text-amber-600">{importResult.skippedDuplicateRows ?? 0}</span> แถว</p>
                  {(importResult.skippedConflictRows ?? 0) > 0 && <p className="text-red-600">ข้ามรายการที่ขัดแย้งกับเลขแดง <span className="font-bold">{importResult.skippedConflictRows}</span> แถว</p>}
                  {(importResult.failedRows ?? 0) > 0 && <p className="text-red-600">ซิงก์ล้มเหลว <span className="font-bold">{importResult.failedRows}</span> แถว</p>}
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
                    {importResult.messages.map((message, index) => (
                      <li key={`${index}-${message}`}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  type="button"
                  onClick={resetToUpload}
                  className="px-6 py-2 bg-white text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm border border-slate-300 font-thai"
                >
                  {importResult.success ? 'ซิงก์ไฟล์ใหม่' : 'ลองใหม่อีกครั้ง'}
                </button>
                {importResult.success && fixedCaseType && (
                  <Link
                    href={`/cases?type=${encodeURIComponent(fixedCaseType)}`}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm font-thai"
                  >
                    ดูรายการ{fixedCaseType}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && mapping && !importResult && (
          <div className="h-[600px] relative">
            <PreviewTable
              rowData={rowData}
              mapping={mapping}
              onCancel={() => setStep(2)}
              onConfirmImport={handleConfirmImport}
            />
            {isImporting && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-50">
                <div className="bg-white p-4 rounded-lg shadow-lg text-center border border-slate-200">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700 font-thai">กำลังซิงก์ข้อมูลจากทะเบียนล่าสุด...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
