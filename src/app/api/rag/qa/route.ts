import { NextResponse } from 'next/server';
import { generateLegalAnswer, GenerateQaOptions } from '@/lib/ai/legalQa';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, mode, filters, topK, userId } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const options: GenerateQaOptions = {
      query,
      mode: mode || "hybrid",
      filters,
      topK: topK || 5,
      userId
    };

    const result = await generateLegalAnswer(options);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("QA error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
