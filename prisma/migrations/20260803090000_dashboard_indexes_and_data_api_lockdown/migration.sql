-- Additive-only dashboard indexes. No table or row is dropped.
CREATE INDEX IF NOT EXISTS "Case_receivedDate_idx" ON "Case" ("receivedDate");
CREATE INDEX IF NOT EXISTS "Case_type_receivedDate_idx" ON "Case" ("type", "receivedDate");
CREATE INDEX IF NOT EXISTS "Case_legalOfficerId_idx" ON "Case" ("legalOfficerId");
CREATE INDEX IF NOT EXISTS "Case_ownerId_idx" ON "Case" ("ownerId");
CREATE INDEX IF NOT EXISTS "Case_updatedAt_idx" ON "Case" ("updatedAt");

-- Cover every foreign key reported by the Supabase Performance Advisor.
CREATE INDEX IF NOT EXISTS "AiQueryLog_userId_idx" ON "AiQueryLog" ("userId");
CREATE INDEX IF NOT EXISTS "ArchiveBatch_createdByUserId_idx" ON "ArchiveBatch" ("createdByUserId");
CREATE INDEX IF NOT EXISTS "ArchiveBatchItem_caseId_idx" ON "ArchiveBatchItem" ("caseId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog" ("userId");
CREATE INDEX IF NOT EXISTS "CaseDocument_caseId_idx" ON "CaseDocument" ("caseId");
CREATE INDEX IF NOT EXISTS "CaseEvent_caseId_idx" ON "CaseEvent" ("caseId");
CREATE INDEX IF NOT EXISTS "DecisionDraft_caseId_idx" ON "DecisionDraft" ("caseId");
CREATE INDEX IF NOT EXISTS "DecisionDraftSection_draftId_idx" ON "DecisionDraftSection" ("draftId");
CREATE INDEX IF NOT EXISTS "DocumentChunk_caseDocumentId_idx" ON "DocumentChunk" ("caseDocumentId");
CREATE INDEX IF NOT EXISTS "DocumentChunkCitation_chunkId_idx" ON "DocumentChunkCitation" ("chunkId");
CREATE INDEX IF NOT EXISTS "DocumentIngestionJob_legalSourceId_idx" ON "DocumentIngestionJob" ("legalSourceId");
CREATE INDEX IF NOT EXISTS "DocumentSyncRun_sourceId_idx" ON "DocumentSyncRun" ("sourceId");
CREATE INDEX IF NOT EXISTS "DraftSectionAiLog_userId_idx" ON "DraftSectionAiLog" ("userId");
CREATE INDEX IF NOT EXISTS "KnowledgeReuseReview_caseId_idx" ON "KnowledgeReuseReview" ("caseId");
CREATE INDEX IF NOT EXISTS "LegalAnswer_queryId_idx" ON "LegalAnswer" ("queryId");
CREATE INDEX IF NOT EXISTS "LegalAnswerCitation_answerId_idx" ON "LegalAnswerCitation" ("answerId");
CREATE INDEX IF NOT EXISTS "LegalAnswerCitation_chunkId_idx" ON "LegalAnswerCitation" ("chunkId");
CREATE INDEX IF NOT EXISTS "LegalClause_sourceId_idx" ON "LegalClause" ("sourceId");
CREATE INDEX IF NOT EXISTS "Meeting_createdByUserId_idx" ON "Meeting" ("createdByUserId");
CREATE INDEX IF NOT EXISTS "MeetingAgendaItem_assignedFollowUpUserId_idx" ON "MeetingAgendaItem" ("assignedFollowUpUserId");
CREATE INDEX IF NOT EXISTS "MeetingAgendaItem_caseId_idx" ON "MeetingAgendaItem" ("caseId");
CREATE INDEX IF NOT EXISTS "MeetingAgendaItem_meetingId_idx" ON "MeetingAgendaItem" ("meetingId");
CREATE INDEX IF NOT EXISTS "MeetingAttendee_meetingId_idx" ON "MeetingAttendee" ("meetingId");
CREATE INDEX IF NOT EXISTS "RetrievalQuery_userId_idx" ON "RetrievalQuery" ("userId");
CREATE INDEX IF NOT EXISTS "RetrievalResult_chunkId_idx" ON "RetrievalResult" ("chunkId");
CREATE INDEX IF NOT EXISTS "RetrievalResult_queryId_idx" ON "RetrievalResult" ("queryId");

-- The application accesses these tables through a server-side Prisma connection.
-- RLS with no client policies plus revoked anon/authenticated grants makes the
-- Supabase Data API deny-by-default. Database owner/BYPASSRLS connections remain
-- available to the server application and migrations.
DO $dashboard_lockdown$
DECLARE
  table_name text;
  role_name text;
  application_tables text[] := ARRAY[
    '_prisma_migrations', 'User', 'Case', 'CaseDocument', 'CaseEvent', 'DecisionDraft',
    'DecisionDraftSection', 'LegalSource', 'LegalClause', 'AiQueryLog',
    'AuditLog', 'DocumentIngestionJob', 'DocumentChunk',
    'DocumentChunkCitation', 'RetrievalQuery', 'RetrievalResult',
    'LegalAnswer', 'LegalAnswerCitation', 'DraftSectionAiLog', 'Meeting',
    'MeetingAgendaItem', 'MeetingAttendee', 'CaseArchiveRecord',
    'RetentionPolicy', 'KnowledgeReuseReview', 'ArchiveBatch',
    'ArchiveBatchItem', 'ExternalDocumentSource', 'ExternalDocumentItem',
    'DocumentSyncRun', 'DocumentSyncRunItem',
    'GraphContentIngestionQuarantineItem'
  ];
BEGIN
  FOREACH table_name IN ARRAY application_tables LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
          EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM %I', table_name, role_name);
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END
$dashboard_lockdown$;
