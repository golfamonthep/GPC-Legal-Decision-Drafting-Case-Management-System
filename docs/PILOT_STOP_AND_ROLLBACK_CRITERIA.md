# Pilot Stop and Rollback Criteria

## 1. Stop Pilot Immediately If:
1. **Data Corruption**: Data corruption is detected in the Staging database.
2. **Data Leakage**: Sensitive production data is exposed in the Staging environment.
3. **Security Breach**: Unauthorized access or privilege escalation is detected.
4. **AI Hallucination Risk**: Legal Q&A fabricates sources in a way that may mislead users (and guardrails fail).
5. **Import Failure**: Registry import creates incorrect case records at scale (e.g., mapping errors).
6. **Dashboard Errors**: Dashboard materially misleads management decisions.
7. **Export Errors**: DOCX output creates materially incorrect official documents.
8. **Instability**: Build/deployment instability prevents users from accessing the system.
9. **Workflow Blocked**: Users cannot complete core workflows (e.g., cannot update status).
10. **Critical Security**: A critical zero-day security vulnerability is discovered in dependencies (e.g., Next.js, Prisma, NextAuth).

## 2. Who Can Stop the Pilot
- Pilot Coordinator
- System Operator
- Product Owner / Admin

## 3. How to Communicate Stop Decision
- Immediate alert in the designated Pilot communication channel.
- System Admin temporarily suspends Entra ID Pilot Group access.

## 4. What Data to Preserve
- Do not immediately wipe the database.
- Take a snapshot/backup of the Staging database to preserve the state for debugging.
- Export all application and serverless function logs.

## 5. What Logs to Collect
- Vercel function error logs.
- NextAuth authentication error logs.
- Database query logs leading up to the failure.
- Pilot Issue Reports submitted by users.

## 6. How to Resume After Fixes
1. Development team isolates the bug using the preserved logs and database snapshot.
2. Fix is implemented, tested locally, and deployed to Staging.
3. If data was corrupted, the Staging database is rolled back to the last known good state.
4. Pilot Coordinator verifies the fix.
5. Access is restored to the Pilot group.
6. A communication is sent to users explaining the outage, the fix, and any lost work they need to redo.
