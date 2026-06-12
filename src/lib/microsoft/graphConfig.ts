export interface GraphConfig {
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  baseUrl: string;
  siteId?: string;
  driveId?: string;
  caseRootFolderId?: string;
}

export interface GraphIntegrationStatus {
  isConfigured: boolean;
  missingKeys: string[];
  mode: 'disabled' | 'config_ready' | 'auth_required' | 'ready';
  message: string;
}

export function getGraphConfig(): GraphConfig {
  return {
    tenantId: process.env.MICROSOFT_TENANT_ID,
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    redirectUri: process.env.MICROSOFT_REDIRECT_URI,
    baseUrl: process.env.MICROSOFT_GRAPH_BASE_URL || 'https://graph.microsoft.com/v1.0',
    siteId: process.env.MICROSOFT_SHAREPOINT_SITE_ID,
    driveId: process.env.MICROSOFT_SHAREPOINT_DRIVE_ID,
    caseRootFolderId: process.env.MICROSOFT_CASE_ROOT_FOLDER_ID,
  };
}

export function checkGraphIntegrationStatus(): GraphIntegrationStatus {
  const config = getGraphConfig();
  const missingKeys: string[] = [];

  if (!config.tenantId) missingKeys.push('MICROSOFT_TENANT_ID');
  if (!config.clientId) missingKeys.push('MICROSOFT_CLIENT_ID');
  if (!config.clientSecret) missingKeys.push('MICROSOFT_CLIENT_SECRET');
  if (!config.siteId) missingKeys.push('MICROSOFT_SHAREPOINT_SITE_ID');
  if (!config.driveId) missingKeys.push('MICROSOFT_SHAREPOINT_DRIVE_ID');

  const isConfigured = missingKeys.length === 0;
  
  if (!isConfigured) {
    return {
      isConfigured: false,
      missingKeys,
      mode: 'disabled',
      message: 'ยังไม่ได้ตั้งค่า Microsoft Graph สำหรับจัดเก็บไฟล์',
    };
  }

  // Assuming config is fully provided, in the future this mode might change based on token status
  return {
    isConfigured: true,
    missingKeys: [],
    mode: 'auth_required', // Changed from config_ready since real upload requires auth token
    message: 'ระบบพร้อมสำหรับการเชื่อมโยงเอกสาร (อัปโหลดรอยืนยันสิทธิ์)',
  };
}
