# Prompt 91: MVP Operational Cutover Report

## 1. Executive Summary

Prompt 91 executes the controlled MVP Operational Cutover for the GPC Legal Decision Drafting & Case Management System. The objective is to cut the system down to a safe, usable, controlled MVP that 3–5 internal users can start using with limited case volume, strict manual review, and clear exclusions for unfinished features.

**Result: CONDITIONAL GO**

The system is technically ready for controlled real use. All verification commands pass (build, typecheck, Prisma validation). One critical business logic fix was applied (completed/overdue status consistency). Core features are verified safe. Unsafe or unfinished features are clearly classified and documented.

**Conditions for full GO:**
1. Operator assigned and trained on daily checklist
2. First 3–5 users identified and trained on MVP SOP
3. Test import completed with sample data
4. Communication channel established for issue reporting

---

## 2. MVP Scope

The MVP enables the following essential workflow:
1. Login / access control (Microsoft Entra ID)
2. Dashboard (real DB metrics, no mock data)
3. Registry import (supervised, admin-restricted)
4. Case list (with filters)
5. Case detail (all fields)
6. Case status / completed logic (canonicalized)
7. Overdue calculation (excludes completed/red-number cases)
8. Legal officer / responsible officer display
9. Legal Q&A / RAG (with mandatory verification warning)
10. Issue reporting (via template)
11. Basic admin monitoring

---

## 3. Features Included in MVP

| Feature | Classification | Notes |
|---------|---------------|-------|
| Authentication / Login (Entra ID) | **MVP Included** | Fully functional via NextAuth + Azure AD |
| Role Permission (RBAC) | **MVP Included** | 5 roles, 84 permissions, server-side enforcement |
| Dashboard | **MVP Included** | Real DB data, no mock metrics, completed/red exclusion |
| Registry Import | **MVP Included** | Permission-gated, duplicate detection, auto-status correction |
| Case List | **MVP Included** | Filters by type, status, red number, legal officer, unassigned |
| Case Detail | **MVP Included** | All fields displayed, status badges, due dates |
| Status Update | **MVP Included** | Via case edit, with audit logging |
| Completed / Overdue Logic | **MVP Included** | Canonical helper (`isClosedCaseStatus`) with full status list |
| Legal Officer Display | **MVP Included** | Shows assigned legal officer name |
| Case Event / History | **MVP Included** | Timeline of events per case |
| Knowledge Library | **MVP Included** | Read-only access to legal knowledge base |
| Audit Log | **MVP Included** | Records all write actions, exports, imports |

---

## 4. Features Included with Limitation

| Feature | Classification | Limitation |
|---------|---------------|------------|
| Legal Q&A / RAG | **MVP Included with Limitation** | Must verify all citations. Warning banner mandatory. Not final legal advice. |
| DOCX Template Workflow | **MVP Included with Limitation** | Output is DRAFT only. Manual legal review required before any official use. |
| Document Export | **MVP Included with Limitation** | Permission-gated. Draft-only output. Audit-logged. |
| Advanced Search | **MVP Included with Limitation** | Functional but not validated against large datasets |
| Case Assignment Panel | **MVP Included with Limitation** | Display only. Workload metrics for reference. |

---

## 5. Features Hidden / Disabled / Excluded

