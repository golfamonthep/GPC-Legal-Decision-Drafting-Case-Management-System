import { NextResponse } from 'next/server';
import { generateDraftSection } from '@/lib/ai/draftSection';
import { requireApiPermission } from "@/lib/auth/requireApiPermission";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await requireApiPermission("USE_AI_DRAFT");
    const body = await req.json();
    const { caseId, draftId, sectionId, sectionType, userInstruction, legalCategory, userId } = body;

    if (!caseId || !draftId || !sectionId || !sectionType || !userInstruction) {
      return NextResponse.json(
        { error: 'Missing required parameters: caseId, draftId, sectionId, sectionType, or userInstruction.' },
        { status: 400 }
      );
    }

    const result = await generateDraftSection({
      caseId,
      draftId,
      sectionId,
      sectionType,
      userInstruction,
      userId: user.id, // pass user.id to the service
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
