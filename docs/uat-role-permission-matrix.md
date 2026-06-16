# UAT Role & Permission Matrix Validation

This document verifies the application's current authorization model and maps the requested UAT testing roles to the actual roles defined in the codebase.

## Role Mapping

The system relies on five authenticated roles defined in `src/lib/auth/permissions.ts` and `prisma/schema.prisma`. We have mapped the requested UAT personas to the actual roles as follows:

| Requested Persona | Actual System Role | Description |
|-------------------|--------------------|-------------|
| **SYSTEM_ADMIN** | `ADMIN` | Full system administration, user management, and system monitoring. |
| **CASE_MANAGER** | `COMMISSIONER` | Can view and review cases, meetings, and dashboards. |
| **DRAFTER** | `LEGAL_OFFICER` | Can edit drafts, use AI, upload documents, and prepare files. |
| **REVIEWER** | `COMMISSIONER` | Reviews final readiness, meetings, and finalizations. |
| **DISPATCH_OFFICER** | `REGISTRY_OFFICER` | Manages document dispatch, registry import, and court follow-ups. |
| **EXECUTIVE_VIEWER**| `COMMISSIONER`/`VIEWER`| Can view executive reports and read-only views. |
| **READ_ONLY_VIEWER**| `VIEWER` | Limited read-only access to basic case structures. |

## Permission Enforcement Matrix

