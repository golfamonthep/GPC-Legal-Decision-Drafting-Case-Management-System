'use client';

import React, { useState, useEffect } from 'react';
import { User, Users, Edit, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CaseAssignmentPanel({ caseId, currentLegalOfficer, currentCommitteeOwner, canAssign }: { caseId: string, currentLegalOfficer: string, currentCommitteeOwner: string, canAssign: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'LEGAL_OFFICER' | 'COMMITTEE_OWNER'>('LEGAL_OFFICER');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [reason, setReason] = useState('');
  const [assignableUsers, setAssignableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (isOpen && assignableUsers.length === 0) {
      fetch('/api/assignments')
        .then(res => res.json())
        .then(data => {
          if (data.assignableUsers) setAssignableUsers(data.assignableUsers);
        })
        .catch(err => console.error("Failed to load assignable users", err));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!reason.trim()) {
      setError('กรุณาระบุเหตุผลในการเปลี่ยนผู้รับผิดชอบ');
      setLoading(false);
      return;
    }

    try {
      const selectedUser = assignableUsers.find(u => u.id === userId);
      const nameToSubmit = selectedUser ? selectedUser.name : userName;

      const res = await fetch(`/api/cases/${caseId}/assignment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          userId: selectedUser ? selectedUser.id : `name_${nameToSubmit}`,
          userName: nameToSubmit,
          reason
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'ไม่สามารถบันทึกการมอบหมายได้');
      }

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg border border-slate-200 font-thai">
      <div className="px-4 py-5 sm:p-6 border-b border-slate-200 flex justify-between items-center">
        <h3 className="text-base font-semibold leading-6 text-slate-900">ผู้รับผิดชอบสำนวน</h3>
        {canAssign && (
          <button 
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            <Edit className="h-4 w-4 mr-1.5 text-slate-400" />
            เปลี่ยนผู้รับผิดชอบ
          </button>
        )}
      </div>
      <div className="px-4 py-5 sm:p-6 space-y-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="ml-4">
            <h4 className="text-sm font-medium text-slate-500">กรรมการเจ้าของสำนวน</h4>
            <p className="text-sm font-semibold text-slate-900 mt-1">{currentCommitteeOwner}</p>
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="ml-4">
            <h4 className="text-sm font-medium text-slate-500">นิติกร</h4>
            <p className="text-sm font-semibold text-slate-900 mt-1">{currentLegalOfficer}</p>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <Edit className="h-6 w-6 text-blue-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">มอบหมาย / เปลี่ยนผู้รับผิดชอบ</h3>
                  <div className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded flex items-start text-left">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>การเปลี่ยนผู้รับผิดชอบจะถูกบันทึกประวัติไว้ในระบบ และไม่ลบข้อมูลเดิม</span>
                  </div>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">ประเภท</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value as any)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="LEGAL_OFFICER">นิติกร</option>
                    <option value="COMMITTEE_OWNER">กรรมการเจ้าของสำนวน</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">เลือกจากผู้ใช้ในระบบ</label>
                  <select 
                    value={userId} 
                    onChange={(e) => {
                      setUserId(e.target.value);
                      if (e.target.value) setUserName('');
                    }}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">-- เลือกผู้ใช้งาน --</option>
                    {assignableUsers.filter(u => 
                      type === 'LEGAL_OFFICER' ? ['ADMIN', 'LEGAL_OFFICER'].includes(u.role) : ['ADMIN', 'COMMISSIONER'].includes(u.role)
                    ).map((user) => (
                      <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-300" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-2 text-sm text-slate-500">หรือ</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">ระบุชื่อเอง (ไม่มีในระบบ)</label>
                  <input 
                    type="text" 
                    value={userName} 
                    onChange={(e) => {
                      setUserName(e.target.value);
                      if (e.target.value) setUserId('');
                    }}
                    placeholder="เช่น ชื่อจากทะเบียน..."
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md py-2 px-3 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">เหตุผลในการมอบหมาย / เปลี่ยนแปลง <span className="text-red-500">*</span></label>
                  <textarea 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)}
                    required
                    rows={2}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md py-2 px-3 border"
                    placeholder="ระบุเหตุผล..."
                  />
                </div>
                
                {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
                
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    disabled={loading || (!userId && !userName) || !reason.trim()}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'กำลังบันทึก...' : 'บันทึกการมอบหมาย'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
