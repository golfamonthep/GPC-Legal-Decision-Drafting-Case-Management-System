import prisma from '@/lib/db';
import { checkGraphIntegrationStatus } from '../microsoft/graphConfig';
import { auditLog } from '@/lib/audit';

export interface ExternalDocumentMetadata {
  title: string;
  webUrl: string;
  documentCategory: string;
  notes?: string;
  storageProvider?: string;
}

export async function getStorageStatus() {
  return checkGraphIntegrationStatus();
}

export async function listCaseDocuments(caseId: string) {
  return prisma.caseDocument.findMany({
    where: { caseId },
    orderBy: { uploadedAt: 'desc' },
  });
}

export async function linkExternalDocumentToCase(
  caseId: string, 
  metadata: ExternalDocumentMetadata, 
  userId?: string
) {
  // Validate webUrl (very basic check for SharePoint/OneDrive domain)
  if (!metadata.webUrl.includes('sharepoint.com') && !metadata.webUrl.includes('onedrive.live.com')) {
    throw new Error('Invalid URL: ต้องเป็นลิงก์จาก SharePoint หรือ OneDrive เท่านั้น');
  }

  const document = await prisma.caseDocument.create({
    data: {
      caseId,
      title: metadata.title,
      fileUrl: metadata.webUrl, // Use webUrl as fileUrl for linked docs
      type: metadata.documentCategory,
      storageProvider: metadata.storageProvider || 'microsoft_graph',
      webUrl: metadata.webUrl,
      documentCategory: metadata.documentCategory,
      sourceStatus: 'linked',
      uploadedByUserId: userId,
    }
  });

  await auditLog({
    action: 'CASE_DOCUMENT_LINKED',
    entityType: 'CaseDocument',
    entityId: document.id,
    userId,
    afterValue: JSON.stringify({ title: document.title, webUrl: document.webUrl }),
  });

  return document;
}

export async function createCaseFolder(caseId: string) {
  throw new Error('Not implemented: Folder creation requires Microsoft Graph authentication.');
}

export async function uploadCaseDocument(caseId: string, file: Buffer, filename: string) {
  throw new Error('Not implemented: File upload requires Microsoft Graph authentication.');
}

export async function uploadExportedDecisionDocx(caseId: string, file: Buffer, filename: string) {
  throw new Error('Not implemented: DOCX upload requires Microsoft Graph authentication.');
}
