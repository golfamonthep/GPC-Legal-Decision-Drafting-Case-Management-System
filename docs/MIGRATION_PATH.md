# Migration Path: Mock Data to Database

This document outlines the phased approach to migrate the GPC-Legal-Decision-System from the current static mock data to a live PostgreSQL database using Prisma.

## Phase 1: Preparation (Current State)
- Prisma installed and configured.
- Database schemas defined in `prisma/schema.prisma`.
- Application continues to run perfectly using the static mock data found in `src/lib/data` and `src/types`.

## Phase 2: Database Provisioning and Seeding
1. Set up a PostgreSQL database (locally via Docker or managed service).
2. Create the tables by running `npx prisma migrate dev`.
3. Create a seed script (`prisma/seed.ts`) that reads the static arrays from `src/lib/data/mockData.ts` (or similar) and inserts them into the database.
4. Run `npx prisma db seed` to populate the initial database.

## Phase 3: Incremental Replacement
We will replace data fetching component by component to ensure stability:
1. **Case Registry Table**: Update the `app/registry/page.tsx` (and related data fetchers) to query `db.case.findMany()` instead of the mock array.
2. **Case Detail View**: Update `app/workspace/[id]/page.tsx` to fetch `db.case.findUnique()`.
3. **Drafting Tools**: Update the draft saving mechanisms to insert/update `DecisionDraft` and `DecisionDraftSection` records.
4. **Knowledge Library**: Update legal sources queries.

*During this phase, some components will use Prisma while others still rely on mock data.*

## Phase 4: Cleanup
1. Once all components are wired to the database, delete the mock data files.
2. Remove any leftover types in `src/types/index.ts` that have been superseded by Prisma-generated types (`@prisma/client`).
3. Conduct end-to-end testing to ensure all CRUD operations behave as expected.
