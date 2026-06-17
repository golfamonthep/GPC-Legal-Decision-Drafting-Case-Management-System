import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/requireApiPermission";
import { executeArchiveCases } from "@/lib/records-retention/archiveExecution";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const user = await requireApiPermission("ARCHIVE_CASE");

    const body = await req.json();
    const { caseIds, reason, policyReference, confirmationPhrase } = body;

    if (!Array.isArray(caseIds) || caseIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: caseIds must be a non-empty array." },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: "Invalid request: reason is required." },
        { status: 400 }
      );
    }

    if (!confirmationPhrase) {
      return NextResponse.json(
        { error: "Invalid request: confirmationPhrase is required." },
        { status: 400 }
      );
    }

    const input = {
      caseIds,
      reason,
      policyReference,
      confirmationPhrase,
    };

    const result = await executeArchiveCases(input, { id: user.id, name: user.name });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    if (error.message && error.message.includes("Archive execution blocked")) {
      return NextResponse.json({ error: error.message }, { status: 423 });
    }

    if (error.message && error.message.includes("Batch limit exceeded")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error.message === "Invalid confirmation phrase.") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Archive execution error:", error);
    return NextResponse.json({ error: "Internal server error during archive execution." }, { status: 500 });
  }
}
