"use server";

import { createMvpSession, validateMvpAccessCode } from "@/lib/auth/mvp-auth";
import { redirect } from "next/navigation";

export async function loginWithMvpCode(formData: FormData) {
  const code = formData.get("code") as string;
  if (!code || !validateMvpAccessCode(code)) {
    return { error: "รหัสเข้าใช้งานไม่ถูกต้อง" };
  }
  
  await createMvpSession();
  redirect("/dashboard");
}