| Feature | Classification | Reason |
|---------|---------------|--------|
| RAG Admin Page (`/rag`) | **Not Ready** | Internal testing page showing hardcoded zeroes. Not user-facing. |
| RAG Retrieval Test (`/rag/retrieval-test`) | **Not Ready** | Developer testing page only. |
| Case Intelligence (`/case-intelligence`) | **Not Ready** | Not in sidebar navigation. Experimental. |
| Records Retention / Archive | **Disable for Now** | Production execution blocked by environment gate. Read-only UI only. |
| Microsoft Graph / Document Sync | **Disable for Now** | Mock-only. No live sync. Owner confirmation not obtained. |
| Meeting Management | **Post-MVP** | Not part of essential MVP workflow. Permission-gated. |
| Finalization / Post-Meeting | **Post-MVP** | Not part of essential MVP workflow. Permission-gated. |
| Dispatch / Court Follow-up | **Post-MVP** | Not part of essential MVP workflow. Permission-gated. |
| Executive Dashboard | **Manual Review Required** | Metrics not validated against live data for official reporting. |
| Data Quality Cleanup | **Manual Review Required** | Read-only review OK. Mutation actions should be supervised. |
| Upload Page (`/upload`) | **Manual Review Required** | In sidebar without permission check. Needs supervision. |
| Admin System Console | **Admin Only** | Permission-gated to ADMIN role via VIEW_ADMIN_CONSOLE |
| Backup / Restore | **Not Ready** | Relies on Supabase dashboard snapshots. No automated backup in app. |

---

## 6. Critical Fixes Completed

| Fix | File | Impact |
|-----|------|--------|
| **Completed status consistency** | `src/lib/caseStatus.ts` | Added missing statuses `ปิดคดี` and `วินิจฉัยแล้วเสร็จ` to `isClosedCaseStatus()`. These were present in inline arrays in `dashboard.ts`, `caseSearch.ts`, and `cases/page.tsx` but missing from the canonical helper. This could have caused cases with those statuses to be incorrectly counted as overdue. |

---

## 7. Remaining Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| PRE-6: Azure AD Setup for Vercel preview | Low | Deferred. Does not affect production deployment. |
| Lint has 378 legacy errors | Low | Non-blocking. Does not affect build or runtime. |
| Upload page (`/upload`) lacks permission gate in sidebar | Medium | Documented. Upload API has separate permission checks. |
| No automated test suite | Medium | Manual testing via operator checklist. |
| COMMISSIONER/VIEWER live UAT not completed | Medium | Static code audit passed. Live test needed with real accounts. |

---

## 8. Registry Import Status

**Status: MVP Ready (Supervised Use)**

| Check | Result |
|-------|--------|
| Excel upload | ✅ Functional |
| Preview | ✅ Shows parsed data before import |
| Thai column mapping | ✅ ColumnMapper component handles Thai headers |
| Validation | ✅ Skips rows without meaningful data |
| Duplicate detection | ✅ Pre-checks black and red numbers |
| Thai date parsing | ✅ `parseThaiDate()` handles Buddhist year conversion |
| Import result summary | ✅ Returns imported/skipped/failed counts with messages |
| Row-level errors | ✅ Per-row messages for skips and failures |
| Case creation | ✅ Transactional (25-row chunks), audit-logged |
| Auto-status correction | ✅ Red number cases auto-set to 'เสร็จสิ้น' |
| Permission gate | ✅ Requires `IMPORT_REGISTRY` permission |

**Restriction**: First import must be supervised by operator. Admin/Registry Officer only.

---

## 9. Case Management Status

**Status: MVP Ready**

| Check | Result |
|-------|--------|
| Case list loads | ✅ All cases with filters |
| Case detail loads | ✅ Full case data displayed |
| Case fields display | ✅ Black number, red number, petitioner, respondent, subject, status, due dates, legal officer |
| Status display | ✅ StatusBadge component with color coding |
| Due date display | ✅ Multiple due date fields (30/60/90/120/240 days) |
| Completed cases not marked overdue | ✅ `isClosedOrRedCase()` filter applied |
| Red-number cases not marked overdue | ✅ `hasRedCaseNumber()` check applied |
| Legal officer display | ✅ Shows assigned legal officer name |
| Search/filter works | ✅ Type, status, red number, legal officer, unassigned filters |
| Empty state | ✅ Clear message when no data |
| Invalid case ID | ✅ 404 handling in case detail |

---

## 10. Dashboard Status

**Status: MVP Ready**

