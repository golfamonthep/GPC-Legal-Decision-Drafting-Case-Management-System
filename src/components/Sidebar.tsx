"use client";

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
} from "lucide-react";
import type { SessionUser } from "@/lib/auth/currentUser";
import { hasPermission } from "@/lib/auth/permissions";

const navigation = [
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
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-slate-800 bg-[#0b1f35] px-5 pb-4 pt-6 text-white">
      <div className="flex shrink-0 items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400 ring-1 ring-amber-400/30">
          <Scale className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-5 text-white">
            พล.ต.อ.วิเชียร พจน์โพธิ์ศรี
          </p>
          <p className="mt-0.5 text-xs font-semibold text-cyan-300">
            กรรมการ ก.พ.ค.ตร.
          </p>
        </div>
      </div>
      <nav aria-label="เมนูหลัก" className="mt-2 flex flex-1 flex-col">
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
                          ? "bg-cyan-400/15 text-white ring-1 ring-inset ring-cyan-300/30"
                          : "text-slate-300 hover:bg-white/5 hover:text-white",
                        "group flex gap-x-3 rounded-xl px-3 py-2.5 text-sm leading-6 font-medium transition-colors",
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive ? "text-cyan-300" : "text-slate-400 group-hover:text-white",
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
      <div className="mt-auto border-t border-white/10 pt-4 text-center text-xs leading-5 text-slate-400">
        <p className="font-semibold text-slate-300">พล.ต.อ.วิเชียร พจน์โพธิ์ศรี กรรมการ ก.พ.ค.ตร.</p>
        <p>ระบบบริหารสำนวนและวิเคราะห์คำวินิจฉัย</p>
      </div>
    </div>
  );
}
