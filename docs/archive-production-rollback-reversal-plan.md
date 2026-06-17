# Archive Production Rollback & Reversal Plan

**Status: Not production-ready**

## Reason for Status
* The reversal endpoint/UI is not implemented and has not been live-tested.
* Staging reversal verification has not been executed.
* Production manual database reversal is strictly prohibited unless separately approved by the owner.

## Immediate Stop Procedures
* **Emergency Stop**: Disable archive execution immediately by removing or setting the archive execution environment flag (`ALLOW_PRODUCTION_ARCHIVE_EXECUTION`) to `NO`.
* **Revoke Permissions**: Temporarily revoke the `EXECUTE_ARCHIVE` (`ARCHIVE_CASE`) permission from all roles via the permission matrix.

## Reversal Plan Constraints
* **Preserve audit/batch records**: Never delete the `ArchiveBatch` or `ArchiveBatchItem` logs during a reversal.
* **No deletion of archive records**: Do not delete `CaseArchiveRecord`.
* **Future Implementation Required**: A formal automated reversal process (API endpoint + UI) must be implemented and tested in staging before the system is considered fully production-ready for reversal.
