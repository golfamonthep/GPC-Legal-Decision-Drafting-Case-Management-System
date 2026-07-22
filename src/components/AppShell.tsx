'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import type { SessionUser } from '@/lib/auth/currentUser';

interface AppShellProps {
  children: React.ReactNode;
  user: SessionUser | null;
  showInsecureModeBanner: boolean;
}

export function AppShell({ children, user, showInsecureModeBanner }: AppShellProps) {
  const pathname = usePathname();
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

      <div className="flex h-full flex-1 flex-col overflow-hidden lg:pl-72">
        {showInsecureModeBanner && (
          <div className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-800">
            โหมดพัฒนา: ระบบยืนยันตัวตนถูกปิดใช้งาน
          </div>
        )}
        <TopHeader user={user} />
        <main className="flex-1 overflow-y-auto pb-10">
          {children}
        </main>
      </div>
    </>
  );
}
