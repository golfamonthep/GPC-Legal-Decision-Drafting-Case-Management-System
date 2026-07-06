# Pilot Launch Checklist

## 1. Technical Readiness
- [ ] Vercel Staging Environment is active and stable.
- [ ] Environment variables (Entra ID, Database, OpenAI) are configured for Staging.
- [ ] Build, Typecheck, and Prisma Validation pass without errors.

## 2. Database Readiness
- [ ] Staging Database is completely isolated from Production.
- [ ] Database is seeded with initial test cases and knowledge library documents.
- [ ] Backup schedule is active for Staging.

## 3. User Readiness
- [ ] Entra ID Pilot user group is created.
- [ ] Pilot users have been added to the group.
- [ ] Role mappings in the application match Entra ID group claims.

## 4. Training Readiness
- [ ] Pilot Training Session completed.
- [ ] All users have received the Pilot User SOP.
- [ ] All Legal Officers have received the Legal Q&A Safety Guide.

## 5. Security Readiness
- [ ] API routes enforce authorization (tested).
- [ ] No PII or highly classified real-world data is used unless sanitized or explicitly approved for Staging.

## 6. Permission Readiness
- [ ] Admin cannot view/edit case details unassigned.
- [ ] Viewers cannot edit anything.
- [ ] Registry Officers can only import.
- [ ] Legal Officers can manage cases and use RAG.

## 7. Backup Precaution
- [ ] Operator has verified the ability to manually backup and restore the Staging database.

## 8. Known Limitation Acknowledgment
- [ ] Product Owner acknowledges remaining `any` type linter warnings.
- [ ] Product Owner acknowledges RAG edge case timeout risks.

## 9. Issue Reporting Channel
- [ ] Issue Report Template is accessible to all users.
- [ ] Communication channel (e.g., Teams channel) established for Pilot feedback.

## 10. Pilot Coordinator Assignment
- [ ] Pilot Coordinator is named and communicated to the team.

## 11. Stop Criteria Acknowledgment
- [ ] Pilot Coordinator and System Operator understand the Pilot Stop and Rollback Criteria.

## 12. Go / Conditional Go / No-Go Sign-Off
- **Recommendation**: [Conditional Go]
- **Signed Off By**: ______________________
- **Date**: ______________________
