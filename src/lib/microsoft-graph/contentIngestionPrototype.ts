import { QuarantineCandidate } from './contentQuarantine';

export async function runContentIngestionPreview() {
  // Safe mock for previewing what would be ingested and quarantined
  // In a real implementation, this would list files from Microsoft Graph
  
  const mockCandidates: QuarantineCandidate[] = [
    {
      externalItemKeyHash: 'hash-pdf-001',
      safeDisplayName: 'BLOCKED_UNSUPPORTED_001.pdf',
      extension: '.pdf',
      mimeType: 'application/pdf',
      sizeBytes: BigInt(204800),
      quarantineReason: 'UNSUPPORTED_FILE_TYPE',
    },
    {
      externalItemKeyHash: 'hash-zip-001',
      safeDisplayName: 'BLOCKED_ARCHIVE_001.zip',
      extension: '.zip',
      mimeType: 'application/zip',
      sizeBytes: BigInt(5120000),
      quarantineReason: 'ARCHIVE_BLOCKED',
    },
    {
      externalItemKeyHash: 'hash-bin-001',
      safeDisplayName: 'BLOCKED_UNKNOWN_001.bin',
      extension: '.bin',
      mimeType: 'application/octet-stream',
      sizeBytes: BigInt(1024),
      quarantineReason: 'UNKNOWN_SENSITIVITY',
    }
  ];

  return {
    success: true,
    totalSeen: 5,
    wouldIngest: 2, // Imagine 2 allowed txt/md files
    wouldQuarantine: 3,
    quarantineCandidates: mockCandidates,
  };
}

export async function runContentIngestionPrototype(input: any, actor: any) {
  // Prototype is explicitly BLOCKED from execution
  // We return a safe NO-OP response
  return {
    success: false,
    error: 'Execution is blocked pending Prompt 67 design gate completion.',
    prototypeRunId: null,
    totalSeen: 0,
    ingestedCount: 0,
    quarantinedCount: 0,
    documentCreated: false,
    ragIndexed: false,
    microsoftWriteback: false,
    unsupportedContentDownloaded: false,
  };
}

export async function listContentIngestionRuns() {
  return {
    success: true,
    runs: [] // Mock empty runs list
  };
}
