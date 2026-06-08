export interface IngestionInput {
  sourceId: string;
  documentType: string;
  fileUrl?: string;
  metadata?: Record<string, any>;
}

export interface ParsedDocument {
  title?: string;
  content: string;
  pageNumber?: number;
  sectionName?: string;
  paragraphNumber?: number;
}

export interface ChunkingResult {
  chunkIndex: number;
  title?: string;
  content: string;
  normalizedContent: string;
  pageNumber?: number;
  sectionName?: string;
  paragraphNumber?: number;
}

export interface RetrievalRequest {
  query: string;
  topK?: number;
  filters?: {
    sourceType?: string;
    legalCategory?: string;
    issueTags?: string[];
  };
}

export interface RetrievalHit {
  chunkId: string;
  content: string;
  score: number;
  rank: number;
  metadata: Record<string, any>;
}

export interface CitationReference {
  answerSpanId: string;
  chunkId: string;
  chunkContent: string;
}

export interface GroundedAnswer {
  queryId: string;
  answerText: string;
  citations: CitationReference[];
}
