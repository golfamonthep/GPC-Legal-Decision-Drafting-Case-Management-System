CREATE TABLE "AnalysisWorkspace" (
  "id" TEXT NOT NULL,
  "ownerKey" TEXT NOT NULL,
  "caseId" TEXT,
  "title" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "lockRevision" INTEGER NOT NULL DEFAULT 1,
  "contents" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnalysisWorkspace_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AnalysisWorkspace_ownerKey_updatedAt_idx" ON "AnalysisWorkspace"("ownerKey", "updatedAt");
CREATE INDEX "AnalysisWorkspace_caseId_idx" ON "AnalysisWorkspace"("caseId");
ALTER TABLE "AnalysisWorkspace" ADD CONSTRAINT "AnalysisWorkspace_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AnalysisWorkspace" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "AnalysisWorkspace" FROM PUBLIC, anon, authenticated;
