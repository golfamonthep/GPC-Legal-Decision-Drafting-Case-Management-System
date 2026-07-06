# Pilot Admin and Operator Guide

## 1. Admin Responsibilities
- Manage user roles and Entra ID mappings.
- Monitor system audit logs for unauthorized access.
- Ensure system configuration aligns with Pilot scope.

## 2. System Operator Responsibilities
- Monitor server and database health (Vercel/Supabase/Postgres).
- Execute manual backups and handle rollbacks if required.
- Triage technical issue reports from users.

## 3. Pre-Pilot Checklist
- [ ] Vercel Preview Database isolated from Production.
- [ ] Entra ID Pilot user group provisioned.
- [ ] All Pilot roles mapped and verified.

## 4. Environment Checklist
- [ ] Staging environment variables configured safely.
- [ ] Logging integrated and active.

## 5. Database Checklist
- [ ] Staging database seeded with valid pilot test cases.
- [ ] Prisma schema validated and synced.

## 6. User Account Checklist
- [ ] Pilot users assigned to correct Entra ID groups.
- [ ] No unauthorized access permitted.

## 7. Role Permission Checklist
- [ ] Verify Admin, Legal Officer, Registry Officer, Commissioner, and Viewer roles function as expected.

## 8. Registry Import Supervision Checklist
- [ ] Monitor first batch of registry imports.
- [ ] Verify data integrity and missing field fallback logic.

## 9. Data Backup Precaution
- [ ] Ensure automated daily backups are enabled for the Staging database before Pilot launch.
- [ ] Test manual restore procedure.

## 10. Error Monitoring Checklist
- [ ] Monitor Vercel Serverless Function logs.
- [ ] Track RAG/Embedding timeout errors.

## 11. Audit Log Review Checklist
- [ ] Weekly review of system audit logs.
- [ ] Check for unusual permission changes or bulk exports.

## 12. Security Checklist
- [ ] Confirm no production data is bleeding into staging.
- [ ] Confirm API routes reject unauthorized POST requests.

## 13. Daily Operating Routine
- Review server logs for critical errors.
- Check database connection stability.

## 14. Weekly Operating Routine
- Collate User Issue Reports.
- Perform audit log review.

## 15. Incident Handling Procedure
- Classify incident severity (Low, Medium, High, Critical).
- Apply workarounds or schedule hotfixes based on priority.

## 16. Rollback or Pilot Stop Procedure
- If data corruption or security breaches occur, execute Stop Criteria.
- Revoke user access temporarily.
- Restore database from last known good backup if necessary.

## 17. What Must Be Escalated Immediately
- Any leakage of production data.
- System-wide crashes blocking all users.
- Unauthorized access attempts.
