# Production UAT Checklist

## End-to-End Test Scenarios

| Scenario | Steps to Verify | Expected Result | Pass/Fail |
|----------|-----------------|-----------------|-----------|
| Login with Microsoft | Click "Sign in with Microsoft" | User is authenticated and redirected to Dashboard (or Pending screen). | |
| First Admin / User Role Verification | Check user status in DB or UI after first login | First configured admin becomes ADMIN. Others become PENDING. | |
| Dashboard Loads Correctly | Navigate to `/dashboard` | Statistics and recent cases are visible and accurate. | |
| Registry Excel Import Preview | Go to `/registry/import`, upload valid Excel | Data preview is shown with counts of clean, warning, and error rows. | |
| Registry Excel Import Confirmation | Click "Import" on valid preview | Records are created in DB. Cases, Events, and AuditLogs are populated. No overwrite occurs. | |
| Case List Filtering/Searching | Go to `/cases`, use search and filters | Results update accurately according to filter criteria. | |
| Case Detail Display | Click a case from `/cases` | Case details, history, and status are displayed accurately. | |
| Case Detail Editing | Click edit on case details | Changes are saved, and AuditLog is created. | |
| CaseEvent Creation | Add a new event in case history | Event appears in history, AuditLog is created. | |
| AuditLog Creation | Perform any mutation (edit case, change status) | Corresponding `AuditLog` entry is saved in DB. | |
| Draft Workspace | Go to `/cases/[id]/draft` | Draft sections load. Content is editable. | |
| AI Draft Section Assistant | Click "Generate AI Draft" for a section | AI text is generated based on retrieved context. Requires human review. | |
| Legal Wording Reviewer | Click "Review Wording" for drafted text | AI suggests formal wording improvements without altering facts. | |
| Citation Coverage Checker | Click "Check Citations" | AI validates citations against source documents. | |
| DOCX Export | Click "Export to DOCX" on draft | `.docx` file downloads with correct Thai formatting and mapped fields. | |
| Microsoft Document Link Section | Go to Case detail, view Documents | Folders/files from SharePoint/OneDrive are listed or linkable. | |
| Permission Denied Behavior | Access `/admin` as `VIEWER` | Redirected to `/` or shows 403 Forbidden. | |
| Error Handling Behavior | Trigger a failed API request | Safe generic error message is displayed (no stack traces). | |

## Role-Based UAT Matrix

Verify that each role experiences the following access controls:

| Role | Allowed Access | Expected Forbidden (403) |
|------|----------------|--------------------------|
| **ADMIN** | Full access to all menus, cases, user management, and AI. | None |
| **COMMISSIONER** | Read all cases, use AI, view drafts, export DOCX. | Edit registry data, import registry, manage users. |
| **LEGAL_OFFICER** | Read/Edit assigned cases, drafts, AI tools, documents. | Import registry, manage users. |
| **REGISTRY_OFFICER**| Import Excel, edit registry details, manage case status. | AI tools, Draft Workspace, Manage Users. |
| **VIEWER** | Read-only access to `/cases` and Dashboard. | Edit any data, AI tools, user management, imports. |
| **PENDING** | "Account pending approval" screen. | Any route other than `/login` and `/` (unauthorized view). |
| **DISABLED** | Login failure or locked out message. | All access. |

## Production Smoke Test Checklist

Live routes to verify immediately post-deployment.

| Route | Required Role | Expected Result | Common Failure | Verification |
|-------|---------------|-----------------|----------------|--------------|
| `/` | Any / None | Redirects to `/login` if unauthenticated, or `/dashboard` if authed. | Infinite redirect loop. | Open in incognito. |
| `/login` | None | Shows Microsoft login button. | Missing MS Auth config. | Check button renders. |
| `/api/health/db` | None | `{"status": "ok", "message": "Database is connected"}`. | Exposing secrets, DB down. | Load URL, inspect JSON. |
| `/dashboard` | VIEWER+ | Displays key stats and charts. | Prisma error on aggregations. | Verify numbers match DB. |
| `/cases` | VIEWER+ | Displays list of cases with pagination. | Unindexed slow query. | Scroll and search. |
| `/registry` | REGISTRY+ | Registry management interface. | 403 for wrong role. | Access as LEGAL_OFFICER. |
| `/registry/import`| REGISTRY+ | File upload area. | Missing API route. | Test small file upload. |
| `/library` | Any authed | Document search/retrieval UI. | Failed embedding search. | Search a simple term. |
| `/rag` | LEGAL+ | Search and Q&A over internal docs. | OpenAI key missing. | Ask "What is this case?". |
| `/legal-qa` | LEGAL+ | General legal assistant UI. | OpenAI API limits. | Ask a general legal concept. |
| `/admin/users` | ADMIN | List of users with role toggles. | Non-admins can access. | Access as COMMISSIONER. |

## Registry Import Data Verification

Use a synthetic Excel file to confirm:
- [ ] Clean rows import successfully.
- [ ] Warning rows can be imported with confirmation.
- [ ] Hard-error rows (missing critical IDs) are skipped gracefully.
- [ ] Duplicates (same black case number) are skipped or updated without data loss.
- [ ] Blank optional fields do not crash the parser.
- [ ] Thai dates parse correctly.
- [ ] `#VALUE!` or bad formulas in cells do not crash the parser.
- [ ] Multiline operation notes import correctly.

## Dashboard Business Logic Verification

- [ ] Completed cases are excluded from the overdue list.
- [ ] "เสร็จสิ้น" and "เสร็จสิ้น (ศาลปกครอง)" are not overdue.
- [ ] Cases with a red case number ("แดงแล้ว") are not overdue.
- [ ] Active cases *without* a red case number can be overdue.
- [ ] Summary cards reflect the correct counts without mixing logic.

## AI Safety Behavior Verification

- [ ] Legal Q&A refuses to answer if no source context is found (hallucination prevention).
- [ ] AI Draft Assistant only works with retrieved context.
- [ ] Legal Wording Reviewer does not change material facts.
- [ ] Citation Checker does not invent non-existent citations.
- [ ] All AI outputs display a human-review warning.
- [ ] AI routes correctly block unauthorized roles.

## DOCX Export Verification

- [ ] Complete draft exports without errors.
- [ ] Draft with missing sections exports safely (blanks or placeholders).
- [ ] Exports handle both "grievance" and "appeal" logic correctly.
- [ ] Missing red case number is handled gracefully.
- [ ] Long Thai paragraphs flow correctly.
- [ ] No raw JSON or internal placeholders remain in the `.docx`.
- [ ] No AI prompts or hidden metadata in the document.
- [ ] Layout is usable in Microsoft Word.
- [ ] AuditLog is created for the export action.

## Audit Logs Verification

Confirm entries exist in the `AuditLog` table for:
- [ ] Login
- [ ] Permission denied (if tracked)
- [ ] Registry import
- [ ] Case edit
- [ ] Draft edit
- [ ] AI Draft Request / AI Wording / Citation Check
- [ ] DOCX Export
- [ ] User role/status changes
- [ ] Ensure real `userId` is used where possible.
- [ ] Ensure no secrets (tokens, passwords) are logged.
