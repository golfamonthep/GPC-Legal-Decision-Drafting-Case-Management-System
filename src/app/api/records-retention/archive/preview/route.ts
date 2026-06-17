import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/requireApiPermission";
import { previewArchiveCases } from "@/lib/records-retention/archivePreview";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Permission check inside try-catch, mapping UNAUTHORIZED/FORBIDDEN to 401/403
    await requireApiPermission("MANAGE_RECORDS_ARCHIVE");

    const body = await req.json();
    const { caseIds } = body;

    if (!Array.isArray(caseIds) || caseIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: caseIds must be a non-empty array." },
        { status: 400 }
      );
    }

    // Force dry-run semantics - ignore any execute/archive/delete/purge flags
    const result = await previewArchiveCases(caseIds);

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    
    console.error("Archive preview error:", error);
    return NextResponse.json({ error: "Internal server error during preview." }, { status: 500 });
  }
}
