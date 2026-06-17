import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/requireApiPermission";
import { getArchiveExecutionEnvironmentStatus } from "@/lib/records-retention/archiveEnvironmentGate";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiPermission("PREVIEW_ARCHIVE");

    const status = getArchiveExecutionEnvironmentStatus();

    return NextResponse.json(status);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    console.error("Archive environment status error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
