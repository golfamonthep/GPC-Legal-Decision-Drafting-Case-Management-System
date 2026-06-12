import { NextRequest, NextResponse } from "next/server";
import { generateDecisionDocx } from "@/lib/export/decisionDocxExport";

// Note: In Next.js App Router, dynamic params are a Promise in Next.js 15+
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const caseId = resolvedParams.id;

    if (!caseId) {
      return NextResponse.json({ error: "ไม่พบรหัสสำนวน (caseId missing)" }, { status: 400 });
    }

    // Mock userId or retrieve from auth context when implemented
    const userId = "mock-user-id";

    const { buffer, filename } = await generateDecisionDocx(caseId, userId);

    // Ensure we send filename properly encoded in Content-Disposition
    const encodedFilename = encodeURIComponent(filename);

    return new Response(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error: any) {
    console.error("DOCX Export Error:", error);
    
    // Allow only explicit safe error messages, otherwise fallback to generic
    const safeMessages = [
      "ไม่พบสำนวนที่ต้องการส่งออก",
      "ยังไม่มีร่างคำวินิจฉัยสำหรับสำนวนนี้"
    ];
    
    let errorMessage = "ไม่สามารถส่งออกไฟล์ DOCX ได้ กรุณาลองใหม่อีกครั้ง";
    if (error.message && safeMessages.includes(error.message)) {
      errorMessage = error.message;
    }
    
    // We shouldn't return a 500 error page, we return a JSON so the client can handle it,
    // or if the client is doing a direct navigation, returning text is safer than stack trace.
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