| Metric | Source | Reliable |
|--------|--------|----------|
| Total cases | `prisma.case.count()` | ✅ |
| Grievance cases | `prisma.case.count({ type: 'ร้องทุกข์' })` | ✅ |
| Appeal cases | `prisma.case.count({ type: 'อุทธรณ์' })` | ✅ |
| Overdue cases | DB query + `isClosedOrRedCase()` filter | ✅ |
| Near-due cases (7 days) | DB query + `isClosedOrRedCase()` filter | ✅ |
| Draft completions | `prisma.decisionDraft.count({ status: 'approved' })` | ✅ |
| Mock data used | **NONE** | ✅ |

All metrics use real database data. No mock metrics. Completed/red-number cases are excluded from overdue and near-due counts.

---

## 11. Completed / Overdue Logic Status

**Status: Fixed and Consistent**

The canonical helper `isClosedCaseStatus()` in `src/lib/caseStatus.ts` now includes all 11 closed statuses:
- เสร็จสิ้น
- เสร็จสิ้น (ศาลปกครอง)
- เสร็จสิ้น(ศาลปกครอง)
- แล้วเสร็จ
- ยุติเรื่อง
- จำหน่ายเรื่อง
- ปิดเรื่อง
- closed
- completed
- ปิดคดี *(newly added)*
- วินิจฉัยแล้วเสร็จ *(newly added)*

**Consistency**: The helper is used consistently across:
1. Registry import (`src/app/api/registry/import/route.ts`)
2. Case list (`src/app/cases/page.tsx`)
3. Case detail (`src/app/cases/[id]/page.tsx`)
4. Dashboard metrics (`src/lib/services/dashboard.ts`)
5. CaseTable component (`src/components/CaseTable.tsx`)
6. StatusBadge component (`src/components/StatusBadge.tsx`)
7. Data quality checks (`src/lib/search/dataQuality.ts`)

The inline arrays in `dashboard.ts` and `caseSearch.ts` also contain the full list for DB-level filtering. These are consistent.

---

## 12. Legal Q&A Status

**Status: MVP Included with Limitation**

| Check | Result |
|-------|--------|
| Uses real retrieved sources | ✅ Via RAG/vector search when sources available |
| No-source fallback | ✅ Returns error if retrieval fails |
| Fabrication warning | ✅ Prominent warning banner displayed |
| Sources/citations shown | ✅ Retrieved chunks displayed with source titles |
| Manual review warning | ✅ Bold red warning: "ต้องตรวจโดยนิติกร/กรรมการก่อนใช้งานจริง" |
| Not presented as final advice | ✅ Clearly labeled as AI-assisted support |

**Required Warning**: "AI-assisted legal answers are for search and drafting support only. Users must verify all legal references, facts, and reasoning against official source documents before relying on the output."

The Legal Q&A page includes this warning prominently.

---

## 13. DOCX / Template Status

**Status: MVP Included with Limitation**

- DOCX export is functional with permission gating (`EXPORT_DOCX`, `EXPORT_FINAL_DECISION_DOCX`)
- Uses docxtemplater (template-based) with programmatic fallback
- Audit-logged (DOCX_EXPORT_REQUESTED/COMPLETED/FAILED)
- **All output must be treated as DRAFTS requiring manual legal review**
- Template file exists at `templates/docx/gpc-decision-template.docx`

---

## 14. Permission / Security Status

**Status: MVP Ready**

| Check | Result |
|-------|--------|
| Pages require authentication | ✅ `requirePermission()` server-side check on all pages |
| APIs require authentication | ✅ `requireApiPermission()` on all API routes |
| Import restricted | ✅ `IMPORT_REGISTRY` permission required |
| Edit/update restricted | ✅ `EDIT_CASE` permission required |
| Delete actions restricted | ✅ No unprotected delete endpoints |
| Export restricted | ✅ `EXPORT_DOCX`, `EXPORT_EXECUTIVE_REPORT` etc. |
| Viewer cannot mutate | ✅ Viewer role has only VIEW_* permissions |
| Admin-only areas protected | ✅ `MANAGE_USERS`, `VIEW_ADMIN_CONSOLE` gates |
| Secrets not committed | ✅ `.env` in `.gitignore`, `.env.example` has no values |
| Permission denied messages | ✅ Clear Thai-language error messages |

