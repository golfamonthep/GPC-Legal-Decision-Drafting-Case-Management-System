"use server";

import { createMvpSession, validateMvpCredentials } from "@/lib/auth/mvp-auth";
import { redirect } from "next/navigation";

export async function loginWithMvpCredentials(formData: FormData) {
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");

  if (!validateMvpCredentials(username, password)) {
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  await createMvpSession();
  redirect("/dashboard");
}
