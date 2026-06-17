# Production Archive Release Gate

**Decision: NO-GO**
**Date:** 2026-06-17
**Prompt:** 60

## Reason for NO-GO

Production archive execution must remain disabled because the following prerequisites were not met:
* Staging archive execution with pilot records was not completed.
* Runtime audit verification was not completed with live pilot records.
* Role-based live UAT (authenticated role accounts) was not completed.
* Reversal/rollback was not tested in staging.

## Future Required GO Gates

To change this decision to **GO**, all of the following gates must be passed and verified:

1. **Confirm non-production staging DB**: Ensure Vercel Preview environment is distinctly separate from Production.
2. **Apply schema/migrations to staging safely**: Ensure the staging database is fully up-to-date with migrations.
3. **Seed pilot archive-ready records in staging**: Seed pilot test cases using the approved seed script.
4. **Prepare role accounts**: Assign authenticated Microsoft Entra ID accounts to staging roles.
5. **Execute dry-run preview in staging**: Successfully perform dry-runs against the pilot records.
6. **Execute archive in staging on pilot records**: Verify actual execution on staging environment.
7. **Verify audit record at runtime**: Check `AuditLog` and `ArchiveBatch` records in the staging database post-execution.
8. **Verify previous state preservation**: Ensure `previousStatusBeforeArchive` correctly tracked the previous status.
9. **Verify rollback/reversal path**: Perform a conceptual or actual rollback to ensure no data loss occurs.
10. **Verify production block remains active**: Confirm `getArchiveExecutionEnvironmentStatus` still blocks execution on the production database.
11. **Complete owner approval form**: Ensure business and technical owners sign off on the `archive-production-approval-form.md`.
