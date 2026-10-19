import { Search, Menu, Scale, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "./UserMenu";
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
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[#262632] bg-[#0b0b0e]/95 px-4 shadow-sm backdrop-blur sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="เปิดเมนูหลัก"
        aria-controls="mobile-navigation"
        aria-expanded={menuOpen}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#262632] bg-[#14141a] text-zinc-200 focus-visible:outline-2 focus-visible:outline-[#be123c] lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-x-4 self-stretch lg:gap-x-6">
        <Link
          href="/owner"
          className="hidden xl:flex xl:items-center xl:gap-2.5 xl:border-r xl:border-[#262632] xl:pr-5 group"
        >
          <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-b from-[#be123c] to-[#6b111b] ring-2 ring-[#e11d48]/45">
            <Image
              src={OWNER_PHOTO}
              alt={OWNER_NAME}
              fill
              sizes="32px"
              className="scale-[2.2] object-cover object-[50%_30%]"
            />
          </span>
          <span className="whitespace-nowrap text-xs font-bold text-zinc-100 group-hover:text-[#fda4af] transition-colors">
            {OWNER_NAME} {OWNER_ROLE}
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
            className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-zinc-100 placeholder:text-zinc-500 focus:ring-0 sm:text-sm"
            placeholder="ค้นหาหมายเลขคดี, ชื่อผู้ร้อง, ชื่อคู่กรณี..."
            type="search"
            name="q"
          />
        </form>
        <div className="flex items-center gap-x-2.5 lg:gap-x-3.5">
          <Link
            href="/owner"
            className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-[#3a1d24] bg-[#15151b] px-3.5 py-1.5 text-xs font-bold text-zinc-100 transition hover:border-[#be123c] hover:text-[#fda4af]"
          >
            <UserRound className="h-3.5 w-3.5 text-[#fb7185]" aria-hidden="true" />
            <span>เจ้าของเว็บไซต์</span>
          </Link>
          <Link
            href="/analysis"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#be123c] via-[#991b1b] to-[#6b111b] px-4 py-1.5 text-xs font-bold text-white shadow-[0_8px_20px_-6px_rgba(185,28,28,0.65)] transition hover:brightness-110"
          >
            <Scale className="h-3.5 w-3.5 text-white" aria-hidden="true" />
            <span>ระบบวิเคราะห์</span>
          </Link>
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-[#262632]" aria-hidden="true" />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
