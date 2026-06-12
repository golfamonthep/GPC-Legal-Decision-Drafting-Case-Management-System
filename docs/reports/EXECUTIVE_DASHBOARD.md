# Executive Dashboard and Reporting Pack

## Purpose
The Executive Dashboard provides a high-level overview of the ก.พ.ค.ตร. system's operations, focusing on case workloads, deadline risks, and overall system usage (AI and exports). This dashboard is designed for management and leadership to quickly identify bottlenecks and make data-driven decisions without exposing sensitive personal case data.

## Access and Permissions
- **Required Permission:** `VIEW_EXECUTIVE_DASHBOARD`
- **Export Permission:** `EXPORT_EXECUTIVE_REPORT`
- **Default Roles:** `ADMIN` and `COMMISSIONER`
- *Note:* `LEGAL_OFFICER`, `REGISTRY_OFFICER`, and `VIEWER` do not have access by default but can be granted access if organizational policy permits.

## Metric Definitions and Calculation Rules

### Case Status Grouping
- **In Progress:** Any case that is not considered "Completed" or "Red Numbered".
- **Completed:** Cases with statuses such as "เสร็จสิ้น", "เสร็จสิ้น (ศาลปกครอง)", "ยุติเรื่อง", "จำหน่ายเรื่อง", "ปิดเรื่อง".
- **Red Numbered:** Cases that have been assigned a valid red number (เลขแดง).

### Deadline Risk (Overdue & Due Soon)
- Overdue calculations **exclude** Completed cases and cases that have a Red Number.
- Risks are categorized into: Overdue (เกินกำหนด), <30 days, <60 days, <90 days, <120 days, and <240 days.

### Workload and Trends
- Workload is aggregated by Legal Officer and Committee Owner, showing their total cases, in-progress cases, completed cases, and overdue counts.
- Completion trends are aggregated by month based on the `receivedDate` or `createdAt` fields.

### Data Quality Rules
- The report flags data anomalies such as missing black/red numbers, missing petitioner/respondent names, missing legal officers, and missing received dates.
- It also flags logical errors, e.g., a case having a red number but its status not being marked as completed.

### AI & Export Usage
- Tracks the number of total AI queries and Section AI drafts generated.
- Tracks the number of successful DOCX exports (via Audit Logs).

## How to Export the Report
Users with the `EXPORT_EXECUTIVE_REPORT` permission can click the **"ดาวน์โหลดสรุป CSV"** (Download CSV Summary) button on the top right of the dashboard.
The exported CSV contains only aggregated metrics to prevent the exposure of PII (Personally Identifiable Information).

> [!WARNING]
> **Confidentiality Notice:** Although the dashboard mostly shows aggregated numbers, it does list individual Legal Officer workloads. Ensure that this data is used strictly for internal management purposes. Do not share the dashboard or export file in public forums.
