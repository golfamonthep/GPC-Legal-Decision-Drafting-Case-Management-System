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
  BookOpen
} from "lucide-react";

const navigation = [
  { name: "หน้าหลัก (Dashboard)", href: "/dashboard", icon: LayoutDashboard },
  { name: "รายการคดี", href: "/cases", icon: Files },
  { name: "สารบบ", href: "/registry", icon: BookOpen },
  { name: "คลังความรู้กฎหมาย", href: "/library", icon: Library },
  { name: "อัปโหลดเอกสาร", href: "/upload", icon: Upload },
  { name: "ตั้งค่าระบบ", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-slate-200 bg-slate-900 px-6 pb-4 pt-6 text-white">
      <div className="flex h-16 shrink-0 items-center gap-3 font-semibold text-lg tracking-tight">
        <Scale className="h-8 w-8 text-yellow-500" />
        <span>ก.พ.ค.ตร.</span>
      </div>
      <nav className="flex flex-1 flex-col mt-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        isActive
                          ? "bg-slate-800 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white",
                        "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors"
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive ? "text-white" : "text-slate-400 group-hover:text-white",
                          "h-5 w-5 shrink-0"
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
      <div className="mt-auto pt-4 text-xs text-slate-400 text-center border-t border-slate-800">
        ระบบสนับสนุนการวินิจฉัย v1.0
      </div>
    </div>
  );
}
