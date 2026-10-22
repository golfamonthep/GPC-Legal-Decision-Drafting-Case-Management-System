"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "../lib/utils";
import {
  LayoutDashboard,
  Files,
  Library,
  Upload,
  Settings,
  Scale,
  Users,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth/currentUser";
import { hasPermission } from "@/lib/auth/permissions";
import { OWNER_PHOTO } from "@/lib/owner";
import { ThemeToggle } from "./ThemeToggle";

const navigation = [
  { name: "หน้าหลัก (Dashboard)", href: "/dashboard", icon: LayoutDashboard },
  { name: "รายการคดี", href: "/cases", icon: Files },
  { name: "วิเคราะห์และร่างคำวินิจฉัย", href: "/analysis", icon: Scale, permission: "USE_ANALYSIS" as const },
  { name: "คลังความรู้กฎหมาย", href: "/library", icon: Library },
  { name: "ผู้ใช้งานระบบ", href: "/admin/users", icon: Users, permission: "MANAGE_USERS" as any },
  { name: "นำเข้าทะเบียนคดี", href: "/registry/import", icon: Upload, permission: "IMPORT_REGISTRY" as any },
  { name: "ผู้ดูแลระบบ", href: "/admin/system", icon: Settings, permission: "VIEW_ADMIN_CONSOLE" as any },
];

export function Sidebar({ user, onNavigate }: { user: SessionUser | null; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-white/[0.08] bg-[#0a0a0c] px-5 pb-4 pt-6 text-white">
      <Link
        href="/dashboard"
        prefetch={true}
        onMouseEnter={() => router.prefetch("/dashboard")}
        onClick={onNavigate}
        className="group relative flex shrink-0 items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121215] p-3 transition-colors hover:border-white/20"
      >
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#991b1b] ring-2 ring-white/20">
          <Image src={OWNER_PHOTO} alt="" fill sizes="112px" className="rounded-full object-cover object-[50%_15%]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block whitespace-nowrap text-sm font-bold leading-5 text-white" style={{ whiteSpace: "nowrap" }}>
            พล.ต.อ.วิเชียร พจน์โพธิ์ศรี
          </span>
          <span className="mt-0.5 block whitespace-nowrap text-xs font-medium text-zinc-400">
            กรรมการ ก.พ.ค.ตร.
          </span>
        </span>
      </Link>
      <nav aria-label="เมนูหลัก" className="mt-1 flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                if (item.permission && (!user || !hasPermission(user.role, item.permission))) {
                  return null;
                }
                const isActive = pathname ? (item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)) : false;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      prefetch={true}
                      onMouseEnter={() => router.prefetch(item.href)}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        isActive
                          ? "bg-gradient-to-b from-[#d62839] to-[#991b1b] text-white shadow-[0_4px_14px_rgba(185,28,28,0.4)]"
                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-white",
                        "group flex gap-x-3 rounded-full px-3.5 py-2.5 text-sm leading-6 font-medium transition-all",
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-200",
                          "h-5 w-5 shrink-0",
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>
      </nav>
      <div className="mt-auto border-t border-white/[0.08] pt-4 text-center text-xs leading-5 text-zinc-500">
        <div className="mb-3 flex items-center justify-center">
          <ThemeToggle showLabel className="w-full justify-center" />
        </div>
        <p className="font-semibold text-white">พล.ต.อ.วิเชียร พจน์โพธิ์ศรี กรรมการ ก.พ.ค.ตร.</p>
        <p className="text-zinc-400">ระบบบริหารสำนวนและวิเคราะห์คำวินิจฉัย</p>
      </div>
    </div>
  );
}
