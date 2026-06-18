# Microsoft Graph Least-Privilege Permission Checklist

**Date**: 2026-06-18
**Prompt**: 63

This document outlines the recommended Microsoft Graph permission options for future owner review. The final configuration depends on the organization's tenant policy and security boundaries.

## Recommended Approaches

### 1. Safer Approach: Selected Sites Application Permission (Preferred)
This approach restricts the application to specific SharePoint sites rather than the entire tenant.

*   **Permission Type**: Application
*   **Scopes**: `Sites.Selected`
*   **Why Needed**: Allows read/write access ONLY to the specific SharePoint site configured with the `Sites.Selected` permission via Graph API.
*   **Risk Level**: Low. The app cannot access any other site in the tenant.
*   **Admin Consent Required**: Yes
*   **Staging vs. Prod**: Suitable for both. In staging, it should only be granted access to the test site.
*   **Approval Status**: [ ] Pending Review
*   **Owner / Date**: ____________________

### 2. Alternative Approach: Read-Only Broad Permission (Staging Only)
If `Sites.Selected` cannot be configured, this broad read-only permission can be used strictly for staging tests, provided tenant policy allows it.

*   **Permission Type**: Application
*   **Scopes**: `Sites.Read.All`, `Files.Read.All`
*   **Why Needed**: Allows reading metadata and downloading files from any SharePoint site or OneDrive in the tenant.
*   **Risk Level**: High. The app can read all files across the tenant.
*   **Admin Consent Required**: Yes
*   **Staging vs. Prod**: **Staging Only**. Do not use in production unless absolutely necessary and approved by security.
*   **Approval Status**: [ ] Pending Review
*   **Owner / Date**: ____________________

## Permissions to Avoid

The following permissions are strictly prohibited and must NOT be granted unless explicitly required by a future, fully-vetted feature design:

*   **Write Permissions**: Any generic write permission.
*   **Delete Permissions**: Any generic delete permission.
*   **Broad Read/Write**: `Sites.ReadWrite.All`, `Files.ReadWrite.All`
*   **Directory-Wide Scopes**: `Directory.ReadWrite.All`, etc.

*Note: Application permissions run as a background service. Delegated permissions require a signed-in user, which is not suitable for background sync tasks but might be used if the sync only happens interactively.*
