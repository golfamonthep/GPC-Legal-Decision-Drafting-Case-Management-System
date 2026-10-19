import { Search, Menu, Scale } from "lucide-react";
import Link from "next/link";
import { UserMenu } from "./UserMenu";
import type { SessionUser } from "@/lib/auth/currentUser";

export function TopHeader({ user, onOpenMenu, menuOpen = false }: { user: SessionUser | null; onOpenMenu?: () => void; menuOpen?: boolean }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button type="button" onClick={onOpenMenu} aria-label="เปิดเมนูหลัก" aria-controls="mobile-navigation" aria-expanded={menuOpen} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-700 lg:hidden">
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-x-4 self-stretch lg:gap-x-6">
        <div className="hidden xl:flex xl:items-center xl:gap-2.5 xl:border-r xl:border-slate-200 xl:pr-5">
          <Scale className="h-4 w-4 shrink-0 text-[#102b46]" aria-hidden="true" />
          <span className="whitespace-nowrap text-xs font-bold text-[#102b46]">
            พล.ต.อ.วิเชียร พจน์โพธิ์ศรี กรรมการ ก.พ.ค.ตร.
          </span>
        </div>
        <form className="relative flex min-w-0 flex-1 self-stretch" action="/cases" method="GET">
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
            placeholder="ค้นหาหมายเลขคดี, ชื่อผู้ร้อง, ชื่อคู่กรณี..."
            type="search"
            name="q"
          />
        </form>
        <div className="flex items-center gap-x-3 lg:gap-x-5">
          <Link
            href="/analysis"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#102b46] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            <Scale className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
            <span>ระบบวิเคราะห์</span>
          </Link>
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200" aria-hidden="true" />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
