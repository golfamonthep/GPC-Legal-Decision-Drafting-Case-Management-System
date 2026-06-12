# Case Assignment Workflow

## Purpose
The Case Assignment Workflow provides a structured mechanism for assigning or reassigning legal cases to responsible officers and committee members. It ensures that all cases are properly tracked and that workload distribution is transparent, without silently overwriting historically imported registry data.

## Roles & Permissions
- **ADMIN**: Can view assignments, manage workloads, and assign/reassign cases.
- **REGISTRY_OFFICER**: Can view assignments and assign/reassign cases (if operational policy permits).
- **COMMISSIONER**: Can view assignments and workload distribution.
- **LEGAL_OFFICER**: Can view assignments and workload distribution.

## Assignment Rules
1. **Legal Officer Assignment**:
   - Cases can be assigned to users with the `LEGAL_OFFICER` or `ADMIN` roles.
   - If the user is not in the system, a free-text name (imported from the registry) can be specified as a fallback.
2. **Committee Owner Assignment**:
   - Cases can be assigned to users with the `COMMISSIONER` or `ADMIN` roles.
   - Similar to Legal Officers, free-text names are supported.
3. **Reassignment**:
   - Reassigning a case requires a mandatory "Reason" for the change.
   - The original imported text names are preserved in the audit log, and the change is explicitly recorded via `CaseEvent` and `AuditLog`.
4. **Bulk Assignment**:
   - Authorized users can select multiple cases and assign them simultaneously.
   - Completed cases or cases with a red number are **skipped by default** unless explicitly included.
   - A reason is required for bulk assignments to ensure full traceability.

## Audit Logging
Every assignment action triggers:
- A `CaseEvent` representing the timeline movement (e.g., "มอบหมายนิติกร", "เปลี่ยนนิติกร").
- An `AuditLog` capturing the previous assignee, the new assignee, the reason, the acting user, and the precise timestamp.

## Safe Data Handling
The system does not automatically reassign cases or run autonomous AI logic to force assignments. All workload suggestions are deterministic and strictly for human review. Imported names from Excel (e.g., `legalOfficerName`) are safely migrated into the display flow without being erased when a formal `userId` is mapped.
