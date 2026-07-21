-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RecordLifecycleStatus" AS ENUM ('ACTIVE', 'FINALIZED', 'DISPATCHED', 'COURT_FOLLOWUP', 'READY_TO_ARCHIVE', 'ARCHIVED', 'RETENTION_REVIEW_REQUIRED', 'HOLD', 'REOPENED');

-- CreateEnum
CREATE TYPE "KnowledgeReuseStatus" AS ENUM ('NOT_REVIEWED', 'NOT_ELIGIBLE', 'PENDING_REVIEW', 'APPROVED_FOR_INTERNAL_SEARCH', 'APPROVED_FOR_RAG', 'INGESTED_TO_RAG', 'REVOKED', 'NEEDS_REDACTION', 'HOLD');

-- CreateEnum
CREATE TYPE "ExternalProvider" AS ENUM ('MICROSOFT_GRAPH');

-- CreateEnum
CREATE TYPE "ExternalSourceType" AS ENUM ('SHAREPOINT_SITE', 'ONEDRIVE_FOLDER');

-- CreateEnum
CREATE TYPE "ExternalDocumentSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "DocumentSyncRunStatus" AS ENUM ('STARTED', 'COMPLETED', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "DocumentSyncRunMode" AS ENUM ('MANUAL', 'SCHEDULED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "microsoftAccountId" TEXT,
    "image" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "blackNumber" TEXT NOT NULL,
    "redNumber" TEXT,
    "petitionerName" TEXT NOT NULL,
    "respondentName" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "legalCategory" TEXT NOT NULL,
    "ownerId" TEXT,
    "legalOfficerId" TEXT,
    "legalOfficerName" TEXT,
    "committeeOwnerName" TEXT,
    "assignedAt" TIMESTAMP(3),
    "assignmentUpdatedAt" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "dueDate30" TIMESTAMP(3),
    "dueDate60" TIMESTAMP(3),
    "dueDate90" TIMESTAMP(3),
    "dueDate120" TIMESTAMP(3),
    "dueDate240" TIMESTAMP(3),
    "currentStatus" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3),
    "decisionResult" TEXT,
    "oneDriveUrl" TEXT,
    "proceedingNote" TEXT,
    "dispatchData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseDocument" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storageProvider" TEXT,
    "driveId" TEXT,
    "driveItemId" TEXT,
    "webUrl" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "documentCategory" TEXT,
    "sourceStatus" TEXT,
    "uploadedByUserId" TEXT,
    "syncedAt" TIMESTAMP(3),
    "syncStatus" TEXT,
    "syncError" TEXT,

    CONSTRAINT "CaseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionDraft" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionDraftSection" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "sectionType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionDraftSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalSource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "date" TIMESTAMP(3),
    "url" TEXT,
    "year" INTEGER,
    "caseType" TEXT,
    "legalCategory" TEXT,
    "issueTags" TEXT[],
    "lawNames" TEXT[],
    "sectionNumbers" TEXT[],
    "decisionResult" TEXT,
    "sourceStatus" TEXT NOT NULL DEFAULT 'ใช้งาน',
    "reliabilityLevel" TEXT NOT NULL DEFAULT 'official',
    "effectiveDate" TIMESTAMP(3),
    "expiredDate" TIMESTAMP(3),
    "sourceFileUrl" TEXT,

    CONSTRAINT "LegalSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalClause" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "clauseNumber" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "LegalClause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiQueryLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "modelUsed" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiQueryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeValue" TEXT,
    "afterValue" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentIngestionJob" (
    "id" TEXT NOT NULL,
    "legalSourceId" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentIngestionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentChunk" (
    "id" TEXT NOT NULL,
    "legalSourceId" TEXT NOT NULL,
    "caseDocumentId" TEXT,
    "chunkIndex" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "normalizedContent" TEXT NOT NULL,
    "pageNumber" INTEGER,
    "sectionName" TEXT,
    "paragraphNumber" INTEGER,
    "sourceType" TEXT NOT NULL,
    "sourceStatus" TEXT NOT NULL,
    "reliabilityLevel" TEXT NOT NULL,
    "legalCategory" TEXT,
    "issueTags" TEXT[],
    "lawNames" TEXT[],
    "articleNumbers" TEXT[],
    "decisionResult" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "expiredDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "embeddingModel" TEXT,
    "embeddedAt" TIMESTAMP(3),
    "embeddingStatus" TEXT,
    "embeddingError" TEXT,
    "embedding" vector(1536),

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentChunkCitation" (
    "id" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentChunkCitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetrievalQuery" (
    "id" TEXT NOT NULL,
    "queryText" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetrievalQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetrievalResult" (
    "id" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "rank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetrievalResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalAnswer" (
    "id" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "modelUsed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalAnswerCitation" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalAnswerCitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftSectionAiLog" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "sectionType" TEXT NOT NULL,
    "userInstruction" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "generatedText" TEXT NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "userId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chunkIds" TEXT[],

    CONSTRAINT "DraftSectionAiLog_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "CaseArchiveRecord" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "lifecycleStatus" TEXT NOT NULL,
    "archiveStatus" TEXT NOT NULL,
    "archiveReason" TEXT,
    "archiveBoxNo" TEXT,
    "archiveLocation" TEXT,
    "digitalArchiveFolderUrl" TEXT,
    "finalRecordPackageDocumentId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "archivedByUserId" TEXT,
    "unarchivedAt" TIMESTAMP(3),
    "unarchivedByUserId" TEXT,
    "retentionPolicyId" TEXT,
    "retentionReviewDate" TIMESTAMP(3),
    "legalHold" BOOLEAN NOT NULL DEFAULT false,
    "legalHoldReason" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "previousStatusBeforeArchive" TEXT,
    "archiveBatchId" TEXT,
    "retentionStatus" TEXT,
    "retentionDueAt" TIMESTAMP(3),
    "retentionReviewedAt" TIMESTAMP(3),
    "retentionReviewedByUserId" TEXT,
    "retentionReviewNotes" TEXT,
    "legalHoldSetAt" TIMESTAMP(3),
    "legalHoldSetByUserId" TEXT,

    CONSTRAINT "CaseArchiveRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetentionPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "caseType" TEXT,
    "retentionPeriodYears" INTEGER,
    "reviewFrequencyMonths" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresManualReview" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeReuseReview" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "finalDecisionDocumentId" TEXT,
    "knowledgeReuseStatus" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "purpose" TEXT,
    "reviewNote" TEXT,
    "confidentialityLevel" TEXT NOT NULL DEFAULT 'INTERNAL',
    "containsPersonalData" BOOLEAN NOT NULL DEFAULT true,
    "requiresRedaction" BOOLEAN NOT NULL DEFAULT true,
    "redactionCompleted" BOOLEAN NOT NULL DEFAULT false,
    "approvedForInternalSearchAt" TIMESTAMP(3),
    "approvedForRagAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "rejectedByUserId" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "requestedByUserId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedByUserId" TEXT,
    "revokeReason" TEXT,
    "ingestionJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeReuseReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveBatch" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "policyReference" TEXT,
    "confirmationMarker" TEXT,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "eligibleCount" INTEGER NOT NULL DEFAULT 0,
    "blockedCount" INTEGER NOT NULL DEFAULT 0,
    "executedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ArchiveBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveBatchItem" (
    "id" TEXT NOT NULL,
    "archiveBatchId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "previousCaseStatus" TEXT,
    "previousArchiveStatus" TEXT,
    "blockedReasons" TEXT,
    "impactPreview" TEXT,
    "executedAt" TIMESTAMP(3),
    "resultMessage" TEXT,

    CONSTRAINT "ArchiveBatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalDocumentSource" (
    "id" TEXT NOT NULL,
    "provider" "ExternalProvider" NOT NULL,
    "sourceType" "ExternalSourceType" NOT NULL,
    "displayName" TEXT,
    "safeDescription" TEXT,
    "siteIdHash" TEXT,
    "driveIdHash" TEXT,
    "folderItemIdHash" TEXT,
    "rawIdsStored" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "lastCheckedAt" TIMESTAMP(3),

    CONSTRAINT "ExternalDocumentSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalDocumentItem" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "provider" "ExternalProvider" NOT NULL,
    "sourceType" "ExternalSourceType" NOT NULL,
    "externalItemKeyHash" TEXT NOT NULL,
    "externalETagHash" TEXT,
    "safeDisplayName" TEXT NOT NULL,
    "itemKind" TEXT,
    "extension" TEXT,
    "mimeType" TEXT,
    "sizeBytes" BIGINT,
    "createdAtExternal" TIMESTAMP(3),
    "lastModifiedAtExternal" TIMESTAMP(3),
    "hasWebUrl" BOOLEAN NOT NULL DEFAULT false,
    "webUrlStored" BOOLEAN NOT NULL DEFAULT false,
    "syncStatus" "ExternalDocumentSyncStatus" NOT NULL DEFAULT 'PENDING',
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3),
    "linkedDocumentId" TEXT,
    "linkedCaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalDocumentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSyncRun" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "provider" "ExternalProvider" NOT NULL,
    "mode" "DocumentSyncRunMode" NOT NULL DEFAULT 'MANUAL',
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "metadataOnly" BOOLEAN NOT NULL DEFAULT true,
    "contentDownloaded" BOOLEAN NOT NULL DEFAULT false,
    "dbMutated" BOOLEAN NOT NULL DEFAULT false,
    "ragIndexed" BOOLEAN NOT NULL DEFAULT false,
    "status" "DocumentSyncRunStatus" NOT NULL DEFAULT 'STARTED',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "startedById" TEXT,
    "totalSeen" INTEGER NOT NULL DEFAULT 0,
    "wouldSyncCount" INTEGER NOT NULL DEFAULT 0,
    "wouldSkipCount" INTEGER NOT NULL DEFAULT 0,
    "persistedItemCount" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "errorSummary" TEXT,

    CONSTRAINT "DocumentSyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSyncRunItem" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "externalItemKeyHash" TEXT NOT NULL,
    "safeDisplayName" TEXT NOT NULL,
    "itemKind" TEXT,
    "extension" TEXT,
    "mimeType" TEXT,
    "sizeBytes" BIGINT,
    "status" "ExternalDocumentSyncStatus" NOT NULL DEFAULT 'PENDING',
    "wouldSync" BOOLEAN NOT NULL DEFAULT false,
    "wouldSkip" BOOLEAN NOT NULL DEFAULT false,
    "skipReasons" TEXT,
    "contentDownloaded" BOOLEAN NOT NULL DEFAULT false,
    "documentCreated" BOOLEAN NOT NULL DEFAULT false,
    "ragIndexed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentSyncRunItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraphContentIngestionQuarantineItem" (
    "id" TEXT NOT NULL,
    "prototypeRunId" TEXT,
    "externalItemKeyHash" TEXT NOT NULL,
    "safeDisplayName" TEXT NOT NULL,
    "extension" TEXT,
    "mimeType" TEXT,
    "sizeBytes" BIGINT,
    "classification" TEXT,
    "quarantineReason" TEXT NOT NULL,
    "quarantineStatus" TEXT NOT NULL DEFAULT 'QUARANTINED',
    "reviewNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraphContentIngestionQuarantineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_microsoftAccountId_key" ON "User"("microsoftAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Case_blackNumber_key" ON "Case"("blackNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Case_redNumber_key" ON "Case"("redNumber");

-- CreateIndex
CREATE INDEX "DocumentChunk_legalSourceId_idx" ON "DocumentChunk"("legalSourceId");

-- CreateIndex
CREATE INDEX "DocumentChunk_sourceStatus_idx" ON "DocumentChunk"("sourceStatus");

-- CreateIndex
CREATE INDEX "DocumentChunk_reliabilityLevel_idx" ON "DocumentChunk"("reliabilityLevel");

-- CreateIndex
CREATE INDEX "DocumentChunk_legalCategory_idx" ON "DocumentChunk"("legalCategory");

-- CreateIndex
CREATE INDEX "DocumentChunk_issueTags_idx" ON "DocumentChunk"("issueTags");

-- CreateIndex
CREATE INDEX "DocumentChunk_effectiveDate_expiredDate_idx" ON "DocumentChunk"("effectiveDate", "expiredDate");

-- CreateIndex
CREATE UNIQUE INDEX "CaseArchiveRecord_caseId_key" ON "CaseArchiveRecord"("caseId");

-- CreateIndex
CREATE INDEX "CaseArchiveRecord_archiveStatus_idx" ON "CaseArchiveRecord"("archiveStatus");

-- CreateIndex
CREATE INDEX "CaseArchiveRecord_retentionStatus_idx" ON "CaseArchiveRecord"("retentionStatus");

-- CreateIndex
CREATE INDEX "CaseArchiveRecord_retentionDueAt_idx" ON "CaseArchiveRecord"("retentionDueAt");

-- CreateIndex
CREATE INDEX "CaseArchiveRecord_legalHold_idx" ON "CaseArchiveRecord"("legalHold");

-- CreateIndex
CREATE INDEX "CaseArchiveRecord_archivedAt_idx" ON "CaseArchiveRecord"("archivedAt");

-- CreateIndex
CREATE INDEX "CaseArchiveRecord_archiveBatchId_idx" ON "CaseArchiveRecord"("archiveBatchId");

-- CreateIndex
CREATE INDEX "ArchiveBatchItem_archiveBatchId_idx" ON "ArchiveBatchItem"("archiveBatchId");

-- CreateIndex
CREATE INDEX "ExternalDocumentItem_provider_idx" ON "ExternalDocumentItem"("provider");

-- CreateIndex
CREATE INDEX "ExternalDocumentItem_sourceId_idx" ON "ExternalDocumentItem"("sourceId");

-- CreateIndex
CREATE INDEX "ExternalDocumentItem_externalItemKeyHash_idx" ON "ExternalDocumentItem"("externalItemKeyHash");

-- CreateIndex
CREATE INDEX "ExternalDocumentItem_syncStatus_idx" ON "ExternalDocumentItem"("syncStatus");

-- CreateIndex
CREATE INDEX "ExternalDocumentItem_lastSeenAt_idx" ON "ExternalDocumentItem"("lastSeenAt");

-- CreateIndex
CREATE INDEX "DocumentSyncRun_provider_idx" ON "DocumentSyncRun"("provider");

-- CreateIndex
CREATE INDEX "DocumentSyncRun_status_idx" ON "DocumentSyncRun"("status");

-- CreateIndex
CREATE INDEX "DocumentSyncRunItem_runId_idx" ON "DocumentSyncRunItem"("runId");

-- CreateIndex
CREATE INDEX "DocumentSyncRunItem_externalItemKeyHash_idx" ON "DocumentSyncRunItem"("externalItemKeyHash");

-- CreateIndex
CREATE INDEX "GraphContentIngestionQuarantineItem_prototypeRunId_idx" ON "GraphContentIngestionQuarantineItem"("prototypeRunId");

-- CreateIndex
CREATE INDEX "GraphContentIngestionQuarantineItem_externalItemKeyHash_idx" ON "GraphContentIngestionQuarantineItem"("externalItemKeyHash");

-- CreateIndex
CREATE INDEX "GraphContentIngestionQuarantineItem_quarantineStatus_idx" ON "GraphContentIngestionQuarantineItem"("quarantineStatus");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_legalOfficerId_fkey" FOREIGN KEY ("legalOfficerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseDocument" ADD CONSTRAINT "CaseDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionDraft" ADD CONSTRAINT "DecisionDraft_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionDraftSection" ADD CONSTRAINT "DecisionDraftSection_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "DecisionDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalClause" ADD CONSTRAINT "LegalClause_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "LegalSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiQueryLog" ADD CONSTRAINT "AiQueryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentIngestionJob" ADD CONSTRAINT "DocumentIngestionJob_legalSourceId_fkey" FOREIGN KEY ("legalSourceId") REFERENCES "LegalSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_legalSourceId_fkey" FOREIGN KEY ("legalSourceId") REFERENCES "LegalSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_caseDocumentId_fkey" FOREIGN KEY ("caseDocumentId") REFERENCES "CaseDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunkCitation" ADD CONSTRAINT "DocumentChunkCitation_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "DocumentChunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetrievalQuery" ADD CONSTRAINT "RetrievalQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetrievalResult" ADD CONSTRAINT "RetrievalResult_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "RetrievalQuery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetrievalResult" ADD CONSTRAINT "RetrievalResult_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "DocumentChunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalAnswer" ADD CONSTRAINT "LegalAnswer_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "RetrievalQuery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalAnswerCitation" ADD CONSTRAINT "LegalAnswerCitation_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "LegalAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalAnswerCitation" ADD CONSTRAINT "LegalAnswerCitation_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "DocumentChunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftSectionAiLog" ADD CONSTRAINT "DraftSectionAiLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "CaseArchiveRecord" ADD CONSTRAINT "CaseArchiveRecord_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseArchiveRecord" ADD CONSTRAINT "CaseArchiveRecord_archiveBatchId_fkey" FOREIGN KEY ("archiveBatchId") REFERENCES "ArchiveBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeReuseReview" ADD CONSTRAINT "KnowledgeReuseReview_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveBatch" ADD CONSTRAINT "ArchiveBatch_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveBatchItem" ADD CONSTRAINT "ArchiveBatchItem_archiveBatchId_fkey" FOREIGN KEY ("archiveBatchId") REFERENCES "ArchiveBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveBatchItem" ADD CONSTRAINT "ArchiveBatchItem_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalDocumentItem" ADD CONSTRAINT "ExternalDocumentItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ExternalDocumentSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSyncRun" ADD CONSTRAINT "DocumentSyncRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ExternalDocumentSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSyncRunItem" ADD CONSTRAINT "DocumentSyncRunItem_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DocumentSyncRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

