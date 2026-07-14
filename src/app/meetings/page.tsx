export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { hasPermission } from "@/lib/auth/permissions";
import { Calendar, Plus, Users, Clock } from "lucide-react";
import prisma from "@/lib/db";
import Link from "next/link";

export default async function MeetingsListPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, 'VIEW_MEETINGS')) {
    redirect("/dashboard");
  }

  const meetings = await prisma.meeting.findMany({
    orderBy: { meetingDate: 'desc' },
    include: {
      _count: {
        select: { agendaItems: true }
      }
    }
  });

  const canManage = hasPermission(user.role, 'MANAGE_MEETINGS');

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold leading-6 text-slate-900 flex items-center">
            <Calendar className="mr-3 h-6 w-6 text-blue-500" />
            วาระการประชุม
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            จัดการและตรวจสอบวาระการประชุมคณะกรรมการ
          </p>
        </div>
        {canManage && (
          <div className="mt-4 sm:mt-0">
            <Link
              href="/meetings/new"
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Plus className="-ml-0.5 mr-1.5 h-5 w-5" />
              สร้างการประชุมใหม่
            </Link>
          </div>
        )}
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-lg overflow-hidden">
        <ul role="list" className="divide-y divide-slate-200">
          {meetings.length === 0 ? (
            <li className="p-8 text-center text-slate-500">ไม่มีการประชุมที่กำหนดไว้</li>
          ) : (
            meetings.map((meeting) => (
              <li key={meeting.id} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-slate-50 sm:px-6">
                <div className="flex min-w-0 gap-x-4">
                  <div className="min-w-0 flex-auto">
                    <p className="text-sm font-semibold leading-6 text-slate-900">
                      <Link href={`/meetings/${meeting.id}`}>
                        <span className="absolute inset-x-0 -top-px bottom-0" />
                        {meeting.title} ครั้งที่ {meeting.meetingNo}
                      </Link>
                    </p>
                    <div className="mt-1 flex text-xs leading-5 text-slate-500 gap-4">
                      <span className="flex items-center"><Clock className="mr-1 h-3 w-3" /> {meeting.meetingDate.toLocaleDateString('th-TH')}</span>
                      {meeting.startTime && <span className="flex items-center">{meeting.startTime} - {meeting.endTime || '?'}</span>}
                      <span className="flex items-center"><Users className="mr-1 h-3 w-3" /> {meeting._count?.agendaItems || 0} วาระ</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-x-4">
                  <div className="hidden sm:flex sm:flex-col sm:items-end">
                    <p className="text-sm leading-6 text-slate-900">{meeting.status}</p>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
