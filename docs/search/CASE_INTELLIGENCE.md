# Case Intelligence Guide

## Purpose
Case Intelligence provides deterministic insights into data quality, workload distribution, and anomalies within the registry. This feature aids in identifying missing operational fields and ensuring the reliability of case reporting.

## Deterministic Insights
The Intelligence dashboard automatically detects and calculates:
1. **Top Missing Data Fields**: Aggregates counts of missing crucial fields (e.g., received date, petitioner, legal officer).
2. **Workload Concentration**: Summarizes active, unfinished cases assigned to each Legal Officer.
3. **Data Quality Flags**: Points out individual case anomalies directly in the search results table.

## Data Quality Checks
We evaluate each case for the following flags:
- `isOverdue`: Deadline passed and case not completed/no red number.
- `missingImportantFields`: Array of missing fields.
- `hasInconsistentStatus`: Case is marked completed but has no red number.
- `isOldActiveCase`: Case received more than 1 year ago and is still active.

## Similar Case Methodology & Limitations
- **Current Support**: The system uses deterministic search (keywords, type, officer) to group and find cases.
- **AI/Embedding Similarity**: If embedding-based search is used, it operates via the Legal Knowledge (RAG) system. It calculates semantic similarity across vector chunks.
- **Limitations**:
  - What the system DOES do: Highlights cases with semantically similar subjects or parties.
  - What the system DOES NOT do: It **does not decide legal precedent** or generate final legal conclusions. AI-suggested similarities must be vetted by a human.

## Human Review Requirement
All insights, anomalies, and potential similar cases flagged by this module are *aides for operations*. They require human review. Only authorized commissioners or legal officers may make final determinations on workload reassignment or case precedent.
