"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auditLog } from "@/lib/audit";
import { normalizeThaiText, chunkLegalText } from "@/lib/chunking";

export async function ingestLegalSource(legalSourceId: string, userId?: string) {
  // 1. Create a job
  const job = await prisma.documentIngestionJob.create({
    data: {
      legalSourceId,
      status: "QUEUED",
    }
  });

  try {
    // 2. Load LegalSource and clauses
    const source = await prisma.legalSource.findUnique({
      where: { id: legalSourceId },
      include: { clauses: true }
    });

    if (!source) {
      throw new Error("LegalSource not found");
    }

    // Update to PROCESSING
    await prisma.documentIngestionJob.update({
      where: { id: job.id },
      data: { status: "PROCESSING" }
    });

    // Extract text from clauses
    let fullText = "";
    for (const clause of source.clauses) {
      fullText += `${clause.clauseNumber ? clause.clauseNumber + " " : ""}${clause.content}\n\n`;
    }

    if (!fullText.trim()) {
      throw new Error("No text content found in clauses for this Legal Source.");
    }

    // Normalise and chunk
    const normalizedFullText = normalizeThaiText(fullText);
    const chunksText = chunkLegalText(normalizedFullText);

    if (chunksText.length === 0) {
      throw new Error("Failed to generate chunks from the text.");
    }

    // Check if chunks already exist, if so delete them (re-ingest scenario handled safely)
    await prisma.documentChunk.deleteMany({
      where: { legalSourceId }
    });

    // Create chunks
    const chunkRecords = chunksText.map((chunk, index) => ({
      legalSourceId,
      chunkIndex: index + 1,
      content: chunk,
      normalizedContent: normalizeThaiText(chunk),
      sourceType: source.documentType || "Unknown",
      sourceStatus: source.sourceStatus || "ใช้งาน",
      reliabilityLevel: source.reliabilityLevel || "official",
      legalCategory: source.legalCategory || null,
      issueTags: source.issueTags || [],
      lawNames: source.lawNames || [],
      articleNumbers: source.sectionNumbers || [],
      decisionResult: source.decisionResult || null,
      effectiveDate: source.effectiveDate || null,
      expiredDate: source.expiredDate || null,
    }));

    await prisma.documentChunk.createMany({
      data: chunkRecords
    });

    // Mark completed
    await prisma.documentIngestionJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED" }
    });

    await auditLog({
      userId,
      action: "INGEST_LEGAL_SOURCE",
      entityType: "LegalSource",
      entityId: legalSourceId,
      afterValue: `Ingested ${chunkRecords.length} chunks`,
    });

  } catch (error: any) {
    // Mark failed
    await prisma.documentIngestionJob.update({
      where: { id: job.id },
      data: { status: "FAILED", errorMessage: error.message || "Unknown error" }
    });
    throw error;
  }

  revalidatePath(`/library`);
  revalidatePath(`/library/${legalSourceId}/chunks`);
  
  return { success: true };
}

export async function deleteChunks(legalSourceId: string, userId?: string) {
  await prisma.documentChunk.deleteMany({
    where: { legalSourceId }
  });

  await prisma.documentIngestionJob.deleteMany({
    where: { legalSourceId }
  });

  await auditLog({
    userId,
    action: "DELETE_CHUNKS",
    entityType: "LegalSource",
    entityId: legalSourceId,
    afterValue: "Deleted all chunks and ingestion jobs",
  });

  revalidatePath(`/library`);
  revalidatePath(`/library/${legalSourceId}/chunks`);
  
  return { success: true };
}
