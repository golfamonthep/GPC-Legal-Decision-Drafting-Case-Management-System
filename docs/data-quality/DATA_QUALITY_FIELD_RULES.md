# Data Quality Field Rules

This document outlines the specific validation rules and thresholds used by the system to dynamically detect data quality issues in `Case` records.

## 1. Required vs Optional Fields

### Required Fields
If any of these fields are missing, empty, or set to a placeholder like "-", a `HIGH` or `CRITICAL` issue is flagged:
- **`blackNumber`**: (HIGH) Must not be empty. Essential for identifying the case.
- **`petitionerName`**: (HIGH) Must not be empty or "-".
- **`subject`**: (HIGH) Must not be empty or "-".
- **`currentStatus`**: (HIGH) Must not be empty.

### Important Fields (Conditional)
- **`respondentName`**: (MEDIUM) Should be present for most cases.
- **`legalOfficerId` / `legalOfficerName`**: (MEDIUM) Should be assigned so the case is actively managed.
- **`ownerId`**: (MEDIUM) A Commissioner should be assigned to the case.
- **`receivedDate`**: (HIGH) Required if the case is not yet closed.

## 2. Red Case Number Logic (`redNumber`)

The presence of a `redNumber` explicitly indicates that a case has been completed or finalized.
- **Rule A (CRITICAL)**: If a case has a `redNumber` but `currentStatus` does not indicate completion (e.g., status is "อยู่ระหว่างดำเนินการ" but red number is "แดง 1/2567"), an issue is raised. Action: Update status to "เสร็จสิ้น".
- **Rule B (CRITICAL)**: If `currentStatus` indicates completion (e.g., "เสร็จสิ้น") but `redNumber` is empty, an issue is raised. Action: Input the corresponding red case number.
- **Rule C (CRITICAL)**: If `currentStatus` explicitly contains text like "แดงแล้ว" but `redNumber` is empty, an issue is raised.

## 3. Completed Status Logic

A case is considered "Completed" (isClosedOrRedCase) if `currentStatus` contains:
- "เสร็จสิ้น"
- "แดง"
- "ยุติเรื่อง"
- "จำหน่าย"
- "ถอนเรื่อง"
- "ไม่รับอุทธรณ์" / "ไม่รับคำร้องทุกข์"

## 4. Date Quality Rules

- **Meeting Date vs Received Date**: (HIGH) If `meetingDate` is strictly before `receivedDate`, it flags a logical error. Meetings cannot occur before a case is officially received.
- **Overdue vs Received Date**: If the calculated `dueDate` is entirely disconnected from `receivedDate` (e.g., received in 2024 but due in 2021), it requires manual verification.

## 5. Duplicate Detection Rules

Duplicates are currently detected based on exact matches to prevent false positives:
- **Duplicate Black Number**: (CRITICAL) If two cases share the exact same `blackNumber` (ignoring leading/trailing whitespace), both are flagged.
- **Duplicate Red Number**: (CRITICAL) If two cases share the exact same `redNumber` (ignoring whitespace), both are flagged.
*(Future enhancement: Fuzzy matching on Petitioner Name + Subject + Received Date)*

## 6. Workflow Risks

- **Old Active Cases**: (HIGH) If a case's `receivedDate` is older than 365 days AND the case is not completed, it is flagged as a workflow risk requiring an update.
- **Missing Event History**: (MEDIUM) If a case has no entries in `CaseEvent`, it implies the case was imported but never processed or touched by a user.
