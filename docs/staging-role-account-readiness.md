# Staging Role Account Readiness

**Prompt**: 50B  
**Date**: 2026-06-17  
**Status**: BLOCKED — Accounts cannot be created until staging DB is confirmed non-production

---

## Overview

Pilot workflow testing requires test user accounts for each role. These accounts will be created by the pilot seed script (`scripts/seed-pilot-data.ts`) when real seed is executed against the confirmed non-production staging database.

**No credentials are stored in this file. No real emails are used. All accounts use `@example.test` domain.**

---

## Role Account Readiness Table

| Role Label | Seed Email | DB Role | Account Exists in Staging? | Creation Method | Test Status | Notes |
|------------|------------|---------|---------------------------|-----------------|-------------|-------|
| UAT_ADMIN | `uat-admin@example.test` | `ADMIN` | ❌ UNKNOWN — staging not seeded | Auto-created by seed script | ❌ BLOCKED | Seed required first |
| UAT_CASE_MANAGER | `uat-case-manager@example.test` | `REGISTRY_OFFICER` | ❌ UNKNOWN | Auto-created by seed script | ❌ BLOCKED | Seed required first |
| UAT_DRAFTER | `uat-drafter@example.test` | `LEGAL_OFFICER` | ❌ UNKNOWN | Auto-created by seed script | ❌ BLOCKED | Seed required first |
| UAT_REVIEWER | `uat-reviewer@example.test` | `COMMISSIONER` | ❌ UNKNOWN | Auto-created by seed script | ❌ BLOCKED | Seed required first |
| UAT_DISPATCH | (not in seed script) | `REGISTRY_OFFICER` | ❌ NOT SEEDED | Manual admin UI after seed | ❌ BLOCKED | Dispatch role maps to REGISTRY_OFFICER; use UAT_CASE_MANAGER |
| UAT_EXECUTIVE | (not in seed script) | `COMMISSIONER` | ❌ NOT SEEDED | Manual admin UI after seed | ❌ BLOCKED | Executive role maps to COMMISSIONER; use UAT_REVIEWER |
| UAT_VIEWER | `uat-viewer@example.test` | `VIEWER` | ❌ UNKNOWN | Auto-created by seed script | ❌ BLOCKED | Seed required first |

---

## Authentication Note

The system uses **Microsoft Entra ID (Azure AD)** OAuth for login. This means:

1. Test accounts created in the DB (`@example.test`) **cannot log in via OAuth** unless:
   - They exist in the Azure AD tenant, OR
   - The system is configured with credential-based auth for testing (not currently implemented)

2. **Implication for pilot testing**: UAT accounts seeded into the DB will exist as User records, but cannot authenticate via Azure AD unless real Microsoft accounts are used and mapped to those roles.

3. **Workaround options** (owner decision required):
   - Option A: Use real staff Microsoft accounts (with `@your-domain`) and assign them the appropriate role via the admin UI after staging DB is ready
   - Option B: Implement a development-only credential provider in NextAuth for staging (not recommended for production code)
   - Option C: Have real staff members log in during the pilot test session and have admin assign pilot roles before testing

4. **Current status**: This is a known gap. Live authenticated pilot workflow tests require real Microsoft accounts with the correct roles assigned in the staging DB.

---

## Role Mapping (System Roles vs. Pilot Labels)

| Pilot Label | System Role | Core Capabilities |
|-------------|-------------|-------------------|
| UAT_ADMIN | ADMIN | All permissions |
| UAT_CASE_MANAGER | REGISTRY_OFFICER | Case registration, import, meetings, dispatch |
| UAT_DRAFTER | LEGAL_OFFICER | Drafting, AI assistant, finalization, dispatch |
| UAT_REVIEWER | COMMISSIONER | Read access, executive reports, approve knowledge reuse |
| UAT_DISPATCH | REGISTRY_OFFICER | Dispatch workflow (same as case manager role) |
| UAT_EXECUTIVE | COMMISSIONER | Executive dashboard (same as reviewer role) |
| UAT_VIEWER | VIEWER | Read-only access to dashboard, cases, documents |

---

## Account Creation Blockers

| Blocker | Resolution |
|---------|-----------|
| Staging DB not confirmed non-production | Owner must confirm (see `docs/vercel-preview-env-checklist.md`) |
| Seed script not executed yet | Run after staging DB confirmed |
| Azure AD authentication constraint | Owner must decide: use real staff accounts or a bypass strategy |
| UAT_DISPATCH and UAT_EXECUTIVE not in seed script | Add manually via admin UI or extend seed script after staging is confirmed |

---

## Actions Required

1. Owner confirms staging DB is non-production
2. Agent runs pilot seed → creates 5 base accounts
3. Owner assigns roles to real Microsoft accounts via `/admin/users` for authenticated testing
4. OR: Owner approves extending seed script with UAT_DISPATCH and UAT_EXECUTIVE entries

---

*Last updated: Prompt 50B (2026-06-17)*
*Update when staging DB is confirmed and accounts are created.*
