import type { Metadata } from "next";
import "./globals.css";
import "./tabler-scoped.css";
import "./case-workspace.css";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getAuthMode } from "@/lib/auth/mvp-auth";
import { hasPermission } from "@/lib/auth/permissions";
import { getCaseRevision } from "@/lib/caseRevision";

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
  const initialCaseRevision = user && hasPermission(user.role, 'VIEW_CASES')
    ? await getCaseRevision().catch(() => null)
    : null;

  return (
    <html lang="th" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full flex bg-slate-50 text-slate-900 overflow-hidden">
        <AppShell user={user} showInsecureModeBanner={authMode === "none"} initialCaseRevision={initialCaseRevision}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
