import { requirePermission } from '@/lib/auth/requirePermission';
import { CaseEditor, type CaseEditorValues } from '@/components/CaseEditor';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getHydratedSnapshotCases } from '@/lib/registry/caseSnapshot';
import { normalizeCaseNumber } from '@/lib/registryNumbers';
export const dynamic = 'force-dynamic';
export default async function EditCasePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('EDIT_CASE');
  const { id } = await params;
  let record: any = null;
  try {
    record = await prisma.case.findUnique({ where: { id }, select: { id: true, updatedAt: true, type: true, blackNumber: true, registryRedText: true, petitionerName: true, respondentName: true, subject: true, legalCategory: true, legalOfficerName: true, currentStatus: true, proceedingNote: true, decisionResult: true } });
  } catch (e) {
    console.warn("[EditCasePage] Database unavailable, falling back to snapshot:", e);
  }
  if (!record) {
    const snapCases = getHydratedSnapshotCases();
    record = snapCases.find((c: any) => c.id === id || c.blackNumber === id || normalizeCaseNumber(c.blackNumber) === normalizeCaseNumber(id)) || null;
  }
  if (!record) notFound();
  const initial: CaseEditorValues = { type: record.type, blackNumber: record.blackNumber, registryRedText: record.registryRedText || '', petitionerName: record.petitionerName, respondentName: record.respondentName, subject: record.subject, legalCategory: record.legalCategory, legalOfficerName: record.legalOfficerName || '', currentStatus: record.currentStatus, proceedingNote: record.proceedingNote || '', decisionResult: record.decisionResult || '' };
  return <div className="gpc-tabler mx-auto max-w-3xl px-4 py-6">
    <Link href="/cases" className="btn mb-4">กลับรายการคดี</Link>
    <h1 className="mb-2 text-2xl">แก้ไขข้อมูลคดี</h1>
    <p className="mb-4 text-secondary">{record.type} เรื่องดำ {record.blackNumber} · <strong>{record.petitionerName}</strong></p>
    <CaseEditor id={id} initial={initial} expectedUpdatedAt={record.updatedAt.toISOString()} />
  </div>;
}
