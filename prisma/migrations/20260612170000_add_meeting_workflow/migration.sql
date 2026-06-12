-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meetingNo" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "meetingType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "chairName" TEXT,
    "secretaryName" TEXT,
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAgendaItem" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "agendaNo" INTEGER NOT NULL,
    "agendaType" TEXT,
    "proposedAction" TEXT,
    "readinessStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewStatus" TEXT,
    "boardResult" TEXT,
    "boardNote" TEXT,
    "postMeetingAction" TEXT,
    "assignedFollowUpUserId" TEXT,
    "followUpDueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingAgendaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAttendee" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT,
    "attendeeName" TEXT NOT NULL,
    "role" TEXT,
    "attendanceStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingAttendee_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAgendaItem" ADD CONSTRAINT "MeetingAgendaItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAgendaItem" ADD CONSTRAINT "MeetingAgendaItem_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAgendaItem" ADD CONSTRAINT "MeetingAgendaItem_assignedFollowUpUserId_fkey" FOREIGN KEY ("assignedFollowUpUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
