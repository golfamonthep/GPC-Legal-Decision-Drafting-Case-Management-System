import { Search, Menu } from "lucide-react";
import { UserMenu } from "./UserMenu";
import type { SessionUser } from "@/lib/auth/currentUser";

export function TopHeader({ user, onOpenMenu, menuOpen = false }: { user: SessionUser | null; onOpenMenu?: () => void; menuOpen?: boolean }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button type="button" onClick={onOpenMenu} aria-label="เปิดเมนูหลัก" aria-controls="mobile-navigation" aria-expanded={menuOpen} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-700 lg:hidden">
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="flex min-w-0 flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex min-w-0 flex-1" action="/cases" method="GET">
          <label htmlFor="search-field" className="sr-only">
            ค้นหาหมายเลขคดี...
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-8 pr-0 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm"
            placeholder="ค้นหาหมายเลขคดี, ชื่อคู่กรณี..."
            type="search"
            name="q"
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200" aria-hidden="true" />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
