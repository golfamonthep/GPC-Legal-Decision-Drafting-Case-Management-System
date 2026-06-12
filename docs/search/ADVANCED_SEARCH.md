# Advanced Search Guide

## Purpose
The Advanced Search module allows authorized users to quickly find cases across the ก.พ.ค.ตร. registry, filter by various workflow criteria, and export aggregate data securely. 

## Who Can Use
Access is governed by the `ADVANCED_CASE_SEARCH` permission.
- **Allowed Roles**: ADMIN, COMMISSIONER, LEGAL_OFFICER, REGISTRY_OFFICER, VIEWER (read-only for search).
- **Exporting**: Requires the `EXPORT_SEARCH_RESULTS` permission.

## Search Fields
- **Keyword Search**: Performs a case-insensitive, full-text style match across multiple case fields (Black number, Red number, Petitioner, Counterparty, Subject, Legal Officer name, proceeding notes, and decision result).
- **Type**: Filter by "ร้องทุกข์" or "อุทธรณ์".
- **Status**: Filter by current status.
- **Quick Presets**: Pre-built filters for common queries.

## Filter Definitions & Presets
We provide safe built-in presets:
- `unfinished`: Cases whose status is not in the "completed" category.
- `no_officer`: Cases lacking an assigned Legal Officer.
- `has_red_unfinished`: Cases with a red number but status is not completed.
- `completed_no_red`: Cases marked as completed but lacking a red number.
- `has_draft`: Cases containing at least one draft.
- `no_documents`: Cases without any uploaded or synced documents.

## Overdue / Completed Logic
- **Completed**: Status equals "เสร็จสิ้น", "ปิดเรื่อง", etc.
- **Overdue**: Days until the assigned deadline < 0, AND the case is NOT completed AND has NO red number.
- **Red Number**: The `hasRedCaseNumber` flag uses deterministic parsing to ignore placeholder values like `-` or `ยังไม่ออก`.

## CSV Export Rules
- Export is capped at 5,000 rows to prevent memory exhaustion and large data dumps.
- Returns aggregated or limited metadata only.
- Excludes sensitive fields like raw draft texts and document URLs by default.
- Every export triggers an `ADVANCED_SEARCH_EXPORTED` audit log.

## Privacy Cautions
- Search does not expose draft full texts in the table view to avoid leaking unapproved decisions.
- Do not export and share CSV files containing sensitive PII outside of the secure environment.
- Audit logs capture the user ID, timestamp, and filters used for every search and export.
