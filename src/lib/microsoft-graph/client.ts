import { getMicrosoftGraphConfigStatus } from './config';

export function assertGraphSyncEnabled() {
  const status = getMicrosoftGraphConfigStatus();
  if (!status.liveSyncAvailable) {
    throw new Error('Graph sync is not fully configured or live sync is explicitly disabled.');
  }
}

export async function createGraphClient() {
  assertGraphSyncEnabled();
  throw new Error('Not implemented: Live Graph Client is intentionally disabled for Prompt 62.');
}
