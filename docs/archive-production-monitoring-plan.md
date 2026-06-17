# Archive Production Monitoring Plan

This plan details the monitoring requirements once archive execution is enabled in production.

## Metrics & Signals to Monitor

* **Archive execution attempts**: Track all `POST /api/records-retention/archive/execute` requests.
* **Failed attempts**: Monitor frequency of invalid confirmation phrases, unauthorized access, and bad batch sizes.
* **HTTP Error Codes**: Alert on `401 Unauthorized`, `403 Forbidden`, `409 Conflict` (eligibility mismatch), `423 Locked` (environment block), and `500 Internal Server Error`.
* **Archive without audit**: Alert if an archive state mutation occurs without a corresponding `ArchiveBatch` or `AuditLog` entry.
* **Unexpected production gate behavior**: Alert if execution bypasses `assertArchiveExecutionEnvironment()`.
* **Delete/purge signals**: Monitor for any database `DELETE` commands issued against `Case`, `DecisionDraft`, or `CaseDocument` models.
* **Audit/batch creation**: Verify daily counts of `ArchiveBatchItem` and `AuditLog` mapping to `ARCHIVE_CASE` actions.
* **First-week daily monitoring**: Active daily log reviews and dashboard checks are required for the first 7 days following production enablement.
