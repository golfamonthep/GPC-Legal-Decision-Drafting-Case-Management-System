import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "../components/Sidebar";
import { TopHeader } from "../components/TopHeader";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getAuthMode } from "@/lib/auth/mvp-auth";

export const metadata: Metadata = {
  title: "ระบบสนับสนุนการวินิจฉัย ก.พ.ค.ตร.",
  description: "ระบบสนับสนุนการทำงานและร่างคำวินิจฉัย คณะกรรมการพิทักษ์ระบบคุณธรรมข้าราชการตำรวจ",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const authMode = getAuthMode();
  
  return (
    <html lang="th" className={`h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full flex bg-slate-50 text-slate-900 overflow-hidden">
        {/* Sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <Sidebar user={user} />
        </div>

        <div className="flex flex-1 flex-col lg:pl-72 h-full overflow-hidden">
          {authMode === "none" && (
            <div className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-800">
              โหมดทดสอบ MVP: ปิดการเข้าสู่ระบบชั่วคราว
            </div>
          )}
          <TopHeader />
          <main className="flex-1 overflow-y-auto pb-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
