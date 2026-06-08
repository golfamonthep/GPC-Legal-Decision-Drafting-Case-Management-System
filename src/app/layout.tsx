import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { Sidebar } from "../components/Sidebar";
import { TopHeader } from "../components/TopHeader";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "ระบบสนับสนุนการวินิจฉัย ก.พ.ค.ตร.",
  description: "ระบบสนับสนุนการทำงานและร่างคำวินิจฉัย คณะกรรมการพิทักษ์ระบบคุณธรรมข้าราชการตำรวจ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`}>
      <body className="h-full flex bg-slate-50 text-slate-900 overflow-hidden">
        {/* Sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <Sidebar />
        </div>

        <div className="flex flex-1 flex-col lg:pl-72 h-full overflow-hidden">
          <TopHeader />
          <main className="flex-1 overflow-y-auto pb-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