**Middleware**: `src/proxy.ts` uses `next-auth/middleware` to protect all routes except public paths.

---

## 15. Audit Log Status

**Status: MVP Ready**

- All write actions logged via `AuditLog` model
- Tracks: userId, action, entityType, entityId, beforeValue, afterValue
- Import, export, status change, assignment changes are all logged
- DOCX exports have dedicated audit actions

---

## 16. Build / Lint / Typecheck / Prisma Results

| Command | Result | Details |
|---------|--------|---------|
| `npx prisma validate` | ✅ PASS | Schema valid |
| `npm run typecheck` | ✅ PASS | `tsc --noEmit` clean |
| `npm run build` | ✅ PASS | 67 routes compiled successfully |
| `npm run lint` | ⚠️ 378 errors, 1414 warnings | Legacy ESLint issues, non-blocking |
| `npm test` | N/A | No test script configured |
| `npx prisma generate` | ✅ PASS | Part of build script |

---

## 17. MVP Go / Conditional Go / No-Go Recommendation

### **CONDITIONAL GO**

**Rationale**:
- All critical verification commands pass
- Core MVP workflow is functional and safe
- Business logic consistency fix applied and verified
- Legal Q&A has appropriate safety warnings
- DOCX is limited to draft use with manual review requirement
- Permissions and authentication are properly enforced
- No P0/P1 blockers remain

**Condition**: Must complete operational setup (user identification, operator assignment, test import, communication channel) before starting real use.

---

## 18. First User Group Recommendation

| Role | Count | Person/Position |
|------|-------|-----------------|
| Admin / Operator | 1 | System administrator (monitors, reviews imports, handles issues) |
| Registry Officer | 1 | Registry staff (imports data, verifies accuracy) |
| Legal Officer | 1–2 | Legal staff (reviews cases, uses Q&A, updates status) |
| Commissioner / Reviewer | 1 | Senior reviewer (read-only case review) |
| **Total** | **3–5** | |

---

## 19. First Case Volume Limit

**Maximum 50 cases** for initial controlled use.

After 2 weeks of stable use with no Critical or High issues, consider increasing to 100 cases.

---

## 20. Daily Monitoring Instructions

The assigned operator must perform these checks daily:

1. ✅ Verify system is accessible (login works)
2. ✅ Check dashboard loads correctly with accurate metrics
3. ✅ Review Vercel deployment logs for errors
4. ✅ Check for new issue reports from users
5. ✅ Verify case counts match expected data
6. ✅ Confirm no unauthorized access attempts in audit log
7. ✅ Document any anomalies in the daily monitoring log
8. ✅ Weekly: Review all imported data for accuracy

---

## 21. Stop-Use Criteria

Stop the MVP immediately and notify all users if ANY of these occur:

1. **Data Corruption**: Imported or existing data is corrupted
2. **Data Leakage**: Sensitive data exposed outside secure environment
3. **Security Breach**: Unauthorized access or privilege escalation detected
4. **AI Hallucination**: Legal Q&A fabricates sources that could mislead users
5. **Import Failure**: Registry import creates incorrect records at scale
6. **Dashboard Misleading**: Dashboard shows materially incorrect metrics
7. **DOCX Error**: DOCX output creates materially incorrect official-looking documents
8. **System Instability**: Build/deployment failure prevents access
9. **Workflow Blocked**: Users cannot complete core case workflow
10. **Critical Vulnerability**: Zero-day in Next.js, Prisma, NextAuth, or other dependency

---

## 22. Recommended Next Prompt

**Prompt 92: MVP First Real-Use Monitoring and Issue Fix**

Focus areas:
1. Monitor first 3–5 users during initial real use
2. Collect issue reports and prioritize fixes
3. Validate dashboard metrics against actual case data
4. Verify registry import with real (non-sensitive) data
5. Assess Legal Q&A safety with real queries
6. Evaluate whether to increase case volume limit
7. Document lessons learned from first real-use period
