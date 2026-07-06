# Microsoft Graph Official Document Schema Impact Review

This document outlines the **future additive models only**. No edits are made to the Prisma schema in this prompt.

## Future Model: OfficialDocumentImportCandidate

**Suggested Fields:**
- `id`: String (UUID)
- `provider`: String
- `sourceType`: String
- `sourceRunId`: String
- `sourceItemKeyHash`: String
- `sourceContentHash`: String
- `safeDisplayName`: String
- `originalExtension`: String
- `mimeType`: String
- `fileSizeBytes`: Int
- `parserName`: String
- `parserVersion`: String
- `extractionMethod`: String
- `classification`: String
- `sensitivity`: String
- `candidateStatus`: String
- `extractedPreviewHash`: String
- `extractedPreviewStored`: Boolean
- `fullContentStored`: Boolean
- `officialDocumentCreated`: Boolean
- `linkedOfficialDocumentId`: String?
- `linkedCaseId`: String?
- `reviewedById`: String?
- `reviewedAt`: DateTime?
- `reviewNotes`: String?
- `rejectionReason`: String?
- `quarantineReason`: String?
- `createdById`: String
- `createdAt`: DateTime
- `updatedAt`: DateTime

## Future Model: OfficialDocumentImportReview

**Suggested Fields:**
- `id`: String (UUID)
- `candidateId`: String (Relation)
- `reviewerId`: String
- `decision`: String
- `notes`: String?
- `requiresRedaction`: Boolean
- `approvedForStagingPromotion`: Boolean
- `approvedForProduction`: Boolean
- `ragIndexApproved`: Boolean
- `createdAt`: DateTime

## Future Model: OfficialDocumentImportAudit

**Suggested Fields:**
- `id`: String (UUID)
- `candidateId`: String (Relation)
- `action`: String
- `actorId`: String
- `safeSummary`: String
- `createdAt`: DateTime

## Rules (For Future Implementation):
1. Additive only.
2. No raw Microsoft IDs.
3. No raw URLs.
4. No tokens.
5. No raw Graph responses.
6. No full extracted content by default.
7. No RAG fields default true.
8. No official Document creation in this prompt.
9. No production migration in this prompt.
10. No schema edit in this prompt unless documentation-only references.
