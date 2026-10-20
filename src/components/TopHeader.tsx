import { Search, Menu, Scale } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "./UserMenu";
import { ThemeToggle } from "./ThemeToggle";
import type { SessionUser } from "@/lib/auth/currentUser";
import { OWNER_NAME, OWNER_PHOTO, OWNER_ROLE } from "@/lib/owner";

export function TopHeader({
  user,
  onOpenMenu,
  menuOpen = false,
}: {
  user: SessionUser | null;
  onOpenMenu?: () => void;
  menuOpen?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/[0.08] bg-[#0a0a0c]/95 px-4 backdrop-blur sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="เปิดเมนูหลัก"
        aria-controls="mobile-navigation"
        aria-expanded={menuOpen}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#121215] text-white focus-visible:outline-2 focus-visible:outline-[#b91c1c] lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-x-4 self-stretch lg:gap-x-6">
        <Link
          href="/dashboard"
          className="hidden xl:flex xl:items-center xl:gap-2.5 xl:border-r xl:border-white/[0.08] xl:pr-5 group"
        >
          <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#991b1b] ring-1 ring-white/20">
            <Image
              src={OWNER_PHOTO}
              alt={OWNER_NAME}
              fill
              sizes="32px"
              className="rounded-full object-cover object-[50%_15%]"
            />
          </span>
          <span className="whitespace-nowrap text-xs font-bold text-white group-hover:text-zinc-300 transition-colors">
            {OWNER_NAME} <span className="font-normal text-zinc-400">{OWNER_ROLE}</span>
          </span>
        </Link>
        <form className="relative flex min-w-0 flex-1 self-stretch" action="/cases" method="GET">
          <label htmlFor="search-field" className="sr-only">
            ค้นหาหมายเลขคดี...
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-zinc-500"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-white placeholder:text-zinc-500 focus:ring-0 sm:text-sm"
            placeholder="ค้นหาหมายเลขคดี, ชื่อผู้ร้อง, ชื่อคู่กรณี..."
            type="search"
            name="q"
          />
        </form>
        <div className="flex items-center gap-x-2.5 lg:gap-x-3.5">
          <ThemeToggle />
          <Link
            href="/analysis"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#d62839] to-[#991b1b] px-4 py-1.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(185,28,28,0.4)] transition hover:brightness-110"
          >
            <Scale className="h-3.5 w-3.5 text-white" aria-hidden="true" />
            <span>ระบบวิเคราะห์</span>
          </Link>
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-white/[0.08]" aria-hidden="true" />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
