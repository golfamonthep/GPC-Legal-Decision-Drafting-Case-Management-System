# Microsoft Graph Live Auth Readiness Report

**Date**: 2026-06-18
**Prompt**: 63

## Current Foundation Status
- **Foundation**: Prompt 62 mock-only foundation exists.
- **Endpoints**: `/api/document-sync/microsoft/status` and `/api/document-sync/microsoft/preview` are present, fail-closed, and do not expose secrets.
- **UI**: Mock UI is present at `/document-sync`.
- **Database**: No document sync DB mutation exists. No real document content is downloaded.

## Staging-Only Live Connectivity Allowance
- **Allowed**: NO (Blocked). Staging-only live connectivity is currently BLOCKED pending owner confirmation.

## Production Live Sync
- **Status**: DISABLED. Production Microsoft Graph sync remains explicitly disabled and blocked.

## Required Azure App Registration Settings
To proceed with live connectivity when unblocked, the Azure App Registration must be configured with:
- Client ID and Tenant ID generated.
- Client secret generated.
- API Permissions granted based on the permission plan.
- Admin consent granted if using application permissions.

## Required Vercel Preview/Staging Env Vars
- `MICROSOFT_GRAPH_TENANT_ID`
- `MICROSOFT_GRAPH_CLIENT_ID`
- `MICROSOFT_GRAPH_CLIENT_SECRET`
- `MICROSOFT_GRAPH_DEFAULT_SITE_ID`
- `MICROSOFT_GRAPH_DEFAULT_DRIVE_ID`
- `MICROSOFT_GRAPH_TEST_FOLDER_ITEM_ID`
- `ALLOW_MICROSOFT_GRAPH_LIVE_TEST`
- `ALLOW_MICROSOFT_GRAPH_SYNC`

## Required Test SharePoint/OneDrive Location
- A safe test folder containing ONLY fake/test documents must be identified and configured via `MICROSOFT_GRAPH_TEST_FOLDER_ITEM_ID`.

## Connectivity Test Status
- **Status**: NOT IMPLEMENTED / BLOCKED. Endpoints remain mock-only and fail-closed.

## Blockers
- Owner confirmation of safe staging DB and test Azure App registration is required.

## GO/NO-GO for Live Staging Connectivity
- **Decision**: NO-GO (Blocked)

---

## Prompt 63 Owner Confirmation Gate

**Required confirmations:**

1. Microsoft App Registration is for staging/test use or approved for staging test.
2. Graph credentials are stored only in Vercel Preview/Staging env vars or local ignored `.env.local`.
3. No Graph client secret is committed.
4. Production environment does not have `ALLOW_MICROSOFT_GRAPH_LIVE_TEST=YES`.
5. Preview/Staging environment has `ALLOW_MICROSOFT_GRAPH_LIVE_TEST=YES`.
6. Preview/Staging environment has `ALLOW_MICROSOFT_GRAPH_SYNC` unset or set to disabled unless explicitly needed for future prompt.
7. Test SharePoint/OneDrive folder contains fake/safe test documents only.
8. Test folder does not contain confidential legal/case records.
9. The app has least-privilege Graph permissions.
10. Admin consent is granted only as appropriate for staging test.

**Decision:**
* BLOCKED

**Action Taken:**
Due to missing owner confirmation, live Graph calls have not been implemented. Endpoints remain fail-closed. All token acquisition and live connectivity operations are blocked. Auth client choice (`@azure/msal-node`) is documented but not installed.
