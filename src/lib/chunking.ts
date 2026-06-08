/**
 * Utility for normalizing Thai legal text and chunking for ingestion.
 */

export function normalizeThaiText(text: string): string {
  if (!text) return "";
  
  // Replace zero-width spaces
  let normalized = text.replace(/\u200B/g, "");
  // Replace multiple spaces with a single space
  normalized = normalized.replace(/ {2,}/g, " ");
  // Trim spaces on each line
  normalized = normalized.split(/\n/).map(line => line.trim()).join('\n');
  // Trim excessive newlines to double newlines
  normalized = normalized.replace(/\n{3,}/g, "\n\n");
  
  return normalized.trim();
}

/**
 * Split text into chunks, respecting paragraphs and avoiding splitting citations.
 * Target length: 700-1200 characters.
 * Overlap: 100-200 characters.
 */
export function chunkLegalText(text: string, maxLen = 1200, minLen = 700, overlap = 150): string[] {
  const normalized = normalizeThaiText(text);
  if (!normalized) return [];

  // Split by paragraph first
  const paragraphs = normalized.split(/\n+/).map(p => p.trim()).filter(p => p.length > 0);
  
  const chunks: string[] = [];
  let currentChunk = "";

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    
    if (currentChunk.length + p.length + 1 <= maxLen) {
      // Add paragraph to current chunk
      currentChunk += (currentChunk ? "\n\n" : "") + p;
    } else {
      // Current chunk is getting too big
      if (currentChunk.length >= minLen) {
        chunks.push(currentChunk);
        
        // Start new chunk with overlap
        // Find the last few paragraphs that fit into the overlap size
        let overlapText = "";
        let overlapIndex = i - 1;
        while (overlapIndex >= 0) {
          const prevP = paragraphs[overlapIndex];
          if (overlapText.length + prevP.length + 1 <= overlap * 1.5) { // generous overlap max
             overlapText = prevP + (overlapText ? "\n\n" : "") + overlapText;
             overlapIndex--;
          } else {
            break;
          }
        }
        
        // If overlapText is empty, just use a portion of the string or the current paragraph will start fresh
        currentChunk = overlapText ? (overlapText + "\n\n" + p) : p;
      } else {
        // If it's below minLen, we just have to keep adding to it even if it exceeds maxLen slightly,
        // because we don't want tiny chunks.
        currentChunk += (currentChunk ? "\n\n" : "") + p;
      }
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}
