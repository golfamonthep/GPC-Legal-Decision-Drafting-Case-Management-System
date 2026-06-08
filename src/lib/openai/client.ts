import OpenAI from "openai";
import prisma from "@/lib/db";
import { auditLog } from "@/lib/audit";

const openai = new OpenAI();
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

/**
 * Creates an embedding for a given text string.
 */
export async function createEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim() === "") {
    throw new Error("Cannot create embedding for empty text");
  }

  // Basic token limit check (approximation: 1 token ~= 4 chars)
  // text-embedding-3-small safe token threshold is 8191
  const maxChars = 8191 * 4;
  if (text.length > maxChars) {
    throw new Error(`Content length exceeds safe token threshold (max approx ${maxChars} chars).`);
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.trim(),
    encoding_format: "float",
  });

  return response.data[0].embedding;
}

/**
 * Generates and saves the embedding for a single document chunk.
 */
export async function embedDocumentChunk(chunkId: string, userId?: string): Promise<void> {
  const chunk = await prisma.documentChunk.findUnique({
    where: { id: chunkId },
    include: { legalSource: true },
  });

  if (!chunk) {
    throw new Error(`DocumentChunk ${chunkId} not found`);
  }

  // Legal safety validations
  if (chunk.sourceStatus !== "ใช้งาน") {
    throw new Error(`Cannot embed chunk. Source status is not 'ใช้งาน'. It is '${chunk.sourceStatus}'.`);
  }
  
  if (chunk.reliabilityLevel !== "official" && chunk.reliabilityLevel !== "internal") {
    throw new Error(`Cannot embed chunk. Reliability level '${chunk.reliabilityLevel}' is not allowed for embedding.`);
  }

  try {
    const embeddingVector = await createEmbedding(chunk.content);

    // Using parameterized raw query for the pgvector insert to avoid SQL injection issues
    // Format vector correctly for PostgreSQL
    const vectorString = `[${embeddingVector.join(",")}]`;

    await prisma.$executeRaw`
      UPDATE "DocumentChunk"
      SET 
        "embedding" = ${vectorString}::vector,
        "embeddingModel" = ${EMBEDDING_MODEL},
        "embeddedAt" = NOW(),
        "embeddingStatus" = 'completed',
        "embeddingError" = NULL
      WHERE "id" = ${chunkId}
    `;

    if (userId) {
      await auditLog({
        userId,
        action: "EMBEDDING_COMPLETED",
        entityType: "DocumentChunk",
        entityId: chunkId,
        afterValue: JSON.stringify({ status: 'completed', model: EMBEDDING_MODEL })
      });
    }
  } catch (error: any) {
    await prisma.documentChunk.update({
      where: { id: chunkId },
      data: {
        embeddingStatus: 'failed',
        embeddingError: error.message || "Unknown error",
        embeddingModel: EMBEDDING_MODEL,
      }
    });

    if (userId) {
      await auditLog({
        userId,
        action: "EMBEDDING_FAILED",
        entityType: "DocumentChunk",
        entityId: chunkId,
        afterValue: JSON.stringify({ error: error.message })
      });
    }

    throw error;
  }
}

/**
 * Embeds all pending chunks for a specific LegalSource.
 */
export async function embedLegalSource(legalSourceId: string, userId?: string): Promise<number> {
  const source = await prisma.legalSource.findUnique({
    where: { id: legalSourceId }
  });

  if (!source) {
    throw new Error("LegalSource not found");
  }

  if (userId) {
    await auditLog({
      userId,
      action: "EMBEDDING_STARTED",
      entityType: "LegalSource",
      entityId: legalSourceId,
    });
  }

  const chunks = await prisma.documentChunk.findMany({
    where: {
      legalSourceId,
      embeddingStatus: { not: "completed" },
    },
    select: { id: true }
  });

  let successCount = 0;

  // Batch process to be rate-limit friendly
  // Process sequentially or in small batches
  for (const chunk of chunks) {
    try {
      await embedDocumentChunk(chunk.id, userId);
      successCount++;
      // Small delay to be friendly to rate limits (e.g. 50ms)
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (e) {
      console.error(`Failed to embed chunk ${chunk.id}`, e);
    }
  }

  if (userId && successCount > 0) {
    await auditLog({
      userId,
      action: "EMBEDDING_COMPLETED",
      entityType: "LegalSource",
      entityId: legalSourceId,
      afterValue: JSON.stringify({ completedChunks: successCount })
    });
  }

  return successCount;
}

/**
 * System-wide function to find and embed all eligible chunks missing embeddings.
 */
export async function embedPendingChunks(userId?: string): Promise<number> {
  const pendingChunks = await prisma.documentChunk.findMany({
    where: {
      embeddingStatus: { not: "completed" },
      sourceStatus: "ใช้งาน",
      reliabilityLevel: { in: ["official", "internal"] }
    },
    select: { id: true }
  });

  let successCount = 0;

  for (const chunk of pendingChunks) {
    try {
      await embedDocumentChunk(chunk.id, userId);
      successCount++;
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (e) {
      console.error(`Failed to embed chunk ${chunk.id}`, e);
    }
  }

  return successCount;
}
