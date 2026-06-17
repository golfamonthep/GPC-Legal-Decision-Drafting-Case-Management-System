# Archive Eligibility Rules

A case must pass all the following rules to be eligible for archiving.

1. **Closed Status**: Case must be closed/finalized or have a red-number/closed status if applicable.
2. **Not Active**: Case must not be active in drafting/review.
3. **No Pending Actions**: Case must not have pending dispatch/follow-up.
4. **Data Quality**: Case must not have unresolved data quality issues.
5. **Legal Hold**: Case must not be flagged for legal hold (`legalHold` = true).
6. **Not in Meeting**: Case must not be part of an active meeting agenda.
7. **Complete Documents**: Case must not have missing required final documents.
8. **Permissions**: The requesting user must pass the `MANAGE_RECORDS_ARCHIVE` permission check.
9. **Policy Review**: Case must pass policy review (`lifecycleStatus` = `READY_TO_ARCHIVE`).
10. **Explicit Selection**: Case must be explicitly selected by the user.

*(Note: Rule 4 regarding specific data quality checks may require schema/supporting workflow enhancement to be fully evaluated programmatically).*
