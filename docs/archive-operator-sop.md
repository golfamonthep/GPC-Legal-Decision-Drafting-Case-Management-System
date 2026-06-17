# Archive Operator SOP

**Status: Draft / Not approved for production use**

This Standard Operating Procedure (SOP) outlines the process for executing the archive of records.

## Key Principles
* **Archive is not delete**: Archiving only changes the lifecycle status to `ARCHIVED` and preserves all documents and data.
* **No delete/purge**: Destructive operations are strictly prohibited in this workflow.

## Process
1. **Dry-Run Required**: The operator must run the preview/dry-run of the selected case IDs first to verify eligibility and batch impact.
2. **Reason Required**: A formal business or legal reason must be provided for the archive action.
3. **Confirmation Phrase Required**: The exact confirmation phrase must be provided to unlock the execution.
4. **Audit Verification Required**: The operator must verify that an `ArchiveBatch` ID is returned and recorded in the audit trail.

## Limitations
* **First-Run Limitation**: The initial production run must be strictly limited to **1–3 low-risk closed cases** only after formal approval.

## Stop Criteria & Escalation Path
* **Stop**: If the preview step returns unexpected eligibility blocks, or if the API returns 500 errors.
* **Escalate**: Report immediately to the System Administrator or Technical Lead. Do not attempt to bypass validations or rerun the script forcibly.
