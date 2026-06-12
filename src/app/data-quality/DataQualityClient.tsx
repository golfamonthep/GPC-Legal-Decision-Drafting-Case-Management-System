'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DataQualityIssue } from '@/lib/dataQuality/types';

export default function DataQualityClient() {
  const [issues, setIssues] = useState<DataQualityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedIssue, setSelectedIssue] = useState<DataQualityIssue | null>(null);
  const [quickFixValue, setQuickFixValue] = useState('');
  const [fixing, setFixing] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/data-quality/issues');
      if (!res.ok) throw new Error('ไม่สามารถโหลดรายการปัญหาคุณภาพข้อมูลได้');
      const data = await res.json();
      setIssues(data.issues || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleExport = () => {
    window.location.href = '/api/data-quality/export';
  };

  const handleQuickFix = async () => {
    if (!selectedIssue || !selectedIssue.fieldName) return;
    try {
      setFixing(true);
      setFixError(null);
      const res = await fetch(`/api/data-quality/cases/${selectedIssue.caseId}/quick-fix`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: selectedIssue.fieldName,
          value: quickFixValue
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'ไม่สามารถแก้ไขข้อมูลได้');
      }
      setSelectedIssue(null);
      setQuickFixValue('');
      await fetchIssues();
    } catch (err: any) {
      setFixError(err.message);
    } finally {
      setFixing(false);
    }
  };

  const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
  const highCount = issues.filter(i => i.severity === 'HIGH').length;
  const mediumCount = issues.filter(i => i.severity === 'MEDIUM').length;

  if (loading) return <div>กำลังโหลด...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">จำนวนปัญหาทั้งหมด</div>
          <div className="text-3xl font-bold">{issues.length}</div>
        </div>
        <div className="bg-red-50 p-6 rounded-lg shadow-sm border border-red-200">
          <div className="text-sm text-red-700 mb-1">Critical</div>
          <div className="text-3xl font-bold text-red-700">{criticalCount}</div>
        </div>
        <div className="bg-orange-50 p-6 rounded-lg shadow-sm border border-orange-200">
          <div className="text-sm text-orange-700 mb-1">High</div>
          <div className="text-3xl font-bold text-orange-700">{highCount}</div>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg shadow-sm border border-yellow-200">
          <div className="text-sm text-yellow-700 mb-1">Medium</div>
          <div className="text-3xl font-bold text-yellow-700">{mediumCount}</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">รายการปัญหา</h2>
        <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
          ส่งออกรายงาน (CSV)
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ความรุนแรง</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หัวข้อปัญหา</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เรื่องดำ</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {issues.map(issue => (
              <tr key={issue.id}>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    issue.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    issue.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    issue.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {issue.severity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{issue.title}</div>
                  <div className="text-xs text-gray-500">{issue.description}</div>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/cases/${issue.caseId}`} className="text-blue-600 hover:underline">
                    {issue.caseBlackNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{issue.category}</td>
                <td className="px-4 py-3">
                  {issue.fieldName && (
                    <button 
                      onClick={() => { setSelectedIssue(issue); setQuickFixValue(issue.currentValue || ''); }}
                      className="text-indigo-600 hover:text-indigo-900 text-xs mr-2"
                    >
                      แก้ไขด่วน
                    </button>
                  )}
                  <Link href={`/cases/${issue.caseId}`} className="text-gray-600 hover:text-gray-900 text-xs">
                    เปิดสำนวน
                  </Link>
                </td>
              </tr>
            ))}
            {issues.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  ไม่พบปัญหาคุณภาพข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">แก้ไขข้อมูลด่วน</h3>
            <div className="mb-4 text-sm text-gray-600">
              <p><strong>ปัญหา:</strong> {selectedIssue.title}</p>
              <p><strong>สำนวน:</strong> {selectedIssue.caseBlackNumber}</p>
              <p><strong>ฟิลด์ที่ต้องการแก้ไข:</strong> {selectedIssue.fieldName}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">ค่าใหม่</label>
              {selectedIssue.fieldName === 'receivedDate' ? (
                <input 
                  type="date" 
                  value={quickFixValue} 
                  onChange={e => setQuickFixValue(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                />
              ) : (
                <input 
                  type="text" 
                  value={quickFixValue} 
                  onChange={e => setQuickFixValue(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                />
              )}
            </div>

            {fixError && <div className="text-red-600 text-sm mb-4">{fixError}</div>}

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setSelectedIssue(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleQuickFix}
                disabled={fixing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-blue-300"
              >
                {fixing ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
