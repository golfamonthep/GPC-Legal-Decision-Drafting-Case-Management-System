import { NextResponse } from 'next/server';
import { searchChunks, SearchOptions } from '@/lib/rag/retrieval/searchChunks';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';

export async function POST(request: Request) {
  try {
    await requireApiPermission('USE_AI_REVIEW');

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
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Retrieval error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
