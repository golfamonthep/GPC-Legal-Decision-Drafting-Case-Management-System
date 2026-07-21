export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import prisma from '@/lib/db';
import { requirePermission } from '@/lib/auth/requirePermission';
import { hasPermission } from '@/lib/auth/permissions';
import { StatusBadge } from '@/components/StatusBadge';
import { CaseStatusUpdateForm } from '@/components/CaseStatusUpdateForm';

export default async function UpdateCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission('VIEW_CASE_DETAIL');
  const { id } = await params;

  const caseData = await prisma.case.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      blackNumber: true,
      redNumber: true,
      subject: true,
      petitionerName: true,
      respondentName: true,
      currentStatus: true,
      proceedingNote: true,
      legalOfficerName: true,
      updatedAt: true,
      legalOfficer: { select: { name: true } },
    },
  });

  if (!caseData) notFound();

  const canEdit = hasPermission(user.role, 'EDIT_CASE');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/cases/${caseData.id}`}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้ารายละเอียดคดี
          </Link>
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">อัปเดตการดำเนินการ</h1>
                <StatusBadge status={caseData.currentStatus} />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {caseData.type} · เรื่องดำ {caseData.blackNumber}
                {caseData.redNumber ? ` · เรื่องแดง ${caseData.redNumber}` : ''}
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          กลับ Dashboard
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">เรื่อง</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">{caseData.subject}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">ผู้ร้อง/ผู้อุทธรณ์</dt>
            <dd className="mt-1 text-sm text-slate-800">{caseData.petitionerName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">คู่กรณี</dt>
            <dd className="mt-1 text-sm text-slate-800">{caseData.respondentName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">นิติกร</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {caseData.legalOfficer?.name || caseData.legalOfficerName || 'ยังไม่ระบุ'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">แก้ไขข้อมูลล่าสุด</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {caseData.updatedAt.toLocaleString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </dd>
          </div>
        </dl>
      </div>

      <CaseStatusUpdateForm
        caseId={caseData.id}
        currentStatus={caseData.currentStatus}
        currentProceedingNote={caseData.proceedingNote}
        canEdit={canEdit}
      />
    </div>
  );
}
