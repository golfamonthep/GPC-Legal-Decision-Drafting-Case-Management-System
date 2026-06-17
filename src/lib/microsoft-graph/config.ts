export interface GraphSyncConfig {
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  authority?: string;
  scopes: string[];
  defaultSiteId?: string;
  defaultDriveId?: string;
  allowLiveSync: boolean;
}

export interface GraphSyncStatus {
  configured: boolean;
  enabled: boolean;
  missingKeys: string[];
  liveSyncAvailable: boolean;
  message: string;
}

export function getMicrosoftGraphSyncConfig(): GraphSyncConfig {
  return {
    tenantId: process.env.MICROSOFT_GRAPH_TENANT_ID,
    clientId: process.env.MICROSOFT_GRAPH_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_GRAPH_CLIENT_SECRET,
    authority: process.env.MICROSOFT_GRAPH_AUTHORITY,
    scopes: process.env.MICROSOFT_GRAPH_SCOPES ? process.env.MICROSOFT_GRAPH_SCOPES.split(',') : ['https://graph.microsoft.com/.default'],
    defaultSiteId: process.env.MICROSOFT_GRAPH_DEFAULT_SITE_ID,
    defaultDriveId: process.env.MICROSOFT_GRAPH_DEFAULT_DRIVE_ID,
    allowLiveSync: process.env.ALLOW_MICROSOFT_GRAPH_SYNC === 'true',
  };
}

export function getMicrosoftGraphConfigStatus(): GraphSyncStatus {
  const config = getMicrosoftGraphSyncConfig();
  const missingKeys: string[] = [];

  if (!config.tenantId) missingKeys.push('MICROSOFT_GRAPH_TENANT_ID');
  if (!config.clientId) missingKeys.push('MICROSOFT_GRAPH_CLIENT_ID');
  if (!config.clientSecret) missingKeys.push('MICROSOFT_GRAPH_CLIENT_SECRET');

  const configured = missingKeys.length === 0;
  const enabled = config.allowLiveSync;

  let message = 'การเชื่อมต่อ Microsoft Graph ยังไม่สมบูรณ์';
  if (configured && !enabled) {
    message = 'ตั้งค่าการเชื่อมต่อแล้ว แต่ฟังก์ชันใช้งานจริง (Live Sync) ยังถูกปิดใช้งาน (โหมดทดสอบแบบ Mock เท่านั้น)';
  } else if (configured && enabled) {
    message = 'พร้อมใช้งาน: โหมดซิงค์จริงเปิดใช้งานแล้ว';
  }

  return {
    configured,
    enabled,
    missingKeys,
    liveSyncAvailable: configured && enabled,
    message,
  };
}
