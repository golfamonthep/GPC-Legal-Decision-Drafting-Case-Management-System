# Microsoft Graph Permission Plan

**Date**: 2026-06-17
**Prompt**: 62

## Recommended App Permissions

The following permissions are required for the Microsoft Graph document sync feature. These are designed to be safe and consistent with the existing `PERMISSIONS` model.

1. **VIEW_DOCUMENT_SYNC**
   * Description: Allows the user to view the document sync status page and overall sync health.

2. **MANAGE_DOCUMENT_SYNC**
   * Description: Allows the user to configure future sync sources and run future manual syncs.

3. **PREVIEW_DOCUMENT_SYNC**
   * Description: Allows the user to run future dry-run metadata previews without mutating the database or pulling content.

4. **VIEW_SYNC_AUDIT**
   * Description: Allows the user to view sync audit logs and execution results.

## Role Mapping

The permissions map to existing roles as follows:

* **ADMIN**: All permissions (`VIEW_DOCUMENT_SYNC`, `MANAGE_DOCUMENT_SYNC`, `PREVIEW_DOCUMENT_SYNC`, `VIEW_SYNC_AUDIT`)
* **COMMISSIONER**: `VIEW_DOCUMENT_SYNC`, `PREVIEW_DOCUMENT_SYNC`, `VIEW_SYNC_AUDIT`
* **LEGAL_OFFICER**: No manage permission by default, except what might be required per case. Initially only `VIEW_DOCUMENT_SYNC`.
* **REGISTRY_OFFICER**: `VIEW_DOCUMENT_SYNC`, `PREVIEW_DOCUMENT_SYNC`, `VIEW_SYNC_AUDIT`, `MANAGE_DOCUMENT_SYNC` (depending on policy).
* **VIEWER**: `VIEW_DOCUMENT_SYNC` only if policy allows.
