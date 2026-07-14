# MVP Real-Use Standard Operating Procedure (SOP)

**System**: GPC Legal Decision Drafting & Case Management System  
**Organization**: ก.พ.ค.ตร. (คณะกรรมการพิทักษ์ระบบคุณธรรมข้าราชการตำรวจ)  
**Phase**: Controlled MVP Real-Use  
**Last Updated**: 2026-07-14

---

## 1. Purpose

This SOP guides 3–5 internal users during the controlled MVP real-use phase. It establishes safe operating procedures, defines workflow limitations, and outlines mandatory compliance rules for initial real use.

> [!IMPORTANT]
> All users must read this SOP in full before accessing the system. Failure to follow these procedures may result in revocation of MVP access.

---

## 2. Who May Use the MVP

| Role | Count | Responsibilities |
|------|-------|-----------------|
| **Admin** | 1 | System configuration, monitoring, and operator duties |
| **Registry Officer** | 1 | Registry import, data verification |
| **Legal Officer** | 1–2 | Case review, status update, Legal Q&A (with limitations) |
| **Commissioner / Reviewer** | 1 | Case review (read-only) |

---

## 3. What the MVP Can Be Used For

The following features are approved for real use during the MVP phase:

- ✅ Login via Microsoft Entra ID
- ✅ Dashboard overview of case metrics
- ✅ Registry import from Excel (supervised, admin/operator present)
- ✅ Case list browsing, searching, and filtering
- ✅ Case detail viewing
- ✅ Case status update
- ✅ Legal officer assignment display
- ✅ Knowledge Library search (read-only)
- ✅ Legal Q&A / RAG (with mandatory verification warning)
- ✅ Issue reporting via template

---

## 4. What Must NOT Be Used Yet

> [!CAUTION]
> The following features are **not approved** for real use. Using them for official purposes may produce incorrect or unvalidated results.

- ❌ DOCX template export for official documents (use for drafts only, manual review required)
- ❌ Records Retention / Archive execution
- ❌ Microsoft Graph / Document Sync
- ❌ Executive Dashboard for official reporting (metrics not validated against live data)
- ❌ Data Quality Cleanup for production corrections
- ❌ Meeting management for official committee proceedings
- ❌ Finalization / Post-meeting workflow for official case closure
- ❌ Dispatch workflow for official notifications
- ❌ Any feature not listed in Section 3 above

---

## 5. Login Procedure

1. Access the system URL provided by the Pilot Coordinator
2. Click **'เข้าสู่ระบบ'** (Login)
3. Authenticate with authorized Microsoft Entra ID credentials
4. Verify your role displays correctly in the top-right corner
5. If login fails, contact the System Operator immediately

> [!NOTE]
> Only pre-authorized Microsoft Entra ID accounts may access the system. Do not attempt to log in with personal accounts.

---

## 6. Dashboard Use

- Review total cases, overdue cases, near-due cases, and draft completions
- Overdue and near-due counts exclude completed and red-number cases
- Do **NOT** use dashboard metrics for official management reporting
- Report any discrepancy immediately

> [!WARNING]
> Dashboard metrics are for internal operational awareness only. They have not been validated for official reporting purposes.

---

## 7. Registry Import Procedure

1. Only **Admin** or **Registry Officer** may import
2. Prepare Excel file matching expected Thai column headers
3. Navigate to **สารบบ > นำเข้าข้อมูล** (Registry > Import)
4. Upload the file and review the preview
5. Verify column mapping is correct
6. Check for duplicate detection warnings
7. Confirm import
8. Review import result summary (imported, skipped, failed counts)
9. Verify imported cases appear correctly in the case list
10. **First import MUST be supervised by the System Operator**

> [!IMPORTANT]
> Always verify duplicate detection warnings before confirming an import. Duplicate records may cause incorrect case counts and dashboard metrics.

---

## 8. Case List Procedure

- Navigate to **รายการคดี** (Cases)
- Use filters: type, completion status, red number status, legal officer
- Completed cases are correctly excluded from overdue lists
- Cases with red numbers (เลขแดง) are treated as completed

---

## 9. Case Detail Procedure

