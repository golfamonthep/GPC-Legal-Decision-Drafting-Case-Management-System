import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { hasPermission } from "@/lib/auth/permissions";
import prisma from "@/lib/db";
import { Calendar, Clock, MapPin, Users, Info, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { MeetingAgendaPanel } from "./MeetingAgendaPanel"; // We'll create this next

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, 'VIEW_MEETINGS')) {
    redirect("/dashboard");
  }

  const resolvedParams = await params;
  const meeting = await prisma.meeting.findUnique({
    where: { id: resolvedParams.id },
    include: {
      agendaItems: {
        include: {
          case: {
            select: {
              id: true,
              blackNumber: true,
              redNumber: true,
              type: true,
              subject: true,
              petitionerName: true,
              currentStatus: true,
              legalOfficerName: true,
              committeeOwnerName: true,
            }
          }
        },
        orderBy: { agendaNo: 'asc' }
      }
    }
  });

  if (!meeting) {
    redirect("/meetings");
  }

  const canManage = hasPermission(user.role, 'MANAGE_MEETINGS');
  const canAddCase = hasPermission(user.role, 'ADD_CASE_TO_MEETING');
  const canRecordResult = hasPermission(user.role, 'RECORD_MEETING_RESULT');

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-4">
        <nav className="flex" aria-label="Breadcrumb">
          <ol role="list" className="flex items-center space-x-4">
            <li>
              <Link href="/meetings" className="text-slate-400 hover:text-slate-500">
                <Calendar className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="sr-only">วาระประชุม</span>
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="ml-4 text-sm font-medium text-slate-500">ครั้งที่ {meeting.meetingNo}</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="sm:flex sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold leading-6 text-slate-900">
            {meeting.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="flex items-center"><Calendar className="mr-1.5 h-4 w-4" /> วันที่: {meeting.meetingDate.toLocaleDateString('th-TH')}</span>
            <span className="flex items-center"><Clock className="mr-1.5 h-4 w-4" /> เวลา: {meeting.startTime || '-'} - {meeting.endTime || '-'}</span>
            <span className="flex items-center"><MapPin className="mr-1.5 h-4 w-4" /> สถานที่: {meeting.location || '-'}</span>
            <span className="flex items-center"><Users className="mr-1.5 h-4 w-4" /> ประธาน: {meeting.chairName || '-'}</span>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
           <div className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
             สถานะ: {meeting.status}
           </div>
           {canManage && (
             <button className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
               แก้ไขข้อมูลการประชุม
             </button>
           )}
        </div>
      </div>

      <div className="mt-8">
        <MeetingAgendaPanel 
           meeting={meeting} 
           canManage={canManage} 
           canAddCase={canAddCase} 
           canRecordResult={canRecordResult} 
        />
      </div>
    </div>
  );
}
