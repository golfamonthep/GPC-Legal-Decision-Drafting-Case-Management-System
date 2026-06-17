# Pilot Workflow Checklist

## End-to-end Pilot Checks

| Check Item | Actor Role | Route | Expected Result | Data Used | Pass/Fail | Notes |
|------------|------------|-------|-----------------|-----------|-----------|-------|
| 1. Login & Role Access | Any Pilot User | `/login` | Successful login and correct role mapping | Pilot Users | | |
| 2. Case Registry View | REGISTRY_OFFICER | `/cases`, `/registry` | Pilot cases visible with `PILOT-` prefix | `PILOT-CASE-*` | | |
| 3. Case Detail Access | LEGAL_OFFICER | `/cases/[id]` | Details load without error | `PILOT-CASE-001` | | |
| 4. Case Assignment | REGISTRY_OFFICER | `/assignments` | Can assign case to LEGAL_OFFICER | `PILOT-CASE-001` | | |
| 5. Draft Creation/Edit | LEGAL_OFFICER | `/cases/[id]/draft` | Draft opens, text can be added | `PILOT-CASE-002` | | |
| 6. Citation Check | LEGAL_OFFICER | `/cases/[id]/draft` | Check citations UI renders | `PILOT-CASE-002` | | |
| 7. Legal Wording Review | LEGAL_OFFICER | `/cases/[id]/draft` | Wording review AI triggers | `PILOT-CASE-002` | | |
| 8. Finalization | LEGAL_OFFICER | `/finalization` | Final DOCX export works | `PILOT-CASE-004` | | |
| 9. Dispatch | REGISTRY_OFFICER | `/dispatch` | Case transitions to closed/dispatched | `PILOT-CASE-004` | | |
| 10. Meeting Agenda | REGISTRY_OFFICER | `/meetings/[id]` | Can add case to meeting | `PILOT-CASE-007` | | |
| 11. Search / Export | VIEWER | `/search` | Pilot cases found via search | `PILOT-CASE-*` | | |
| 12. Executive Dashboard | COMMISSIONER | `/executive` | Stats include pilot cases | `PILOT-CASE-*` | | |
| 13. Data Quality | REGISTRY_OFFICER | `/data-quality` | Issues (if any) show for pilot cases | `PILOT-CASE-006` | | |
| 14. Library / RAG | LEGAL_OFFICER | `/library`, `/rag` | Library loads | Reference doc | | |
| 15. Admin / System Health | ADMIN | `/admin/system` | System health ok, no errors | N/A | | |
| 16. Maintenance Actions | ADMIN | `/admin/system` | Can view dry-run actions safely | N/A | | |
| 17. Audit Log Review | ADMIN | `/admin/system` | Seed and actions logged | `PILOT_SEED_EXECUTED` | | |
| 18. Rollback / Cleanup | ADMIN | Database direct | Pilot data safely removed via manual queries | All pilot data | | |

## Dry-Run Status
Dry-run executed successfully. Real mutation was avoided. Real preview/staging seed validation is pending explicit approval.
