# Microsoft Graph Environment Variable Checklist

**Date**: 2026-06-18
**Prompt**: 63

This checklist contains the required environment variables for Microsoft Graph Document Sync. 
**DO NOT** include real values here. Mark all as future owner-provided secrets.

## Required Variables

* `MICROSOFT_GRAPH_TENANT_ID`
  - Purpose: The Azure AD Tenant ID where the Microsoft Graph app is registered.
  - Required: Yes
  - Security: Secret
* `MICROSOFT_GRAPH_CLIENT_ID`
  - Purpose: The Application (client) ID of the registered Microsoft Graph app.
  - Required: Yes
  - Security: Secret
* `MICROSOFT_GRAPH_CLIENT_SECRET`
  - Purpose: The client secret for authenticating the Microsoft Graph app.
  - Required: Yes
  - Security: Secret
  - Responsibility: The owner is responsible for securely generating, rotating, and managing this secret. It must **never** appear in the browser/client bundle, tracking files, or UI.
* `MICROSOFT_GRAPH_AUTHORITY`
  - Purpose: The authority URL for authentication (e.g., `https://login.microsoftonline.com/TENANT_ID`).
  - Required: Yes
  - Security: Safe
* `MICROSOFT_GRAPH_SCOPES`
  - Purpose: The scopes requested by the app (e.g., `https://graph.microsoft.com/.default`).
  - Required: Yes
  - Security: Safe
* `MICROSOFT_GRAPH_DEFAULT_SITE_ID`
  - Purpose: The default SharePoint Site ID to sync documents from.
  - Required: Optional (depending on setup)
  - Security: Safe
* `MICROSOFT_GRAPH_DEFAULT_DRIVE_ID`
  - Purpose: The default OneDrive/SharePoint Document Library (Drive) ID.
  - Required: Optional (depending on setup)
  - Security: Safe
* `MICROSOFT_GRAPH_TEST_FOLDER_ITEM_ID`
  - Purpose: The specific folder/item ID within SharePoint/OneDrive that contains fake/safe test documents.
  - Required: Yes (for staging live test)
  - Security: Safe
* `ALLOW_MICROSOFT_GRAPH_LIVE_TEST`
  - Purpose: Feature flag to explicitly enable live Microsoft Graph connectivity testing.
  - Required: Yes (for staging live test)
  - Security: Safe
  - Environment: **Preview/Staging ONLY**. Must not be set in Production.
* `ALLOW_MICROSOFT_GRAPH_SYNC`
  - Purpose: Feature flag to explicitly enable live Microsoft Graph document sync.
  - Required: Yes
  - Security: Safe
  - Note: Production live sync must be disabled unless explicitly designed and enabled.
