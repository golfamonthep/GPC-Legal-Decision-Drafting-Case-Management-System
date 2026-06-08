# Legal RAG Pipeline Architecture Foundation

## Overview
This document outlines the architecture for a controlled Legal Retrieval-Augmented Generation (RAG) pipeline for the GPC-Legal-Decision-Drafting-Case-Management-System. The primary goal is to provide legally safe, highly traceable, and accurate AI answers grounded entirely in approved legal sources.

## Core Principles
1. **Approved Internal Sources Only**: The system will answer and draft *only* from approved internal legal sources (e.g., Supreme Administrative Court decisions, GPC decisions, Official Acts).
2. **No Source = No Answer**: If the relevant information is not found within the retrieved internal sources, the system will decline to answer rather than hallucinating.
3. **Traceability**: Every AI answer must be fully traceable to specific retrieved source chunks via citations.
4. **Human Review Requirement**: All AI-generated drafts or answers must be reviewed and approved by a legal officer before finalization.

## Pipeline Components

### 1. Ingestion Pipeline (`src/lib/rag/ingestion`)
- **Trigger**: New legal documents added to the system via file upload or database entry.
- **Process**: Registers a `DocumentIngestionJob` to track the state of processing (pending, processing, completed, failed).
- **Text Extraction**: Uses robust OCR and text extraction methods tailored to Thai legal documents (often PDFs with complex layouts).

### 2. Chunking Strategy (`src/lib/rag/chunking`)
- **Legal Awareness**: Chunks are aligned to logical legal boundaries (e.g., sections, articles, paragraphs, clauses) rather than arbitrary token lengths whenever possible.
- **Rich Metadata**: Each chunk (`DocumentChunk` model) preserves comprehensive metadata:
  - Source ID, Type, Status, and Reliability Level.
  - Page Number, Section Name, and Paragraph Number.
  - Legal Category, Issue Tags, Law Names, and Article Numbers.
  - Effective and Expired Dates.
- **Normalization**: Text is cleaned and normalized (`normalizedContent`) to improve embedding quality while the original text (`content`) is preserved for display.

### 3. Retrieval Strategy (`src/lib/rag/retrieval`)
- **Hybrid Retrieval**: Will utilize both vector similarity search (via pgvector) and traditional keyword/metadata filtering.
- **Metadata Pre-filtering**: Queries can explicitly filter chunks by legal category, effective dates, or document types before vector search, ensuring highly relevant context.
- **Result Ranking**: The system ranks chunks based on relevance score and logs the query and results (`RetrievalQuery`, `RetrievalResult`) for auditability.

### 4. Citation Strategy (`src/lib/rag/citations`)
- **Grounded Generation**: The LLM will be prompted to insert specific citation markers corresponding to chunk IDs.
- **Verification**: The system will verify that citations exist and accurately reflect the generated text.
- **Storage**: Citations are stored in the database (`LegalAnswerCitation`), linking the generated `LegalAnswer` directly to the `DocumentChunk`s used.

### 5. Quality & Safety Rules (`src/lib/rag/quality`)
- **System Prompting**: Enforces strict adherence to provided context and the "No-source-no-answer" rule.
- **Post-processing**: Validates that no unauthorized external knowledge is included in the final output.
- **Audit Trails**: All queries, retrieved chunks, and generated answers are logged and visible in the dashboard for monitoring.
