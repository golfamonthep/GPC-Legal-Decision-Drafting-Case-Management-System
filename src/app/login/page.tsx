"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { Scale } from "lucide-react";
import { loginWithMvpCredentials } from "./actions";
import { OWNER_NAME, OWNER_ORG_TH, OWNER_PHOTO, OWNER_ROLE } from "@/lib/owner";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [authMode, setAuthMode] = useState("loading");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mvpError, setMvpError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/mode", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        const mode = String(data?.mode || "misconfigured");
        setAuthMode(mode);
        if (mode === "none") window.location.href = callbackUrl;
      })
      .catch(() => setAuthMode("misconfigured"));
  }, [callbackUrl]);

  let errorMessage = mvpError;
  if (!errorMessage) {
    if (error === "AccessDenied") {
      errorMessage = "คุณไม่ได้รับสิทธิ์เข้าถึง หรือบัญชีของคุณถูกระงับ/รอการอนุมัติ";
    } else if (error) {
      errorMessage = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง";
    }
  }

  const handleSimpleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMvpError("");

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const result = await loginWithMvpCredentials(formData);
      if (result?.error) {
        setMvpError(result.error);
        setIsLoading(false);
      }
    } catch {
      // A successful Next.js server-action redirect is implemented as a thrown response.
    }
  };

  const isSimpleMode = authMode === "simple";
  const isMicrosoftMode = authMode === "microsoft";
  const isMisconfigured = authMode === "misconfigured";

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#0a0a0c] px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-full border border-white/15 bg-[#991b1b] shadow-[0_14px_34px_-10px_rgba(153,27,27,0.65)]">
          <Image
            src={OWNER_PHOTO}
            alt={`${OWNER_NAME} ${OWNER_ROLE}`}
            fill
            sizes="128px"
            priority
            className="scale-[1.45] object-cover object-[50%_18%]"
          />
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#121215] px-3.5 py-1 text-[11px] font-medium text-zinc-300">
          <Scale className="h-3.5 w-3.5 text-[#dc2626]" aria-hidden="true" />
          <span>{OWNER_ORG_TH}</span>
        </div>
        <h1 className="mt-3 text-center text-2xl font-bold leading-9 tracking-tight text-white">
          {OWNER_NAME} {OWNER_ROLE}
        </h1>
        <p className="mt-1 text-center text-xs font-medium text-zinc-400">
          ระบบบริหารสำนวนและวิเคราะห์ร่างคำวินิจฉัย
        </p>
        <p className="mt-2 text-center text-sm text-zinc-400">
          {isSimpleMode
            ? "เข้าสู่ระบบด้วยบัญชีภายใน"
            : isMicrosoftMode
              ? "เข้าสู่ระบบด้วยบัญชี Microsoft ของหน่วยงาน"
              : isMisconfigured
                ? "ระบบยังไม่ได้กำหนดค่าการยืนยันตัวตนอย่างปลอดภัย"
                : "กำลังตรวจสอบการตั้งค่าระบบ"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[460px]">
        <div className="rounded-3xl border border-white/[0.08] bg-[#121215] px-6 py-10 shadow-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          {isMisconfigured && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">
              ผู้ดูแลระบบต้องตั้งค่า <code>AUTH_MODE</code> และ secret ที่เกี่ยวข้องใน Vercel ก่อนเปิดใช้งาน
              ระบบปฏิเสธการเข้าถึงแทนการเปิดสิทธิ์ ADMIN อัตโนมัติ
            </div>
          )}

          {isSimpleMode && (
            <form onSubmit={handleSimpleLogin} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold leading-6 text-white">
                  ชื่อผู้ใช้
                </label>
                <div className="mt-2">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    autoFocus
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="block w-full rounded-xl border border-white/10 bg-[#17171b] px-3.5 py-2.5 text-white shadow-sm placeholder:text-zinc-500 focus:border-[#c81e2b] focus:outline-none focus:ring-2 focus:ring-[#c81e2b]/30 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold leading-6 text-white">
                  รหัสผ่าน
                </label>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="block w-full rounded-xl border border-white/10 bg-[#17171b] px-3.5 py-2.5 text-white shadow-sm placeholder:text-zinc-500 focus:border-[#c81e2b] focus:outline-none focus:ring-2 focus:ring-[#c81e2b]/30 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-full bg-gradient-to-b from-[#d62839] to-[#991b1b] px-4 py-3 text-sm font-bold text-white shadow-[0_6px_18px_rgba(185,28,28,0.45)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c81e2b] disabled:opacity-50"
              >
                {isLoading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>
          )}

          {isMicrosoftMode && (
            <button
              onClick={() => signIn("azure-ad", { callbackUrl })}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-b from-[#d62839] to-[#991b1b] px-4 py-3 text-sm font-bold text-white shadow-[0_6px_18px_rgba(185,28,28,0.45)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c81e2b]"
            >
              <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
              </svg>
              เข้าสู่ระบบด้วย Microsoft
            </button>
          )}

          {authMode === "loading" && (
            <p className="text-center text-sm text-zinc-400">กำลังโหลด...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-400">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
