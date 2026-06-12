"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Scale } from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  
  let errorMessage = "";
  if (error === "AccessDenied") {
    errorMessage = "คุณไม่ได้รับสิทธิ์เข้าถึง หรือบัญชีของคุณถูกระงับ/รอการอนุมัติ";
  } else if (error) {
    errorMessage = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง";
  }

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-600">
          <Scale className="h-12 w-12" />
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-slate-900">
          ระบบบริหารจัดการคดี ก.พ.ค.ตร.
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          กรุณาเข้าสู่ระบบด้วยบัญชี Microsoft ของหน่วยงาน
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          {errorMessage && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800 border border-red-200">
              {errorMessage}
            </div>
          )}

          <button
            onClick={() => signIn("azure-ad", { callbackUrl: "/dashboard" })}
            className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 items-center gap-3"
          >
            <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
              <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
            </svg>
            เข้าสู่ระบบด้วย Microsoft
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
