"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auditLog } from "@/lib/audit";

export async function updateCaseStatus(caseId: string, status: string, userId?: string) {
  const previousCase = await prisma.case.findUnique({
    where: { id: caseId },
    select: { currentStatus: true }
  });

  const updatedCase = await prisma.case.update({
    where: { id: caseId },
    data: { currentStatus: status }
  });

  await auditLog({
    userId,
    action: "UPDATE_CASE_STATUS",
    entityType: "Case",
    entityId: caseId,
    beforeValue: previousCase?.currentStatus || "",
    afterValue: status,
  });

  revalidatePath(`/cases/${caseId}`);
  return updatedCase;
}

export async function updateDocumentMetadata(docId: string, title: string, type: string, userId?: string) {
  const previousDoc = await prisma.caseDocument.findUnique({
    where: { id: docId },
  });

  const updatedDoc = await prisma.caseDocument.update({
    where: { id: docId },
    data: { title, type }
  });

  await auditLog({
    userId,
    action: "UPDATE_DOCUMENT_METADATA",
    entityType: "CaseDocument",
    entityId: docId,
    beforeValue: JSON.stringify({ title: previousDoc?.title, type: previousDoc?.type }),
    afterValue: JSON.stringify({ title, type }),
  });

  if (updatedDoc.caseId) {
    revalidatePath(`/cases/${updatedDoc.caseId}`);
  }
  
  return updatedDoc;
}

export async function updateLegalSourceMetadata(
  sourceId: string, 
  data: {
    title?: string;
    documentType?: string;
    referenceNumber?: string;
    year?: number;
    caseType?: string;
    legalCategory?: string;
    issueTags?: string[];
    lawNames?: string[];
    sectionNumbers?: string[];
    decisionResult?: string;
    sourceStatus?: string;
    reliabilityLevel?: string;
    effectiveDate?: Date;
    expiredDate?: Date;
    sourceFileUrl?: string;
  },
  userId?: string
) {
  const previousSource = await prisma.legalSource.findUnique({
    where: { id: sourceId }
  });

  const updatedSource = await prisma.legalSource.update({
    where: { id: sourceId },
    data
  });

  await auditLog({
    userId,
    action: "UPDATE_LEGAL_SOURCE_METADATA",
    entityType: "LegalSource",
    entityId: sourceId,
    beforeValue: JSON.stringify(previousSource),
    afterValue: JSON.stringify(updatedSource),
  });

  revalidatePath(`/library`);
  return updatedSource;
}
