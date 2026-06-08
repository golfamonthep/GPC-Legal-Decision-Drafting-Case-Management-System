import { NextResponse } from 'next/server';
import { searchChunks, SearchOptions } from '@/lib/rag/retrieval/searchChunks';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, mode, filters, topK, userId } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const options: SearchOptions = {
      query,
      mode: mode || "hybrid",
      filters,
      topK: topK || 8,
      userId
    };

    const results = await searchChunks(options);
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Retrieval error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
