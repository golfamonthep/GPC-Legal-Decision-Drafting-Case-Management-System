"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/utils";
import {
  LayoutDashboard,
  Files,
  Library,
  Upload,
  Settings,
  Scale,
  BookOpen,
  Users,
  Search,
  AlertTriangle,
  UserRound,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth/currentUser";
import { hasPermission } from "@/lib/auth/permissions";
import { OWNER_PHOTO } from "@/lib/owner";

const navigation = [
  { name: "เจ้าของเว็บไซต์", href: "/owner", icon: UserRound },
  { name: "หน้าหลัก (Dashboard)", href: "/dashboard", icon: LayoutDashboard },
  { name: "รายการคดี", href: "/cases", icon: Files },
  { name: "วิเคราะห์และร่างคำวินิจฉัย", href: "/analysis", icon: Scale, permission: "USE_ANALYSIS" as const },
  { name: "ค้นหาขั้นสูง", href: "/search", icon: Search, permission: "ADVANCED_CASE_SEARCH" as any },
  { name: "สารบบ", href: "/registry", icon: BookOpen },
  { name: "ตรวจคุณภาพข้อมูล", href: "/data-quality", icon: AlertTriangle, permission: "VIEW_DATA_QUALITY" as any },
  { name: "คลังความรู้กฎหมาย", href: "/library", icon: Library },
  { name: "ผู้ใช้งานระบบ", href: "/admin/users", icon: Users, permission: "MANAGE_USERS" as any },
  { name: "นำเข้าทะเบียนคดี", href: "/upload", icon: Upload, permission: "IMPORT_REGISTRY" as any },
  { name: "ผู้ดูแลระบบ", href: "/admin/system", icon: Settings, permission: "VIEW_ADMIN_CONSOLE" as any },
];

export function Sidebar({ user, onNavigate }: { user: SessionUser | null; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-[#262632] bg-[#0b0b0e] px-5 pb-4 pt-6 text-white">
      <Link
        href="/owner"
        onClick={onNavigate}
        className="group relative flex shrink-0 items-center gap-3 overflow-hidden rounded-2xl border border-[#3a1d24] bg-[radial-gradient(120%_110%_at_50%_105%,rgba(153,27,27,0.42)_0%,rgba(18,18,24,0.96)_70%)] p-3 transition-all hover:border-[#be123c]/70"
      >
        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-b from-[#be123c] to-[#6b111b] ring-2 ring-[#e11d48]/45 shadow-[0_8px_20px_-4px_rgba(185,28,28,0.65)]">
          <Image src={OWNER_PHOTO} alt="" fill sizes="96px" className="scale-[2.6] object-cover object-[50%_32%]" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold leading-5 text-white">พล.ต.อ.วิเชียร พจน์โพธิ์ศรี</span>
          <span className="mt-0.5 block text-xs font-semibold text-[#fda4af]">กรรมการ ก.พ.ค.ตร.</span>
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
                const isActive = pathname.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        isActive
                          ? "bg-gradient-to-r from-[#be123c] via-[#991b1b] to-[#6b111b] text-white shadow-[0_8px_20px_-6px_rgba(185,28,28,0.65)] ring-1 ring-inset ring-white/15"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white",
                        "group flex gap-x-3 rounded-full px-3.5 py-2.5 text-sm leading-6 font-medium transition-all",
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive ? "text-white" : "text-zinc-500 group-hover:text-[#fda4af]",
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
      <div className="mt-auto border-t border-[#262632] pt-4 text-center text-xs leading-5 text-zinc-500">
        <p className="font-semibold text-zinc-300">พล.ต.อ.วิเชียร พจน์โพธิ์ศรี กรรมการ ก.พ.ค.ตร.</p>
        <p>ระบบบริหารสำนวนและวิเคราะห์คำวินิจฉัย</p>
      </div>
    </div>
  );
}
