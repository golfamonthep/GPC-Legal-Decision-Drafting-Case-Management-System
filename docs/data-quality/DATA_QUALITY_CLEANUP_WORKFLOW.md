# Data Quality Cleanup Workflow

## Purpose
The Data Quality Cleanup Workflow provides a secure and auditable method for authorized users to identify, review, and correct data anomalies in the system. This is crucial for maintaining accurate dashboard statistics, proper executive reporting, and ensuring no files fall through the cracks after being imported from external registry sources (Excel).

## Roles and Access

- **ADMIN**: Can view, assign, edit, resolve issues, and export reports (`VIEW_DATA_QUALITY`, `CLEANUP_DATA_QUALITY`, `ASSIGN_DATA_QUALITY_ISSUES`, `EXPORT_DATA_QUALITY_REPORT`).
- **LEGAL_OFFICER & REGISTRY_OFFICER**: Can view and clean up data quality issues assigned or accessible to them (`VIEW_DATA_QUALITY`, `CLEANUP_DATA_QUALITY`).
- **COMMISSIONER**: Can view the data quality status for transparency but cannot edit the cases directly from this workflow (`VIEW_DATA_QUALITY`).
- **VIEWER**: No access by default.

## Issue Categories

Issues are detected dynamically and grouped into the following categories:

1. **Missing Fields (MISSING_FIELDS)**: Essential data points like Black Number, Petitioner Name, Respondent Name, Subject, Received Date, Status, or Assigned Officer are missing.
2. **Status Consistency (STATUS_CONSISTENCY)**: The current status text conflicts with the presence or absence of a Red Case Number.
3. **Date Quality (DATE_QUALITY)**: Logical inconsistencies in dates, e.g., meeting date before received date, or invalid values.
4. **Duplicate Risk (DUPLICATE_RISK)**: Detected same Black Number, same Red Number, or highly similar case details indicating a potential duplicate entry.
5. **Workflow Risk (WORKFLOW_RISK)**: Cases that are extremely old without being completed, or imported cases with zero `CaseEvent` history indicating they were never touched.

## Severity Definitions

- **CRITICAL**: Issues that severely impact system integrity or legal tracking, such as duplicate Black/Red numbers, or completed cases missing Red numbers.
- **HIGH**: Missing vital information (e.g., Petitioner, Subject) or severe status inconsistencies (e.g., active case with a red number).
- **MEDIUM**: Missing assignment (no legal officer or committee owner) or cases lacking recent actions.
- **LOW**: Minor formatting issues or missing optional fields.

## Cleanup Workflow

1. **Review**: Authorized users navigate to the "ตรวจคุณภาพข้อมูล" (Data Quality) menu. The page displays summary cards and a paginated list of detected issues.
2. **Quick Fix**: For simple issues (e.g., missing received date, missing status), users can click "แก้ไขด่วน" (Quick Fix) to open an inline form.
3. **Save and Audit**: Submitting a quick fix safely updates the `Case` record and automatically generates an `AuditLog` capturing the `beforeValue` and `afterValue`. A `CaseEvent` is also added if workflow fields (like Status or Owner) change.
4. **Deep Dive**: For complex issues (like duplicates), users should click "เปิดสำนวน" to review the full case details and resolve them appropriately.

## Duplicate Review Rule

- **Never Auto-Merge**: The system will flag duplicates (e.g., same Black Number) but will never auto-merge them. 
- Merging involves deleting records and consolidating documents, which carries a high risk of data loss. Duplicates must be manually verified and processed by an Admin or authorized Registry Officer.

## Status Normalization Rule

- The system detects non-standard status strings (e.g., "เสร็จจสิ้น", "อยู่ระหว่างดำเนินการฯ") and flags them. 
- Authorized users should use the Quick Fix form to manually update the status to standard values (e.g., "เสร็จสิ้น", "อยู่ระหว่างดำเนินการ"). 
- Auto-normalization is disabled to prevent accidental misclassification of nuanced legal statuses.

## What Not To Auto-Fix

- The system must never auto-correct missing dates based on assumptions.
- The system must never auto-assign legal officers.
- The system must never automatically append or generate Red Case Numbers.

## Audit Log Behavior

Every action taken through the Data Quality Cleanup workflow triggers an audit log:
- `DATA_QUALITY_VIEWED`: Recorded when viewing the dashboard (via dashboard API integration or report export).
- `DATA_QUALITY_QUICK_FIX_APPLIED`: Recorded when a user corrects data via the inline form. Includes exact field changes.
- `DATA_QUALITY_REPORT_EXPORTED`: Recorded when a user downloads the CSV report.

## Export Report Behavior

Users with the `EXPORT_DATA_QUALITY_REPORT` permission can download a CSV file containing all detected issues. The export uses standard UTF-8 BOM encoding for Excel compatibility and includes full case identifiers, issue severity, and recommendations.

## Examples

*Synthetic Data Example:*
- **Issue**: "สถานะเสร็จสิ้นแต่ไม่มีเลขเรื่องแดง" (CRITICAL)
- **Scenario**: Case `ร. 123/2567` has status "เสร็จสิ้น" but the Red Number field is empty.
- **Action**: User clicks Quick Fix, inputs "แดง 45/2567", and saves. The issue immediately disappears from the dashboard, and an audit log is created.
