"use server";

import { embedLegalSource, embedPendingChunks } from "@/lib/openai/client";
import { revalidatePath } from "next/cache";

export async function generateSourceEmbeddings(legalSourceId: string, userId: string = "system") {
  try {
    const count = await embedLegalSource(legalSourceId, userId);
    revalidatePath(`/library/${legalSourceId}/chunks`);
    return { success: true, count };
  } catch (error: any) {
    console.error("Failed to generate source embeddings:", error);
    return { success: false, error: error.message };
  }
}

export async function generateAllMissingEmbeddings(userId: string = "system") {
  try {
    const count = await embedPendingChunks(userId);
    revalidatePath("/library");
    return { success: true, count };
  } catch (error: any) {
    console.error("Failed to generate missing embeddings:", error);
    return { success: false, error: error.message };
  }
}
