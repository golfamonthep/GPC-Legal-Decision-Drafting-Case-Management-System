"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = (localStorage.getItem("gpc-theme") as "light" | "dark") || "light";
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
      if (saved === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // Ignore storage errors in restricted iframe
    }
    setMounted(true);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "gpc-theme" && (e.newValue === "light" || e.newValue === "dark")) {
        setTheme(e.newValue);
        document.documentElement.setAttribute("data-theme", e.newValue);
        if (e.newValue === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    const handleCustomChange = () => {
      try {
        const cur = (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
        setTheme(cur);
      } catch {}
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("gpc-theme-change", handleCustomChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("gpc-theme-change", handleCustomChange);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    try {
      localStorage.setItem("gpc-theme", nextTheme);
      document.documentElement.setAttribute("data-theme", nextTheme);
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      window.dispatchEvent(new Event("gpc-theme-change"));
    } catch {
      // Ignore
    }
  };

  const isLight = mounted ? theme === "light" : true;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "สลับเป็นโหมดมืด (Dark Mode)" : "สลับเป็นโหมดสว่าง (Light Mode)"}
      title={isLight ? "สลับเป็นโหมดมืด (Dark Mode)" : "สลับเป็นโหมดสว่าง (Light Mode)"}
      className={`theme-toggle-btn inline-flex items-center justify-center gap-1.5 rounded-full border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[#c81e2b] ${
        isLight
          ? "border-slate-300 bg-white text-slate-900 font-bold hover:border-slate-400 hover:bg-slate-100 shadow-sm"
          : "border-white/20 bg-[#16161b] text-white font-bold hover:border-white/30 hover:bg-[#202026] shadow-sm"
      } ${showLabel ? "px-3 py-1.5 text-xs" : "h-9 w-9"} ${className}`}
    >
      {isLight ? (
        <>
          <Sun size={15} className="text-amber-500 transition-transform duration-200 hover:rotate-45 shrink-0" aria-hidden="true" />
          {showLabel && <span className="tracking-wide">โหมดสว่าง</span>}
        </>
      ) : (
        <>
          <Moon size={14} className="text-sky-300 transition-transform duration-200 hover:-rotate-12 shrink-0" aria-hidden="true" />
          {showLabel && <span className="tracking-wide">โหมดมืด</span>}
        </>
      )}
    </button>
  );
}
