# Archive First Production Run Checklist

**Status: Future-use only**

This checklist applies to the very first time archive execution is enabled in the production environment.

## Execution Constraints
* [ ] Limit first run to **1–3 low-risk closed cases**.
* [ ] Do not include any sensitive/high-profile cases.
* [ ] Do not perform bulk archiving operations (batch size > 3).

## Operational Steps
* [ ] Verify the operator and a technical observer are both present.
* [ ] Perform a **dry-run** via the Preview UI before attempting execution.
* [ ] Review the dry-run output and confirm expected eligibility limits.
* [ ] Proceed to execution with a documented reason and correct confirmation phrase.
* [ ] **Audit Check**: Immediately query the `AuditLog` and `ArchiveBatch` tables after execution. Verify the logs are accurately recorded.
* [ ] Stop all further archiving immediately upon detecting the first anomaly or error.
