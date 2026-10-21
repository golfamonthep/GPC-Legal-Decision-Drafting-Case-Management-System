# MVP Usability Gap Audit

Based on the inspection of the repository (commit `4e8ab34`), the following gaps were identified that block or degrade the MVP usability:

| Workflow | Current Status | Evidence/File | Severity | Required Fix |
|---|---|---|---|---|
| **A. Application Entry & Auth** | The `mvp-user` hardcoded ID does not exist in the `User` table, causing foreign-key constraint failures when writing `AuditLog` records. | `src/lib/auth/mvp-auth.ts`, `prisma.schema` | P0 | Implement a central strategy to upsert the MVP user into the `User` table when accessed, ensuring relational integrity. |
| **B. Registry Import (Validation)** | The Excel uploader lacks robust file size and row limit checks, which could cause timeouts or out-of-memory errors on Vercel. Duplicate handling is partially implemented but errors are not well-structured. | `ExcelUploader.tsx`, `api/registry/import/route.ts` | P1 | Add a 10MB size limit and 2000-row limit in `ExcelUploader.tsx`. Refactor API to return structured errors. |
| **B. Registry Import (Template)** | No Excel template is provided for users to download and follow. | Missing `/api/registry/import/template` | P1 | Create a template generation route and add a download button in the import UI. |
| **C. Case Document Upload** | Uploads return HTTP 501. Underlying `uploadCaseDocument` throws "Not implemented". | `api/cases/[id]/documents/upload-placeholder/route.ts`, `lib/documents/documentStorage.ts` | P0 | Implement file upload to Supabase Storage, create `CaseDocument` and `AuditLog` records, and handle transaction rollbacks (file deletion) if DB insert fails. Remove the placeholder endpoint. |
| **C. Document UI** | Document list only supports OneDrive linking, no UI for actual file uploads. | `components/DocumentList.tsx`, `app/cases/[id]/page.tsx` | P0 | Update UI to separate "อัปโหลดเอกสาร" (Supabase) and "เชื่อมโยงเอกสาร" (OneDrive). Show size, category, and download buttons. |
| **D. Case Status Update** | The status update form is a static HTML placeholder with no endpoint or form submission logic. | `app/cases/[id]/page.tsx` (line 388) | P0 | Implement `PATCH /api/cases/[id]` to update `currentStatus` and `proceedingNote`, create `CaseEvent`, and refresh the UI. |

## Severity Definition
- **P0** = Prevents real use (Must fix for MVP)
- **P1** = Major operational defect (Must fix for MVP stability)
- **P2** = Useful but not required now
- **P3** = Future enhancement
