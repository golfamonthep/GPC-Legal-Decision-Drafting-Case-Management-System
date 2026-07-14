"use client";

import { signOut } from "next-auth/react";
import { UserCircle, LogOut } from "lucide-react";
import { SessionUser } from "@/lib/auth/currentUser";
import { useState, useRef, useEffect } from "react";

export function UserMenu({ user }: { user: SessionUser | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return (
      <a href="/login" className="text-sm font-semibold leading-6 text-blue-600">
        เข้าสู่ระบบ
      </a>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-x-4 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors"
      >
        <UserCircle className="h-8 w-8 text-slate-400" />
        <span className="hidden lg:flex lg:flex-col lg:items-start text-left">
          <span className="text-sm font-semibold leading-6 text-slate-900" aria-hidden="true">
            {user.name}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Role: {user.role}
          </span>
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100">
            {user.email}
          </div>
          <button
            onClick={async () => {
              try { await fetch("/api/auth/logout", { method: "POST" }); } catch (e) {}
              signOut({ callbackUrl: "/login" });
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  );
}
