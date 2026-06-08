import { NextResponse } from 'next/server';
import { generateDraftSection } from '@/lib/ai/draftSection';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { caseId, draftId, sectionId, sectionType, userInstruction, legalCategory, userId } = body;

    if (!caseId || !draftId || !sectionId || !sectionType || !userInstruction) {
      return NextResponse.json(
        { error: 'Missing required parameters: caseId, draftId, sectionId, sectionType, or userInstruction.' },
        { status: 400 }
      );
    }

    // Attempt to generate the section draft using AI
    const result = await generateDraftSection({
      caseId,
      draftId,
      sectionId,
      sectionType,
      userInstruction,
      userId,
      legalCategory,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error generating AI draft section:', error);
    
    // Provide a descriptive error message specifically for missing context
    if (error.message.includes('No relevant legal sources found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
