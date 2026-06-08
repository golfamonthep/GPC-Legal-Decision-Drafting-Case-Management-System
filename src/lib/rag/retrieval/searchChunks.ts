import { Prisma } from '@/generated/prisma';
import prisma from '@/lib/db';
import { createEmbedding } from '@/lib/openai/client';

export type SearchMode = "keyword" | "vector" | "hybrid";

export interface SearchFilters {
  caseType?: string;
  legalCategory?: string;
  issueTags?: string[];
  sourceType?: string;
  sourceStatus?: string; // default 'ใช้งาน'
  reliabilityLevels?: string[]; // default ['official', 'internal']
  year?: number;
  decisionResult?: string;
}

export interface RetrievalResultItem {
  chunkId: string;
  sourceTitle: string;
  sourceType: string;
  content: string;
  similarityScore?: number;
  keywordScore?: number;
  combinedScore?: number;
  sourceStatus: string;
  reliabilityLevel: string;
  citationMetadata: any;
}

export interface SearchOptions {
  query: string;
  mode: SearchMode;
  filters?: SearchFilters;
  topK?: number;
  userId?: string;
  queryId?: string; // Add queryId
}

export async function searchChunks(options: SearchOptions): Promise<RetrievalResultItem[]> {
  const { query, mode, filters = {}, topK = 8, userId, queryId } = options;
  
  const sourceStatus = filters.sourceStatus || "ใช้งาน";
  const reliabilityLevels = filters.reliabilityLevels && filters.reliabilityLevels.length > 0 
    ? filters.reliabilityLevels 
    : ["official", "internal"];

  // 1. Log query if queryId not provided
  let retrievalQueryId = queryId;
  if (!retrievalQueryId) {
    const retrievalQuery = await prisma.retrievalQuery.create({
      data: {
        queryText: query,
        userId: userId || null,
      }
    });
    retrievalQueryId = retrievalQuery.id;
  }

  // 2. Build where conditions
  const conditions: Prisma.Sql[] = [];
  
  conditions.push(Prisma.sql`c."sourceStatus" = ${sourceStatus}`);
  
  if (reliabilityLevels.length > 0) {
    conditions.push(Prisma.sql`c."reliabilityLevel" = ANY(ARRAY[${Prisma.join(reliabilityLevels)}]::text[])`);
  }
  
  if (filters.legalCategory) {
    conditions.push(Prisma.sql`c."legalCategory" = ${filters.legalCategory}`);
  }
  if (filters.sourceType) {
    conditions.push(Prisma.sql`c."sourceType" = ${filters.sourceType}`);
  }
  if (filters.decisionResult) {
    conditions.push(Prisma.sql`c."decisionResult" = ${filters.decisionResult}`);
  }
  if (filters.issueTags && filters.issueTags.length > 0) {
    conditions.push(Prisma.sql`c."issueTags" && ARRAY[${Prisma.join(filters.issueTags)}]::text[]`);
  }
  
  if (filters.caseType) {
    conditions.push(Prisma.sql`s."caseType" = ${filters.caseType}`);
  }
  if (filters.year) {
    conditions.push(Prisma.sql`s."year" = ${filters.year}`);
  }

  const whereClause = conditions.length > 0 
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` 
    : Prisma.empty;

  // 3. Get query embedding if vector/hybrid
  let embedding: number[] | null = null;
  if (mode === "vector" || mode === "hybrid") {
    embedding = await createEmbedding(query);
  }
  const vectorStr = embedding ? `[${embedding.join(",")}]` : null;

  // 4. Execute search
  let results: any[] = [];

  if (mode === "vector" && vectorStr) {
    results = await prisma.$queryRaw`
      SELECT 
        c.id as "chunkId",
        s.title as "sourceTitle",
        c."sourceType" as "sourceType",
        c.content as content,
        1 - (c.embedding <=> ${vectorStr}::vector) as "similarityScore",
        0 as "keywordScore",
        1 - (c.embedding <=> ${vectorStr}::vector) as "combinedScore",
        c."sourceStatus" as "sourceStatus",
        c."reliabilityLevel" as "reliabilityLevel",
        s."referenceNumber" as "referenceNumber"
      FROM "DocumentChunk" c
      JOIN "LegalSource" s ON c."legalSourceId" = s.id
      ${whereClause}
      AND c.embedding IS NOT NULL
      ORDER BY c.embedding <=> ${vectorStr}::vector
      LIMIT ${topK}
    `;
  } else if (mode === "keyword") {
    results = await prisma.$queryRaw`
      SELECT 
        c.id as "chunkId",
        s.title as "sourceTitle",
        c."sourceType" as "sourceType",
        c.content as content,
        0 as "similarityScore",
        ts_rank(to_tsvector('simple', c.content), plainto_tsquery('simple', ${query})) as "keywordScore",
        ts_rank(to_tsvector('simple', c.content), plainto_tsquery('simple', ${query})) as "combinedScore",
        c."sourceStatus" as "sourceStatus",
        c."reliabilityLevel" as "reliabilityLevel",
        s."referenceNumber" as "referenceNumber"
      FROM "DocumentChunk" c
      JOIN "LegalSource" s ON c."legalSourceId" = s.id
      ${whereClause}
      AND to_tsvector('simple', c.content) @@ plainto_tsquery('simple', ${query})
      ORDER BY "keywordScore" DESC
      LIMIT ${topK}
    `;
  } else if (mode === "hybrid" && vectorStr) {
    results = await prisma.$queryRaw`
      WITH vector_search AS (
        SELECT c.id, 1 - (c.embedding <=> ${vectorStr}::vector) as score
        FROM "DocumentChunk" c
        JOIN "LegalSource" s ON c."legalSourceId" = s.id
        ${whereClause}
        AND c.embedding IS NOT NULL
        ORDER BY c.embedding <=> ${vectorStr}::vector
        LIMIT 100
      ),
      keyword_search AS (
        SELECT c.id, ts_rank(to_tsvector('simple', c.content), plainto_tsquery('simple', ${query})) as score
        FROM "DocumentChunk" c
        JOIN "LegalSource" s ON c."legalSourceId" = s.id
        ${whereClause}
        AND to_tsvector('simple', c.content) @@ plainto_tsquery('simple', ${query})
        ORDER BY score DESC
        LIMIT 100
      )
      SELECT 
        c.id as "chunkId",
        s.title as "sourceTitle",
        c."sourceType" as "sourceType",
        c.content as content,
        COALESCE(v.score, 0) as "similarityScore",
        COALESCE(k.score, 0) as "keywordScore",
        (COALESCE(v.score, 0) * 0.7 + COALESCE(k.score, 0) * 0.3) as "combinedScore",
        c."sourceStatus" as "sourceStatus",
        c."reliabilityLevel" as "reliabilityLevel",
        s."referenceNumber" as "referenceNumber"
      FROM "DocumentChunk" c
      JOIN "LegalSource" s ON c."legalSourceId" = s.id
      LEFT JOIN vector_search v ON c.id = v.id
      LEFT JOIN keyword_search k ON c.id = k.id
      WHERE v.id IS NOT NULL OR k.id IS NOT NULL
      ORDER BY "combinedScore" DESC
      LIMIT ${topK}
    `;
  }

  // 5. Save results to log
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    await prisma.retrievalResult.create({
      data: {
        queryId: retrievalQueryId,
        chunkId: r.chunkId,
        score: r.combinedScore,
        rank: i + 1,
      }
    });
  }

  // 6. Return formatted
  return results.map(r => ({
    chunkId: r.chunkId,
    sourceTitle: r.sourceTitle,
    sourceType: r.sourceType,
    content: r.content,
    similarityScore: r.similarityScore,
    keywordScore: r.keywordScore,
    combinedScore: r.combinedScore,
    sourceStatus: r.sourceStatus,
    reliabilityLevel: r.reliabilityLevel,
    citationMetadata: {
      referenceNumber: r.referenceNumber
    }
  }));
}