| Area | Route/API | Action | ADMIN (System Admin) | COMMISSIONER (Manager/Reviewer) | LEGAL_OFFICER (Drafter) | REGISTRY_OFFICER (Dispatch) | VIEWER (Read-Only) | UNAUTHENTICATED | Expected behavior | Actual enforcement location | Notes/Gaps |
|------|-----------|--------|----------------------|---------------------------------|-------------------------|-----------------------------|--------------------|-----------------|-------------------|-----------------------------|------------|
| **Auth/Public** | `/` | Redirect | Yes | Yes | Yes | Yes | Yes | Redirect | Redirect to Dashboard or Login | `src/app/page.tsx` / Middleware | Covered |
| | `/login` | Login | Yes | Yes | Yes | Yes | Yes | Yes | Access login page | Public | Covered |
| | `/api/auth/session` | Get Session | Yes | Yes | Yes | Yes | Yes | Null | Return active session | NextAuth API | Covered |
| **Dashboard** | `/dashboard` | View Dashboard | Yes | Yes | Yes | Yes | Yes | Block | Redirect to error/login | `src/app/dashboard/page.tsx` (`VIEW_DASHBOARD`) | Covered |
| **Case Registry** | `/cases` | View Cases | Yes | Yes | Yes | Yes | Yes | Block | See case list | `src/app/cases/page.tsx` (`VIEW_CASES`) | Covered |
| | `/cases/[id]` | View Case Detail | Yes | Yes | Yes | Yes | Yes | Block | See case detail | `src/app/cases/[id]/page.tsx` (`VIEW_CASE_DETAIL`) | Covered |
| | `/registry` | View Registry | Yes | Yes | Yes | Yes | No | Block | See import/export | (Component level / `IMPORT_REGISTRY`) | Covered |
| | `/registry/import`| Import cases | Yes | No | No | Yes | No | Block | Access import UI | `src/app/registry/import/page.tsx` (`IMPORT_REGISTRY`) | Covered |
| | `/api/registry/import`| Import Action | Yes | No | No | Yes | No | Block | Process import | `src/app/api/registry/import/route.ts` | Covered |
| **Drafting** | `/cases/[id]/draft` | View/Edit Draft | Yes | Yes | Yes | No | Yes | Block | Access draft UI | `src/app/cases/[id]/draft/page.tsx` (`VIEW_DRAFT`) | Only Drafter/Admin can edit (`EDIT_DRAFT`) |
| | `/api/draft/check-citations` | AI Citations | Yes | Yes | Yes | No | No | Block | Run AI citation | `src/app/api/draft/check-citations/route.ts` (`USE_AI_REVIEW`) | Covered |
| | `/api/draft/review-wording` | AI Review | Yes | Yes | Yes | No | No | Block | Run AI review | `src/app/api/draft/review-wording/route.ts` (`USE_AI_REVIEW`) | Covered |
| | `/api/draft/section-ai` | AI Drafter | Yes | No | Yes | No | No | Block | Generate draft | `src/app/api/draft/section-ai/route.ts` (`USE_AI_DRAFT`) | Covered |
| | `/api/cases/[id]/export-docx` | Export Draft | Yes | Yes | Yes | No | No | Block | Download DOCX | `src/app/api/cases/[id]/export-docx/route.ts` (`EXPORT_DOCX`) | Covered |
| **Finalization** | `/finalization` | View Finalization| Yes | Yes | Yes | Yes | No | Block | See finalization | `src/app/finalization/page.tsx` (`VIEW_POST_MEETING_FOLLOWUP`) | Covered |
| | `/api/cases/[id]/finalization` | Manage Finalization| Yes | Yes | Yes | Yes | No | Block | Update finalization| `src/app/api/cases/[id]/finalization/...` | Depends on specific endpoints |
| | `/api/cases/[id]/finalization/red-number` | Set Red Number | Yes | No | No | Yes | No | Block | Save red number | Assumed (`RECORD_RED_CASE_NUMBER`) | Enforcement to be verified in UAT |
| **Dispatch** | `/dispatch` | View Dispatch | Yes | Yes | Yes | Yes | No | Block | See dispatch board | `src/app/dispatch/page.tsx` (`VIEW_DISPATCH_WORKFLOW`) | Covered |
| | `/api/cases/[id]/documents` | Manage Docs | Yes | Yes | Yes | Yes | Yes | Block | List/Update docs | `src/app/api/cases/[id]/documents/route.ts` (`VIEW_DOCUMENTS`) | Link requires `LINK_DOCUMENTS` |
| **Assignments** | `/assignments` | View Workload | Yes | Yes | Yes | Yes | No | Block | See assignment board| `src/app/assignments/page.tsx` (`VIEW_ASSIGNMENTS`) | Covered |
| | `/api/assignments` | Assign API | Yes | No | No | Yes | No | Block | Change assignment | `src/app/api/assignments/route.ts` (`VIEW_WORKLOAD` / `ASSIGN_CASES`) | Bulk is `ASSIGN_CASES` |
| **Search/Intel**| `/search` | Advanced Search | Yes | Yes | Yes | Yes | No | Block | Access search UI | `src/app/search/page.tsx` (`ADVANCED_CASE_SEARCH`) | Covered |
| | `/case-intelligence` | Intelligence UI | Yes | Yes | Yes | Yes | No | Block | Access AI analytics | `src/app/case-intelligence/page.tsx` (`ADVANCED_CASE_SEARCH`) | Covered |
| **Meetings** | `/meetings` | View Meetings | Yes | Yes | Yes | Yes | Yes | Block | See meeting list | `src/app/meetings/page.tsx` (`VIEW_MEETINGS`) | Covered |
| | `/meetings/new` | Create Meeting | Yes | No | No | Yes | No | Block | Access new meeting | Component level (`MANAGE_MEETINGS`) | Covered |
| | `/api/meetings` | Meeting API | Yes | No | No | Yes | No | Block | Manage meetings | `src/app/api/meetings/route.ts` (`MANAGE_MEETINGS`) | Covered |
| **Executive** | `/executive` | Exec Dashboard | Yes | Yes | No | No | No | Block | See reports | `src/app/executive/page.tsx` (`VIEW_EXECUTIVE_DASHBOARD`) | Covered |
| | `/api/reports/executive/export`| Export Exec Report| Yes | Yes | No | No | No | Block | Download report | `src/app/api/reports/executive/export/route.ts` (`EXPORT_EXECUTIVE_REPORT`)| Covered |
| **Data Quality**| `/data-quality` | Data Quality UI | Yes | Yes | Yes | Yes | No | Block | Access DQ issues | `src/app/data-quality/page.tsx` (`VIEW_DATA_QUALITY`) | Covered |
| | `/api/data-quality/issues` | DQ API | Yes | Yes | Yes | Yes | No | Block | Load DQ data | `src/app/api/data-quality/issues/route.ts` (`VIEW_DATA_QUALITY`) | Covered |
| | `/api/data-quality/cases/[id]/quick-fix`| DQ Quick Fix | Yes | No | Yes | Yes | No | Block | Clean data | `src/app/api/data-quality/cases/[id]/quick-fix/route.ts` (`CLEANUP_DATA_QUALITY`) | Covered |
| **Admin** | `/admin/readiness` | Readiness UI | Yes | No | No | No | No | Block | System checks | `src/app/admin/readiness/page.tsx` (`MANAGE_USERS`) | Protected by ADMIN |
| | `/admin/system` | System Admin | Yes | No | No | No | No | Block | Server stats | `src/app/admin/system/page.tsx` (`VIEW_ADMIN_CONSOLE`) | Protected by ADMIN |
| | `/admin/users` | Manage Users | Yes | No | No | No | No | Block | User management | Component level | Protected by ADMIN |
| | `/api/admin/*` | System APIs | Yes | No | No | No | No | Block | Execute jobs | `src/app/api/admin/...` (`VIEW_ADMIN_CONSOLE` / `MANAGE_USERS`) | Protected by ADMIN |
