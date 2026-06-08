-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
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
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "dueDate30" TIMESTAMP(3),
    "dueDate60" TIMESTAMP(3),
    "dueDate90" TIMESTAMP(3),
    "dueDate120" TIMESTAMP(3),
    "dueDate240" TIMESTAMP(3),
    "currentStatus" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3),
    "decisionResult" TEXT,
    "oneDriveUrl" TEXT,
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
    "sourceStatus" TEXT NOT NULL DEFAULT 'เนเธเนเธเธฒเธ',
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

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

-- CreateIndex
CREATE INDEX "DocumentChunk_embedding_idx" ON "DocumentChunk" USING hnsw (embedding vector_cosine_ops);

