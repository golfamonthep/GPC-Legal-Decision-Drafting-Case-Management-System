import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateDraft } from "./actions";
import { requirePermission } from "@/lib/auth/requirePermission";
import { DraftEditor } from "./DraftEditor";
import { parseFinalizationData } from "@/lib/finalization/caseFinalization";
import { PostMeetingFollowupStatus } from "@/lib/finalization/postMeetingFollowupStatus";
import { AlertTriangle, CheckCircle } from "lucide-react";
import fs from "fs/promises";
import path from "path";

export default async function DraftWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission("VIEW_DRAFT");
  const resolvedParams = await params;
  const caseId = resolvedParams.id;
  
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      agendaItems: {
        include: { meeting: true },
        where: { meeting: { status: { in: ['DRAFT', 'SCHEDULED', 'AGENDA_LOCKED'] } } },
        orderBy: { meeting: { meetingDate: 'asc' } }
      }
    }
  });

  if (!caseData) {
    notFound();
  }

  const finalizationData = parseFinalizationData(caseData.proceedingNote);
  const draftData = await getOrCreateDraft(caseId);

  let templateExists = false;
  try {
    const templatePath = path.join(process.cwd(), "templates", "docx", "gpc-decision-template.docx");
    await fs.access(templatePath);
    templateExists = true;
  } catch (err) {
    templateExists = false;
  }

  const upcomingMeeting = caseData.agendaItems?.[0];

  return (
    <div className="flex flex-col h-full">
      {finalizationData?.revisionRequired && !finalizationData.revisionCompletedAt && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 mx-8 mt-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">สำนวนนี้อยู่ระหว่างการแก้ไขร่างตามมติที่ประชุม</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p><strong>คำสั่งแก้ไข:</strong> {finalizationData.revisionInstruction || "ไม่มีรายละเอียด"}</p>
                <p className="mt-2 text-xs">คุณสามารถกลับไปที่หน้า <strong>รายการคดี &gt; งานหลังประชุม</strong> เพื่อบันทึกว่าแก้ไขเสร็จสิ้นแล้ว</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {finalizationData?.status === PostMeetingFollowupStatus.FINALIZED && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4 mx-8 mt-4 rounded-r-md">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-sm font-medium text-green-800">สำนวนนี้ถูกจัดทำเป็นฉบับสมบูรณ์แล้ว ไม่ควรแก้ไขร่างอีก</span>
          </div>
        </div>
      )}

      {upcomingMeeting && !finalizationData?.revisionRequired && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 mx-8 mt-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong className="font-medium text-yellow-800">แจ้งเตือน:</strong> สำนวนนี้อยู่ในวาระการประชุม {upcomingMeeting.meeting.title} ครั้งที่ {upcomingMeeting.meeting.meetingNo} วันที่ {new Date(upcomingMeeting.meeting.meetingDate).toLocaleDateString('th-TH')} 
                โปรดตรวจสอบความสมบูรณ์ของร่างคำวินิจฉัยให้เรียบร้อย
              </p>
            </div>
          </div>
        </div>
      )}
      <DraftEditor caseData={caseData} draftData={draftData} templateExists={templateExists} />
    </div>
  );
}
