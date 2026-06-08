'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export interface ColumnMapping {
  seq: string;
  caseType: string;
  blackCaseNo: string;
  redCaseNo: string;
  complainantName: string;
  accusedName: string;
  subject: string;
  receivedDate: string;
  commissioner: string;
  legalOfficer: string;
  status: string;
  deadline30: string;
  deadline60: string;
  deadline90: string;
  deadline120: string;
  deadline240: string;
  meetingDate: string;
  decisionResult: string;
}

interface ColumnMapperProps {
  excelHeaders: string[];
  onMappingComplete: (mapping: ColumnMapping) => void;
  onCancel: () => void;
}

const REQUIRED_FIELDS = [
  { key: 'caseType', label: 'ประเภทเรื่อง (ร้องทุกข์/อุทธรณ์)' },
  { key: 'blackCaseNo', label: 'เรื่องดำ' },
  { key: 'complainantName', label: 'ชื่อผู้ร้องทุกข์/ผู้อุทธรณ์' },
  { key: 'subject', label: 'เรื่อง' },
  { key: 'receivedDate', label: 'วันที่รับเรื่อง' },
  { key: 'status', label: 'สถานะ' },
];

const OPTIONAL_FIELDS = [
  { key: 'seq', label: 'ลำดับ' },
  { key: 'redCaseNo', label: 'เรื่องแดง' },
  { key: 'accusedName', label: 'คู่กรณี' },
  { key: 'commissioner', label: 'กรรมการเจ้าของสำนวน' },
  { key: 'legalOfficer', label: 'นิติกร' },
  { key: 'deadline30', label: 'วันครบกำหนด 30 วัน' },
  { key: 'deadline60', label: 'วันครบกำหนด 60 วัน' },
  { key: 'deadline90', label: 'วันครบกำหนด 90 วัน' },
  { key: 'deadline120', label: 'วันครบกำหนด 120 วัน' },
  { key: 'deadline240', label: 'วันครบกำหนด 240 วัน' },
  { key: 'meetingDate', label: 'วันประชุม' },
  { key: 'decisionResult', label: 'ผลคำวินิจฉัย' },
];

export default function ColumnMapper({ excelHeaders, onMappingComplete, onCancel }: ColumnMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Auto-map based on exact or partial matches
  useEffect(() => {
    const initialMapping: Record<string, string> = {};
    const allFields = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

    allFields.forEach(field => {
      // Find a header that exactly matches or contains the label
      const matchedHeader = excelHeaders.find(h => 
        h === field.label || h.includes(field.label) || field.label.includes(h)
      );
      if (matchedHeader) {
        initialMapping[field.key] = matchedHeader;
      } else {
        initialMapping[field.key] = '';
      }
    });

    setMapping(initialMapping);
  }, [excelHeaders]);

  const handleSelectChange = (fieldKey: string, header: string) => {
    setMapping(prev => ({
      ...prev,
      [fieldKey]: header
    }));
  };

  const isMappingValid = () => {
    // Check if all required fields are mapped
    return REQUIRED_FIELDS.every(field => mapping[field.key] && mapping[field.key] !== '');
  };

  const handleConfirm = () => {
    if (isMappingValid()) {
      onMappingComplete(mapping as unknown as ColumnMapping);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-slate-800 font-thai">จับคู่คอลัมน์ (Column Mapping)</h3>
          <p className="text-sm text-slate-500 mt-1">โปรดจับคู่หัวข้อจากไฟล์ Excel ให้ตรงกับระบบ</p>
        </div>
        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium flex items-center">
          พบ {excelHeaders.length} คอลัมน์
        </div>
      </div>

      <div className="p-6">
        {!isMappingValid() && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start text-amber-800">
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium">โปรดจับคู่คอลัมน์ที่จำเป็นให้ครบถ้วน</h4>
              <p className="text-sm mt-1">คอลัมน์ที่มีเครื่องหมาย * จำเป็นต้องระบุเพื่อการนำเข้าข้อมูลที่สมบูรณ์</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Required Fields */}
          <div>
            <h4 className="font-medium text-slate-700 mb-4 flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
              ข้อมูลที่จำเป็นต้องมี
            </h4>
            <div className="space-y-4">
              {REQUIRED_FIELDS.map(field => (
                <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-sm font-medium text-slate-700 w-1/2">
                    {field.label} <span className="text-red-500">*</span>
                  </div>
                  <div className="w-full sm:w-1/2">
                    <select
                      className={`block w-full pl-3 pr-8 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !mapping[field.key] ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                      }`}
                      value={mapping[field.key] || ''}
                      onChange={(e) => handleSelectChange(field.key, e.target.value)}
                    >
                      <option value="">-- ไม่ได้จับคู่ --</option>
                      {excelHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Fields */}
          <div>
            <h4 className="font-medium text-slate-700 mb-4 flex items-center">
              <span className="w-2 h-2 rounded-full bg-slate-400 mr-2"></span>
              ข้อมูลอื่นๆ (ถ้ามี)
            </h4>
            <div className="space-y-4 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {OPTIONAL_FIELDS.map(field => (
                <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-sm font-medium text-slate-700 w-1/2">
                    {field.label}
                  </div>
                  <div className="w-full sm:w-1/2">
                    <select
                      className="block w-full pl-3 pr-8 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={mapping[field.key] || ''}
                      onChange={(e) => handleSelectChange(field.key, e.target.value)}
                    >
                      <option value="">-- ไม่ได้จับคู่ --</option>
                      {excelHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isMappingValid()}
            className={`px-5 py-2 rounded-lg text-sm font-medium text-white flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isMappingValid() 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-sm' 
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            ยืนยันการจับคู่คอลัมน์
          </button>
        </div>
      </div>
    </div>
  );
}
