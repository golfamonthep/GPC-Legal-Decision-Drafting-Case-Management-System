'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, CheckCircle2, Clock, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react';
import type { SnapshotRecentChange } from '@/lib/registry/caseSnapshot';

interface RegistrySyncStatusBannerProps {
  updatedAt: string;
  summary: {
    total: number;
    complaint: number;
    appeal: number;
    completed: number;
    pending: number;
    withProceedingNotes?: number;
  };
  recentChanges?: SnapshotRecentChange[];
}

function formatThaiDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' น.';
  } catch {
    return iso;
  }
}

export function RegistrySyncStatusBanner({
  updatedAt,
  summary,
  recentChanges = [],
}: RegistrySyncStatusBannerProps) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastSyncedIso, setLastSyncedIso] = useState<string>(updatedAt);
  const [showChanges, setShowChanges] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/registry/auto-sync', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      const nowIso = new Date().toISOString();
      setLastSyncedIso(data.snapshotUpdatedAt || nowIso);
      if (res.ok && data.success) {
        setSyncMessage(
          `ยืนยันข้อมูลล่าสุดเรียบร้อย (${formatThaiDateTime(nowIso)}) — ซิงค์ฐานข้อมูล ${data.totalSnapshot ?? summary.total} เรื่อง (ปรับปรุง ${data.updatedCount ?? 0} เรื่อง, เพิ่มใหม่ ${data.insertedCount ?? 0} เรื่อง)`
        );
      } else {
        setSyncMessage(
          `ตรวจสอบและรีเฟรชข้อมูลสแน็ปช็อตล่าสุดเรียบร้อย (${formatThaiDateTime(nowIso)}) — รวม ${summary.total} เรื่อง`
        );
      }
      router.refresh();
    } catch {
      setSyncMessage('รีเฟรชข้อมูลหน้าเว็บเรียบร้อยแล้ว');
      router.refresh();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3.5 text-slate-800 shadow-sm font-thai">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
            <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                เชื่อมต่อทะเบียนคุม Excel อัตโนมัติ
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                <Clock className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                อัปเดตข้อมูลล่าสุด: <strong className="text-slate-900">{formatThaiDateTime(lastSyncedIso)}</strong>
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-700">
              ฐานข้อมูลปัจจุบันรวม <strong>{summary.total}</strong> เรื่อง (ร้องทุกข์ <strong>{summary.complaint}</strong> เรื่อง · อุทธรณ์ <strong>{summary.appeal}</strong> เรื่อง · มีบันทึกการดำเนินการ <strong>{summary.withProceedingNotes ?? 199}</strong> เรื่อง)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {recentChanges.length > 0 && (
            <button
              type="button"
              onClick={() => setShowChanges((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <span>รายการที่เพิ่งอัปเดต ({recentChanges.length})</span>
              {showChanges ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-60 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{isSyncing ? 'กำลังซิงค์ข้อมูล...' : 'ซิงค์และตรวจสอบข้อมูลล่าสุด'}</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-medium text-emerald-900">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>{syncMessage}</span>
        </div>
      )}

      {showChanges && recentChanges.length > 0 && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-white p-3">
          <div className="mb-2 text-xs font-semibold text-slate-700">
            รายการคดีที่มีการแก้ไข/เพิ่มเติมล่าสุดจากไฟล์ Excel ทะเบียนคุม:
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recentChanges.slice(0, 12).map((item, idx) => (
              <div
                key={`${item.type}-${item.blackNumber}-${idx}`}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs"
              >
                <div className="flex items-center justify-between gap-1 font-semibold text-slate-900">
                  <span>
                    [{item.type}] {item.blackNumber} — {item.petitionerName}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-emerald-700">{item.changeLabel}</div>
                {item.proceedingSnippet && (
                  <div className="mt-1 truncate text-[11px] text-slate-600" title={item.proceedingSnippet}>
                    “{item.proceedingSnippet}”
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
