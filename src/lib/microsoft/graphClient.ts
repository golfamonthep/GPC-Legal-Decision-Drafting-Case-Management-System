import { checkGraphIntegrationStatus, getGraphConfig } from './graphConfig';

/**
 * Foundation for Microsoft Graph client requests.
 * Currently implemented as a safe placeholder until full Entra ID (OAuth) authentication is added.
 */
export async function getGraphAccessToken(): Promise<string> {
  const status = checkGraphIntegrationStatus();
  
  if (!status.isConfigured) {
    throw new Error('Graph integration is not configured. Missing keys: ' + status.missingKeys.join(', '));
  }

  // TODO: Implement Microsoft Entra ID (OAuth 2.0) client credentials or auth code flow
  // For now, return a placeholder token to allow architecture to compile
  // In production, this should NEVER expose or mock a real token if not authenticated
  throw new Error('Not implemented: Access token acquisition requires Microsoft Entra app registration.');
}

export async function fetchFromGraph(endpoint: string, options: RequestInit = {}): Promise<any> {
  // Prevent arbitrary outgoing requests if not configured
  const status = checkGraphIntegrationStatus();
  if (!status.isConfigured) {
    throw new Error(status.message);
  }

  const config = getGraphConfig();
  const url = `${config.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Safe guard: Do not execute fetch until OAuth is implemented
  console.warn(`[GraphClient] Stub request to: ${url}`);
  throw new Error('Not implemented: Microsoft Graph requests are disabled until authentication is ready.');
}
