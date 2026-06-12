export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";
import { DocumentList } from "@/components/DocumentList";
import Link from "next/link";
import { PenTool, FolderSync } from "lucide-react";
import prisma from "@/lib/db";
import { requirePermission } from "@/lib/auth/requirePermission";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { auditLog } from "@/lib/audit";
import { CaseStatus } from "@/types";
import { CaseDetailActions } from "@/components/CaseDetailActions";
import { isClosedCaseStatus, hasRedCaseNumber } from "@/lib/caseStatus";
import { differenceInYears } from "date-fns";
import { checkGraphIntegrationStatus } from "@/lib/microsoft/graphConfig";
import { DocumentLinkModal } from "@/components/DocumentLinkModal";
import { CaseAssignmentPanel } from "@/components/CaseAssignmentPanel";
import { hasPermission } from "@/lib/auth/permissions";

function formatDate(date: Date | null | undefined): string {
  if (!date) return "-";
  return format(date, 'dd MMM yyyy', { locale: th });
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requirePermission("VIEW_CASE_DETAIL");
  const resolvedParams = await params;
  const caseId = resolvedParams.id;
  
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      owner: true,
      legalOfficer: true,
      documents: {
        orderBy: { uploadedAt: 'desc' }
      },
      events: {
        orderBy: { timestamp: 'desc' }
      },
      drafts: {
        include: {
          sections: true
        }
      },
      agendaItems: {
        include: {
          meeting: true
        },
        orderBy: { meeting: { meetingDate: 'desc' } }
      }
    }
  });

  if (!caseData) {
    notFound();
  }

  // Record case view audit log
  await auditLog({
    action: "VIEW_CASE",
    entityType: "Case",
    entityId: caseId,
  });

  // Fetch Audit Logs for this case and its related entities
  const relatedDraftSectionIds = caseData.drafts.flatMap(d => d.sections.map(s => s.id));
  const relatedDocumentIds = caseData.documents.map(d => d.id);

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityType: "Case", entityId: caseId },
        { entityType: "CaseDocument", entityId: { in: relatedDocumentIds } },
        { entityType: "DecisionDraftSection", entityId: { in: relatedDraftSectionIds } }
      ]
    },
    orderBy: { timestamp: 'desc' },
    include: { user: true }
  });

  const caseActivities = caseData.events.map((e) => ({
    id: e.id,
    caseId: caseId,
    action: e.action,
    actor: e.actorName,
    timestamp: format(e.timestamp, 'dd MMM yyyy HH:mm', { locale: th })
  }));

  const mockDocs = caseData.documents.map((d) => ({
    id: d.id,
    name: d.title,
    date: formatDate(d.uploadedAt),
    size: d.fileSize ? `${Math.round(d.fileSize / 1024)} KB` : "N/A",
    webUrl: d.webUrl || undefined,
    category: d.documentCategory || d.type,
    status: d.sourceStatus || undefined,
    provider: d.storageProvider || undefined
  }));

  const graphStatus = checkGraphIntegrationStatus();

  const isOverdue = false; // Logic for overdue could be added here if needed

  // Data QA Indicators Logic
  const qaWarnings: string[] = [];
  if (!caseData.petitionerName || caseData.petitionerName.trim() === '-' || caseData.petitionerName === '') {
    qaWarnings.push("ข้อมูลผู้ร้องทุกข์/ผู้อุทธรณ์ไม่ครบถ้วน");
  }
  if (!caseData.subject || caseData.subject.trim() === '-' || caseData.subject === '') {
    qaWarnings.push("ข้อมูลเรื่องไม่ครบถ้วน");
  }
  if (!caseData.legalOfficerId && (!caseData.legalOfficerName || caseData.legalOfficerName.trim() === '-' || caseData.legalOfficerName === '')) {
    qaWarnings.push("ยังไม่ได้ระบุนิติกรผู้รับผิดชอบ");
  }
  if (!caseData.currentStatus || caseData.currentStatus.trim() === '-' || caseData.currentStatus === '') {
    qaWarnings.push("ยังไม่ได้ระบุสถานะ");
  }
  if (!caseData.receivedDate) {
    qaWarnings.push("ไม่มีข้อมูลวันที่รับเรื่อง");
  }
  if (caseData.redNumber && hasRedCaseNumber(caseData.redNumber) && !isClosedCaseStatus(caseData.currentStatus)) {
    qaWarnings.push("คดีมีเลขแดงแล้ว แต่สถานะยังไม่ระบุว่าเสร็จสิ้น");
  }
  if (isClosedCaseStatus(caseData.currentStatus) && !hasRedCaseNumber(caseData.redNumber)) {
    qaWarnings.push("สถานะคดีเสร็จสิ้น แต่ยังไม่ได้ระบุเลขเรื่องแดง");
  }
  if (!isClosedCaseStatus(caseData.currentStatus) && caseData.receivedDate) {
    const yearsOpen = differenceInYears(new Date(), caseData.receivedDate);
    if (yearsOpen >= 3) {
      qaWarnings.push(`คดีล่าช้าเกิน 3 ปี (เปิดมาแล้ว ${yearsOpen} ปี)`);
    }
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center gap-4">
            เรื่อง: {caseData.subject}
            <StatusBadge status={caseData.currentStatus as CaseStatus} className="text-sm px-3 py-1" />
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6 text-sm text-slate-500">
            <div className="mt-2 flex items-center">
              หมายเลขคดีดำ: <span className="font-semibold text-slate-900 ml-1">{caseData.blackNumber}</span>
            </div>
            {caseData.redNumber && (
              <div className="mt-2 flex items-center text-red-600">
                หมายเลขคดีแดง: <span className="font-semibold ml-1">{caseData.redNumber}</span>
              </div>
            )}
            <div className="mt-2 flex items-center">
              ประเภท: <span className="font-semibold text-slate-900 ml-1">{caseData.type}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
          <CaseDetailActions caseData={caseData} />
          {caseData.oneDriveUrl && (
            <a
              href={caseData.oneDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            >
              <FolderSync className="-ml-0.5 mr-1.5 h-5 w-5 text-slate-400" aria-hidden="true" />
              เปิดแฟ้มคดี (OneDrive)
            </a>
          )}
          <Link
            href={`/cases/${caseId}/draft`}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PenTool className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            ร่างคำวินิจฉัย
          </Link>
        </div>
      </div>

      {qaWarnings.length > 0 && (
        <div className="mt-6 rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">พบข้อสังเกตด้านคุณภาพข้อมูล (Data QA) {qaWarnings.length} รายการ:</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul role="list" className="list-disc space-y-1 pl-5">
                  {qaWarnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow sm:rounded-lg border border-slate-200">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4">ข้อมูลพื้นฐาน</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">ผู้ร้อง / ผู้อุทธรณ์</dt>
                  <dd className="mt-1 text-sm text-slate-900">{caseData.petitionerName}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">ผู้ถูกร้อง / คู่กรณี</dt>
                  <dd className="mt-1 text-sm text-slate-900">{caseData.respondentName}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">หมวดหมู่กฎหมาย</dt>
                  <dd className="mt-1 text-sm text-slate-900">{caseData.legalCategory}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">วันที่รับเรื่อง</dt>
                  <dd className="mt-1 text-sm text-slate-900">{formatDate(caseData.receivedDate)}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">กรรมการเจ้าของสำนวน</dt>
                  <dd className="mt-1 text-sm text-slate-900">{caseData.owner?.name || "-"}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">นิติกรผู้รับผิดชอบ</dt>
                  <dd className="mt-1 text-sm text-slate-900">{caseData.legalOfficer?.name || caseData.legalOfficerName || "-"}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">วันนัดพิจารณา</dt>
                  <dd className="mt-1 text-sm text-slate-900">{formatDate(caseData.meetingDate)}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">ผลคำวินิจฉัย</dt>
                  <dd className="mt-1 text-sm text-slate-900">{caseData.decisionResult || "-"}</dd>
                </div>
                {caseData.proceedingNote && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-slate-500">การดำเนินการ (ล่าสุด)</dt>
                    <dd className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{caseData.proceedingNote}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <div className="bg-white shadow sm:rounded-lg border border-slate-200">
            <div className="px-4 py-5 sm:p-6 flex items-center justify-between border-b border-slate-200">
              <h3 className="text-base font-semibold leading-6 text-slate-900">เอกสารในสำนวน</h3>
              <DocumentLinkModal 
                caseId={caseId} 
                isGraphConfigured={graphStatus.isConfigured} 
                graphMessage={graphStatus.message} 
              />
            </div>
            <div className="px-4 py-5 sm:p-6">
              <DocumentList 
                caseId={caseData.id}
                documents={mockDocs} 
                canLink={user.role === 'ADMIN' || user.role === 'LEGAL_OFFICER' || user.role === 'REGISTRY_OFFICER'} 
              />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-medium leading-6 text-slate-900">ประวัติการพิจารณาในที่ประชุม</h3>
            <div className="bg-white shadow sm:rounded-lg">
              {caseData.agendaItems && caseData.agendaItems.length > 0 ? (
                <ul role="list" className="divide-y divide-slate-200">
                  {caseData.agendaItems.map((item: any) => (
                    <li key={item.id} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-slate-900">
                          {item.meeting.title} ครั้งที่ {item.meeting.meetingNo}
                        </h4>
                        <span className="text-sm text-slate-500">
                          {new Date(item.meeting.meetingDate).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 mb-2">วาระที่ {item.agendaNo}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-medium">สถานะความพร้อม:</span>
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          {item.readinessStatus}
                        </span>
                      </div>
                      {item.boardResult && (
                        <div className="mt-3 bg-blue-50 p-3 rounded-md text-sm border border-blue-100">
                          <span className="font-semibold text-blue-900">มติที่ประชุม: </span>
                          <span className="text-blue-800">{item.boardResult}</span>
                          {item.boardNote && (
                            <p className="mt-1 text-blue-700">{item.boardNote}</p>
                          )}
                        </div>
                      )}
                      {item.postMeetingAction && (
                        <div className="mt-2 text-sm text-slate-600">
                          <span className="font-medium">การดำเนินการหลังการประชุม: </span>
                          {item.postMeetingAction}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center text-sm text-slate-500">
                  ยังไม่มีประวัติการนำเสนอเข้าที่ประชุม
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Dates */}
        <div className="space-y-6">
          <CaseAssignmentPanel 
            caseId={caseId} 
            currentLegalOfficer={caseData.legalOfficer?.name || caseData.legalOfficerName || "-"} 
            currentCommitteeOwner={caseData.owner?.name || caseData.committeeOwnerName || "-"} 
            canAssign={hasPermission(user.role, 'ASSIGN_CASES') || hasPermission(user.role, 'REASSIGN_CASES') || user.role === 'ADMIN'}
          />

          <div className="bg-white shadow sm:rounded-lg border border-slate-200">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4">กรอบระยะเวลา (Due Dates)</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-500">ครบ 30 วัน:</span>
                  <span className="font-medium text-slate-900">{formatDate(caseData.dueDate30)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">ครบ 60 วัน:</span>
                  <span className="font-medium text-slate-900">{formatDate(caseData.dueDate60)}</span>
                </li>
                <li className="flex justify-between items-center bg-slate-50 -mx-4 px-4 py-2 border-y border-slate-100">
                  <span className="text-slate-900 font-semibold">ครบ 90 วัน (มาตรฐาน):</span>
                  <span className={`font-bold ${isOverdue ? 'text-red-600' : 'text-slate-900'}`}>{formatDate(caseData.dueDate90)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">ครบ 120 วัน (ขยาย):</span>
                  <span className="font-medium text-slate-900">{formatDate(caseData.dueDate120)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">ครบ 240 วัน (สูงสุด):</span>
                  <span className="font-medium text-slate-900">{formatDate(caseData.dueDate240)}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Status Update UI Placeholder */}
          <div className="bg-white shadow sm:rounded-lg border border-slate-200">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4">อัปเดตสถานะ (Update Status)</h3>
              <form className="space-y-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-slate-700">สถานะใหม่</label>
                  <select id="status" name="status" className="mt-1 block w-full rounded-md border-slate-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm">
                    <option>รับเรื่อง</option>
                    <option>แสวงหาข้อเท็จจริง</option>
                    <option>รอเข้าประชุม</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="note" className="block text-sm font-medium text-slate-700">บันทึกเพิ่มเติม</label>
                  <textarea id="note" name="note" rows={2} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="รายละเอียด..."></textarea>
                </div>
                <button type="button" className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                  บันทึกสถานะ
                </button>
              </form>
            </div>
          </div>

          <div className="bg-white shadow sm:rounded-lg border border-slate-200">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4">ความเคลื่อนไหวทางคดี</h3>
              <Timeline activities={caseActivities} />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Section */}
      <div className="mt-8">
        <div className="bg-white shadow sm:rounded-lg border border-slate-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4">ประวัติการทำงาน (Audit Logs)</h3>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-slate-300">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">ผู้ใช้งาน</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">การกระทำ (Action)</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">ประเภทเอนทิตี</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">เวลา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {auditLogs.length > 0 ? auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">
                        {log.user?.name || "System"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{log.action}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{log.entityType}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        {format(log.timestamp, 'dd MMM yyyy HH:mm', { locale: th })}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-sm text-slate-500">ไม่มีประวัติการทำงาน</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
