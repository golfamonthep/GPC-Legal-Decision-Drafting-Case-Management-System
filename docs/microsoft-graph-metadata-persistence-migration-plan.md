# Microsoft Graph Metadata Persistence Migration Plan

**Date**: 2026-06-18
**Prompt**: 65

## 1. Migration Overview
This document outlines the migration plan to add the Microsoft Graph Metadata Persistence models to the PostgreSQL database.

## 2. Migration Generation Status
**Status**: SKIPPED (Database not reachable locally for `prisma migrate dev`).

## 3. Planned Schema Additions
The following elements were added to `prisma/schema.prisma` in an additive manner:

- `ExternalProvider` (Enum)
- `ExternalSourceType` (Enum)
- `ExternalDocumentSyncStatus` (Enum)
- `DocumentSyncRunStatus` (Enum)
- `DocumentSyncRunMode` (Enum)
- `ExternalDocumentSource` (Table)
- `ExternalDocumentItem` (Table)
- `DocumentSyncRun` (Table)
- `DocumentSyncRunItem` (Table)

## 4. Safety Considerations
- **Additive Only**: The schema changes are purely additive.
- **No Destructive Operations**: No tables or columns were dropped.
- **No Data Loss**: The changes do not affect existing tables like `Case` or `User`.
- **Relations**: `ExternalDocumentSource` and `ExternalDocumentItem` have `onDelete: Cascade` and `onDelete: SetNull` internally, but they do not enforce cascade delete on any existing core tables.

## 5. Execution Instructions
Since the local database is not reachable, the migration must be generated and applied manually against a safe dev/staging database:

1. Obtain a safe connection string for a non-production database.
2. Run `npx prisma migrate dev --create-only --name add_microsoft_graph_metadata_persistence`
3. Inspect the generated SQL to ensure it only contains `CREATE TYPE`, `CREATE TABLE`, `CREATE INDEX`, and `ALTER TABLE ADD CONSTRAINT` operations.
4. Run `npx prisma migrate deploy` in staging.
5. Do NOT apply to production until Prompt 65 and staging UAT sign-off.