- Click on any case from the case list
- Review all fields: black number, red number, petitioner, respondent, subject, status, due dates, legal officer
- Status badges indicate completion state
- Data quality warnings appear if applicable

---

## 10. Completed/Overdue Rule

A case is treated as **completed** and **NOT** counted as overdue if **ANY** of these conditions is true:

### Status-Based Completion

| Status Value | Meaning |
|-------------|---------|
| `เสร็จสิ้น` | Completed |
| `เสร็จสิ้น (ศาลปกครอง)` | Completed (Administrative Court) |
| `เสร็จสิ้น(ศาลปกครอง)` | Completed (Administrative Court) — no space variant |
| `แล้วเสร็จ` | Finished |
| `ยุติเรื่อง` | Case terminated |
| `จำหน่ายเรื่อง` | Case disposed |
| `ปิดเรื่อง` | Case closed |
| `ปิดคดี` | Case closed (alt) |
| `วินิจฉัยแล้วเสร็จ` | Adjudication completed |

### Red Number–Based Completion

A case is also treated as completed if it has a valid **เลขแดง** (red case number), detected by:

- Digit/digit pattern (e.g., `123/2568`)
- Phrases: `แดงแล้ว`, `ออกเลขแดงแล้ว`, `มีเลขแดงแล้ว`

> [!NOTE]
> Both status-based and red number–based rules are applied. A case matching **any** rule is excluded from overdue and near-due counts.

---

## 11. Legal Q&A Limitation

- Legal Q&A is available for **search and drafting support ONLY**

> [!CAUTION]
> **MANDATORY WARNING**: AI-assisted legal answers are for search and drafting support only. Users **must verify** all legal references, facts, and reasoning against official source documents before relying on the output.

- If no source is found, the system indicates insufficient information
- **Never** treat AI-generated answers as final legal advice
- **Always** verify citations against source documents
- Report any fabricated or incorrect citations **immediately**

---

## 12. DOCX Limitation

- DOCX export produces **DRAFT** documents only
- All exported documents **MUST** be manually reviewed by a responsible legal officer before any official use
- Do **NOT** use DOCX output as official court filings or legal decisions without full human review
- Template-based exports use case data but may contain formatting issues

> [!WARNING]
> DOCX exports are drafts. They must never be submitted as official documents without thorough manual review and approval by a responsible legal officer.

---

## 13. Manual Legal Review Requirement

- **ALL** AI-generated text must be verified by a responsible legal officer
- **ALL** exported documents require manual review before official use
- The system does **NOT** provide legal advice — it provides **drafting support**

---

## 14. Data Privacy Rules

- Do not upload classified or highly sensitive documents outside the agreed scope
- Do not share login credentials
- Do not screenshot or export data outside the secure environment
- Report any data exposure immediately

> [!CAUTION]
> Unauthorized data exposure must be reported to the System Operator and the Pilot Coordinator immediately. This includes accidental sharing, screenshots, or exports.

---

## 15. Issue Reporting Procedure

1. Use the **MVP Issue Report Template** ([docs/MVP_ISSUE_REPORT_TEMPLATE.md](file:///c:/APP/docs/MVP_ISSUE_REPORT_TEMPLATE.md))
2. Fill in all required fields
3. Submit to the System Operator immediately
4. For **Critical** severity issues, also **verbally notify** the operator

---

## 16. Stop-Use Criteria

> [!CAUTION]
> **Stop using the system immediately** and notify the operator if any of the following occurs:

- 🛑 Data appears corrupted or incorrect
- 🛑 Unauthorized access is detected
- 🛑 AI fabricates legal citations
- 🛑 Import creates incorrect records
- 🛑 Dashboard shows materially misleading numbers
- 🛑 System becomes unavailable
- 🛑 Any security concern arises

---

## 17. Daily Operator Checklist

- [ ] Verify system is accessible
- [ ] Check dashboard loads correctly
- [ ] Review any error logs (Vercel dashboard)
- [ ] Check for new issue reports from users
- [ ] Verify case counts match expected data
- [ ] Confirm no unauthorized access attempts
- [ ] Document any anomalies in the daily log

---

*End of SOP — For questions, contact the System Operator or Pilot Coordinator.*
