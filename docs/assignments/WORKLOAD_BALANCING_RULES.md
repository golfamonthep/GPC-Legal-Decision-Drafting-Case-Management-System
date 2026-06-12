# Workload Balancing Rules

## Overview
To prevent bottlenecks in the case management process, the system actively calculates and monitors the workload of all Legal Officers and Committee Owners based on deterministic rules.

## Definitions
- **Active Workload**: Cases that have not been marked as "Completed" and do not possess a final Red Number.
- **Overdue Workload**: Active cases where the timeline (e.g., 90 days standard, or up to 240 days with extensions) has lapsed.
- **Completed Cases**: Cases with statuses such as "เสร็จสิ้น", "ปิดเรื่อง", or explicitly bearing a valid Red Number. These are strictly excluded from Active Workload calculations.

## Rules & Exclusions
1. **Completed Cases Exclusion**: If a case is completed, it does not count against a user's active workload limit, regardless of its original due date.
2. **Red Number Exclusion**: If a case is assigned a red number (e.g., "15/2569"), it is assumed finalized in the context of urgency and is excluded from active/overdue metrics unless overridden by a manual open status.
3. **Unassigned Cases**: Cases without a legal officer or without a committee owner are grouped explicitly so they can be prioritized for assignment.

## Thresholds
Currently, the system defines the following constants to flag high workloads (these can be configured in `src/lib/assignments/caseAssignment.ts`):
- `HIGH_ACTIVE_WORKLOAD_THRESHOLD` = **20 cases**
- `HIGH_OVERDUE_THRESHOLD` = **5 cases**
- `NEAR_DUE_DAYS` = **15 days**

## Balancing Suggestions
The system provides a basic, deterministic suggestion panel:
- It highlights users with the lowest active workload to assist supervisors in distributing new cases evenly.
- **Limitation**: The system does NOT automatically distribute cases. Human confirmation and reason provision are mandatory for every assignment.
