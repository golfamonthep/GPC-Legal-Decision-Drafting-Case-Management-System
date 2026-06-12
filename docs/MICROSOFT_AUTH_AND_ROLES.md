# Microsoft Authentication and Role-Based Access Control

## Overview
This system uses Microsoft Entra ID (formerly Azure AD) via `next-auth` to securely manage user authentication and role-based permissions without exposing secrets to the client.

## 1. Microsoft Entra App Registration Checklist
1. Go to [Azure Portal > Microsoft Entra ID](https://portal.azure.com/).
2. **App registrations** > **New registration**.
3. Set the application name (e.g., "GPC Legal Decision System").
4. Select "Accounts in this organizational directory only (Single tenant)" or multitenant depending on organization requirements.
5. In **Redirect URI**, select **Web** and enter `http://localhost:3000/api/auth/callback/azure-ad` (update with production domain).
6. Click **Register**.
7. Navigate to **Certificates & secrets** > **New client secret**. Save the secret value immediately (it will be hidden later).
8. Note the **Application (client) ID** and **Directory (tenant) ID** from the Overview page.

## 2. Environment Variables
Add the following to your `.env` file. **Never commit `.env` files.**

```env
# Authentication
AUTH_SECRET=your-random-32-byte-secret # Generate using `openssl rand -hex 32`
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
AUTH_ALLOW_FIRST_ADMIN_BOOTSTRAP=true
MICROSOFT_ENTRA_ID_ALLOWED_DOMAIN=your-organization.go.th

# Microsoft Entra ID Credentials
MICROSOFT_ENTRA_ID_TENANT_ID=your-tenant-id
MICROSOFT_ENTRA_ID_CLIENT_ID=your-client-id
MICROSOFT_ENTRA_ID_CLIENT_SECRET=your-client-secret
```

## 3. First Admin Bootstrap Process
By default, the system prevents unauthorized users from assigning roles. To set up the first administrator:
1. Ensure `AUTH_ALLOW_FIRST_ADMIN_BOOTSTRAP=true` is set in the `.env` file.
2. Sign in with the intended admin's Microsoft account.
3. The system will detect that no users exist and will automatically assign the `ADMIN` role with an `ACTIVE` status.
4. **Important**: After the first admin is successfully created, it is highly recommended to set `AUTH_ALLOW_FIRST_ADMIN_BOOTSTRAP=false` in production.

## 4. Role Definitions
The system supports the following roles:
- **ADMIN** (ผู้ดูแลระบบ): Full access to all features, including user management.
- **COMMISSIONER** (กรรมการ): Can view cases, review drafts, and export documents. Cannot edit facts or import data.
- **LEGAL_OFFICER** (นิติกร): Can view cases, manage drafts, use AI tools, and link documents.
- **REGISTRY_OFFICER** (เจ้าหน้าที่ธุรการ): Can view cases, import registry Excel data, and link documents.
- **VIEWER** (ผู้ใช้งานทั่วไป): Read-only access to cases and documents.

New users who sign in for the first time (after the initial bootstrap) are created as `VIEWER` with a `PENDING` status. An `ADMIN` must approve them from the user management page before they can access the system.

## 5. Security & Permission Matrix
Permissions are strictly enforced on the server-side via `requirePermission` (for server components) and `requireApiPermission` (for API routes).

| Permission | ADMIN | COMMISSIONER | LEGAL_OFFICER | REGISTRY_OFFICER | VIEWER |
| :--- | :---: | :---: | :---: | :---: | :---: |
| VIEW_DASHBOARD | ✅ | ✅ | ✅ | ✅ | ✅ |
| VIEW_CASES | ✅ | ✅ | ✅ | ✅ | ✅ |
| VIEW_CASE_DETAIL | ✅ | ✅ | ✅ | ✅ | ✅ |
| EDIT_CASE | ✅ | ❌ | ✅ | ✅ | ❌ |
| IMPORT_REGISTRY | ✅ | ❌ | ❌ | ✅ | ❌ |
| VIEW_DOCUMENTS | ✅ | ✅ | ✅ | ✅ | ✅ |
| LINK_DOCUMENTS | ✅ | ❌ | ✅ | ✅ | ❌ |
| VIEW_DRAFT | ✅ | ✅ | ✅ | ❌ | ✅ |
| EDIT_DRAFT | ✅ | ❌ | ✅ | ❌ | ❌ |
| USE_AI_DRAFT | ✅ | ❌ | ✅ | ❌ | ❌ |
| USE_AI_REVIEW | ✅ | ✅ | ✅ | ❌ | ❌ |
| EXPORT_DOCX | ✅ | ✅ | ✅ | ❌ | ❌ |
| MANAGE_USERS | ✅ | ❌ | ❌ | ❌ | ❌ |

## 6. User Management
The user management page (`/admin/users`) is accessible only to `ADMIN`.
- Allows changing user roles and statuses.
- Prevents the demotion or disabling of the last remaining `ADMIN` to prevent system lockout.
- All role and status changes are recorded in the `AuditLog`.

## 7. Development Mock Mode
For local development without a Microsoft account, you can enable mock authentication by setting `AUTH_DEV_MOCK_USER=true` in `.env`.
**This MUST NOT be enabled in production environments.**
