# Microsoft Graph / OneDrive / SharePoint Integration

## Purpose
This document outlines the foundation for integrating Microsoft OneDrive and SharePoint into the GPC Case Management System. The integration will allow official case documents, attachments, and exported DOCX drafts to be safely stored in the organization's official Microsoft 365 environment rather than directly in the PostgreSQL database as binary blobs.

Currently, the foundation is laid out (schema, UI placeholders, and safe API endpoints), but actual file uploads are restricted until Microsoft Entra ID authentication is fully implemented.

## Environment Variables Required
The following variables must be added to `.env` to enable the integration. **Do not commit these values to version control.**

```env
MICROSOFT_TENANT_ID=your-tenant-id
MICROSOFT_CLIENT_ID=your-app-client-id
MICROSOFT_CLIENT_SECRET=your-app-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/auth/callback/microsoft
MICROSOFT_GRAPH_BASE_URL=https://graph.microsoft.com/v1.0
MICROSOFT_SHAREPOINT_SITE_ID=your-site-id
MICROSOFT_SHAREPOINT_DRIVE_ID=your-drive-id
MICROSOFT_CASE_ROOT_FOLDER_ID=your-root-folder-id
```

## Microsoft Entra App Registration Checklist
When setting up the integration in Azure Portal, complete these steps:
1. Register a new application in Microsoft Entra ID.
2. Add a web platform with the appropriate Redirect URI.
3. Generate a Client Secret and save it securely.
4. Grant API Permissions (Microsoft Graph):
   - `Files.ReadWrite.All`
   - `Sites.ReadWrite.All`
   - `User.Read`
5. Grant Admin Consent for the tenant.

## Recommended SharePoint Folder Structure
To organize documents systematically, we recommend the following structure:
```text
กพคตร/
  ├── สำนวน/
  │   ├── ร้องทุกข์/
  │   │   └── {เรื่องดำ}-{ชื่อย่อผู้ร้อง}/
  │   └── อุทธรณ์/
  │       └── {เรื่องดำ}-{ชื่อย่อผู้อุทธรณ์}/
  ├── คำวินิจฉัย/
  │   ├── ร่าง/
  │   └── ลงนามแล้ว/
  └── เอกสารอ้างอิงกฎหมาย/
```

## Security Cautions
- **Never commit `.env` files.**
- **Never commit Microsoft client secrets.**
- **Never store real official case documents in the repository.**
- **Never upload files to user-provided arbitrary paths.**
- Validate all URLs before linking them to a case.

## Current Limitations
- UI only allows linking metadata (URLs).
- Binary file upload is disabled with a `501 Not Implemented` error.
- OAuth token acquisition flow is stubbed.

## Future Steps
1. Implement NextAuth or MSAL for Microsoft Entra ID authentication.
2. Replace stubs in `src/lib/microsoft/graphClient.ts` with real token acquisition.
3. Enable binary upload functions in `src/lib/documents/documentStorage.ts`.
4. Update the UI to show an upload dropzone when the user is authenticated.
