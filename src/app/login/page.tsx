"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { Scale } from "lucide-react";
import { loginWithMvpCredentials } from "./actions";
import { OWNER_NAME, OWNER_ORG_TH, OWNER_PHOTO_WIDE, OWNER_ROLE } from "@/lib/owner";

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
    <div className="flex min-h-screen flex-col justify-center bg-[#08080a] px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <div className="relative mx-auto aspect-[16/10] w-full max-w-[380px] overflow-hidden rounded-3xl border border-[#4c1d24] bg-[#101014] p-1 shadow-[0_20px_50px_-14px_rgba(153,27,27,0.65)] ring-1 ring-[#be123c]/35">
          <div className="relative h-full w-full overflow-hidden rounded-[1.25rem]">
            <Image
              src={OWNER_PHOTO_WIDE}
              alt={`${OWNER_NAME} ${OWNER_ROLE}`}
              fill
              sizes="380px"
              priority
              className="object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#4c1d24] bg-[radial-gradient(120%_100%_at_50%_100%,rgba(153,27,27,0.38)_0%,rgba(16,16,20,0.95)_80%)] px-3.5 py-1 text-[11px] font-semibold text-[#fda4af]">
          <Scale className="h-3.5 w-3.5 text-[#fb7185]" aria-hidden="true" />
          <span>{OWNER_ORG_TH}</span>
        </div>
        <h1 className="mt-3 text-center text-2xl font-bold leading-9 tracking-tight text-zinc-100">
          {OWNER_NAME} {OWNER_ROLE}
        </h1>
        <p className="mt-1 text-center text-xs font-semibold text-zinc-400">
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

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="rounded-3xl border border-[#3a1d24] bg-[radial-gradient(130%_110%_at_50%_105%,rgba(153,27,27,0.34)_0%,rgba(16,16,20,0.98)_70%)] px-6 py-10 shadow-2xl sm:px-12">
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
                <label htmlFor="username" className="block text-sm font-medium leading-6 text-zinc-200">
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
                    className="block w-full rounded-xl border border-[#3f232a] bg-[#16161d] px-3.5 py-2.5 text-zinc-100 shadow-sm placeholder:text-zinc-500 focus:border-[#be123c] focus:outline-none focus:ring-2 focus:ring-[#be123c]/35 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-zinc-200">
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
                    className="block w-full rounded-xl border border-[#3f232a] bg-[#16161d] px-3.5 py-2.5 text-zinc-100 shadow-sm placeholder:text-zinc-500 focus:border-[#be123c] focus:outline-none focus:ring-2 focus:ring-[#be123c]/35 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-full bg-gradient-to-r from-[#be123c] via-[#991b1b] to-[#6b111b] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_28px_-8px_rgba(185,28,28,0.65)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#be123c] disabled:opacity-50"
              >
                {isLoading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>
          )}

          {isMicrosoftMode && (
            <button
              onClick={() => signIn("azure-ad", { callbackUrl })}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#be123c] via-[#991b1b] to-[#6b111b] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_28px_-8px_rgba(185,28,28,0.65)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#be123c]"
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
