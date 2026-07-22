"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Scale } from "lucide-react";
import { loginWithMvpCode } from "./actions";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [authMode, setAuthMode] = useState("loading");
  const [mvpCode, setMvpCode] = useState("");
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
    formData.append("code", mvpCode);

    try {
      const result = await loginWithMvpCode(formData);
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
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-600">
          <Scale className="h-12 w-12" />
        </div>
        <h1 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-slate-900">
          ระบบบริหารจัดการคดี ก.พ.ค.ตร.
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          {isSimpleMode
            ? "กรอกรหัสเข้าใช้งานภายใน"
            : isMicrosoftMode
              ? "เข้าสู่ระบบด้วยบัญชี Microsoft ของหน่วยงาน"
              : isMisconfigured
                ? "ระบบยังไม่ได้กำหนดค่าการยืนยันตัวตนอย่างปลอดภัย"
                : "กำลังตรวจสอบการตั้งค่าระบบ"}
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          {errorMessage && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {errorMessage}
            </div>
          )}

          {isMisconfigured && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              ผู้ดูแลระบบต้องตั้งค่า <code>AUTH_MODE</code> และ secret ที่เกี่ยวข้องใน Vercel ก่อนเปิดใช้งาน
              ระบบปฏิเสธการเข้าถึงแทนการเปิดสิทธิ์ ADMIN อัตโนมัติ
            </div>
          )}

          {isSimpleMode && (
            <form onSubmit={handleSimpleLogin} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium leading-6 text-slate-900">
                  รหัสเข้าใช้งานภายใน
                </label>
                <div className="mt-2">
                  <input
                    id="code"
                    name="code"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={mvpCode}
                    onChange={(event) => setMvpCode(event.target.value)}
                    className="block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
              >
                {isLoading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>
          )}

          {isMicrosoftMode && (
            <button
              onClick={() => signIn("azure-ad", { callbackUrl })}
              className="flex w-full items-center justify-center gap-3 rounded-md bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
            <p className="text-center text-sm text-slate-500">กำลังโหลด...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
