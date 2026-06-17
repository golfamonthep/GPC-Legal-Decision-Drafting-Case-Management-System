export interface ExternalDocumentMetadata {
  provider: string;
  driveId?: string;
  itemId: string;
  name: string;
  webUrl?: string;
  eTag?: string;
  mimeType?: string;
  size?: number;
  lastModifiedAt?: Date;
  syncStatus: string;
}

export interface SyncPreviewResult {
  dryRun: boolean;
  source: string;
  liveGraphCall: boolean;
  foundItems: ExternalDocumentMetadata[];
  totalFound: number;
}
