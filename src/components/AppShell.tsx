'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import type { SessionUser } from '@/lib/auth/currentUser';
import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { CaseDataRefresh } from './CaseDataRefresh';

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
  const isAuthPage = pathname === '/login' || pathname.startsWith('/login/');

  if (isAuthPage) {
    return (
      <main className="min-h-full w-full overflow-y-auto bg-slate-50">
        {children}
      </main>
    );
  }

  return (
    <>
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar user={user} />
      </div>

      <dialog ref={menuRef} id="mobile-navigation" aria-label="เมนูหลัก" className="gpc-navigation-dialog" onClose={() => setMenuOpen(false)} onClick={event => { if (event.target === menuRef.current) closeMenu(); }}>
        <button type="button" onClick={closeMenu} autoFocus aria-label="ปิดเมนูหลัก" className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-lg text-slate-200 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-white"><X className="h-5 w-5" /></button>
        <Sidebar user={user} onNavigate={closeMenu} />
      </dialog>
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden lg:pl-72">
        {showInsecureModeBanner && (
          <div className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-800">
            โหมดพัฒนา: ระบบยืนยันตัวตนถูกปิดใช้งาน
          </div>
        )}
        <TopHeader user={user} menuOpen={menuOpen} onOpenMenu={() => { menuRef.current?.showModal(); setMenuOpen(true); }} />
        <CaseDataRefresh enabled={Boolean(user)} initialRevision={initialCaseRevision} />
        <main className="flex-1 overflow-y-auto pb-10">
          {children}
        </main>
      </div>
    </>
  );
}
