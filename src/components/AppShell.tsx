'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import type { SessionUser } from '@/lib/auth/currentUser';
import { useRef, useState } from 'react';
import { X, LayoutDashboard, Files, Scale, Library, Menu } from 'lucide-react';
import { CaseDataRefresh } from './CaseDataRefresh';
import { cn } from '@/lib/utils';
import { hasPermission } from '@/lib/auth/permissions';

interface AppShellProps {
  children: React.ReactNode;
  user: SessionUser | null;
  showInsecureModeBanner: boolean;
  initialCaseRevision: string | null;
}

export function AppShell({ children, user, showInsecureModeBanner, initialCaseRevision }: AppShellProps) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => menuRef.current?.close();
  const isAuthPage = pathname === '/login' || pathname?.startsWith('/login/');

  if (isAuthPage) {
    return (
      <main className="min-h-full w-full overflow-y-auto bg-slate-50">
        {children}
      </main>
    );
  }

  return (
    <>
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-80 lg:flex-col">
        <Sidebar user={user} />
      </div>

      <dialog ref={menuRef} id="mobile-navigation" aria-label="เมนูหลัก" className="gpc-navigation-dialog" onClose={() => setMenuOpen(false)} onClick={event => { if (event.target === menuRef.current) closeMenu(); }}>
        <button type="button" onClick={closeMenu} autoFocus aria-label="ปิดเมนูหลัก" className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-[#991b1b]"><X className="h-5 w-5" /></button>
        <Sidebar user={user} onNavigate={closeMenu} />
      </dialog>
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden lg:pl-80">
        {showInsecureModeBanner && (
          <div className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-800">
            โหมดพัฒนา: ระบบยืนยันตัวตนถูกปิดใช้งาน
          </div>
        )}
        <TopHeader user={user} menuOpen={menuOpen} onOpenMenu={() => { menuRef.current?.showModal(); setMenuOpen(true); }} />
        <CaseDataRefresh enabled={Boolean(user)} initialRevision={initialCaseRevision} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-10">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (< 768px) */}
        <nav aria-label="แถบนำทางด่วนมือถือ" className="fixed bottom-0 inset-x-0 z-30 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur dark:border-white/10 dark:bg-[#0a0a0c]/95 md:hidden">
          <Link
            href="/dashboard"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-1 px-2 text-[11px] font-medium transition-colors",
              pathname === "/dashboard"
                ? "text-[#c81e2b] dark:text-[#f87171] font-bold"
                : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>หน้าหลัก</span>
          </Link>
          <Link
            href="/cases"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-1 px-2 text-[11px] font-medium transition-colors",
              pathname?.startsWith("/cases")
                ? "text-[#c81e2b] dark:text-[#f87171] font-bold"
                : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
            )}
          >
            <Files className="h-5 w-5" />
            <span>รายการคดี</span>
          </Link>
          {(!user || hasPermission(user.role, "USE_ANALYSIS")) && (
            <Link
              href="/analysis"
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1 px-2 text-[11px] font-medium transition-colors",
                pathname?.startsWith("/analysis")
                  ? "text-[#c81e2b] dark:text-[#f87171] font-bold"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              )}
            >
              <Scale className="h-5 w-5" />
              <span>วิเคราะห์</span>
            </Link>
          )}
          <Link
            href="/library"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-1 px-2 text-[11px] font-medium transition-colors",
              pathname?.startsWith("/library")
                ? "text-[#c81e2b] dark:text-[#f87171] font-bold"
                : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
            )}
          >
            <Library className="h-5 w-5" />
            <span>คลังกฎหมาย</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              menuRef.current?.showModal();
              setMenuOpen(true);
            }}
            className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 text-[11px] font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
          >
            <Menu className="h-5 w-5" />
            <span>เมนูทั้งหมด</span>
          </button>
        </nav>
      </div>
    </>
  );
}
