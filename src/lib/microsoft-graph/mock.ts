import { ExternalDocumentMetadata, SyncPreviewResult } from './types';

export async function listMockGraphDocuments(): Promise<SyncPreviewResult> {
  const mockItems: ExternalDocumentMetadata[] = [
    {
      provider: 'MICROSOFT_GRAPH',
      driveId: 'mock-drive-123',
      itemId: 'mock-item-abc-1',
      name: 'คำฟ้องคดีดำที่_123.pdf',
      webUrl: 'https://mock.sharepoint.com/mock-item-abc-1',
      mimeType: 'application/pdf',
      size: 1048576,
      lastModifiedAt: new Date(),
      syncStatus: 'PENDING',
    },
    {
      provider: 'MICROSOFT_GRAPH',
      driveId: 'mock-drive-123',
      itemId: 'mock-item-abc-2',
      name: 'คำสั่งลงโทษทางวินัย_456.docx',
      webUrl: 'https://mock.sharepoint.com/mock-item-abc-2',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 512000,
      lastModifiedAt: new Date(),
      syncStatus: 'PENDING',
    },
  ];

  return {
    dryRun: true,
    source: 'mock',
    liveGraphCall: false,
    foundItems: mockItems,
    totalFound: mockItems.length,
  };
}
