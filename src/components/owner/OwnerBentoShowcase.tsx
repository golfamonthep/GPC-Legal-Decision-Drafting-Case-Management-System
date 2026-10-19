"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Scale,
  ShieldCheck,
  BookOpen,
  LayoutDashboard,
  FolderKanban,
  Search,
  Sparkles,
  CheckCircle2,
  Award,
  Landmark,
  FileCheck2,
  Eye,
  UserCheck,
  Zap,
  ChevronsRight,
  Gauge,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  OWNER_NAME,
  OWNER_ORG_EN,
  OWNER_ORG_TH,
  OWNER_PHOTO,
  OWNER_PHOTO_WIDE,
  OWNER_ROLE,
} from "@/lib/owner";

type WorkCategory = "all" | "registry" | "analysis" | "knowledge";

interface WorkItem {
  id: string;
  category: Exclude<WorkCategory, "all">;
  categoryLabel: string;
  title: string;
  subtitle: string;
  href: string;
  badge: string;
  accentFrom: string;
  accentTo: string;
  metrics: string;
  icon: React.ComponentType<{ className?: string }>;
}

const WORK_ITEMS: WorkItem[] = [
  {
    id: "work-dashboard",
    category: "registry",
    categoryLabel: "บริหารสำนวน",
    title: "แดชบอร์ดบริหารทะเบียนคุมสำนวน (CYBER Executive)",
    subtitle:
      "เปรียบเทียบทะเบียนเรื่องร้องทุกข์และเรื่องอุทธรณ์ด้วยกราฟเกจครึ่งวงกลม กราฟคลื่นสองเส้น และกราฟแท่งไล่เฉดสีตำรวจ",
    href: "/dashboard",
    badge: "Executive Dashboard",
    accentFrom: "from-[#be123c]/35",
    accentTo: "to-[#4c0519]/20",
    metrics: "Segmented Gauge · Dual Wave · Pillar Chart",
    icon: LayoutDashboard,
  },
  {
    id: "work-analysis",
    category: "analysis",
    categoryLabel: "วิเคราะห์และร่างคำวินิจฉัย",
    title: "ระบบวิเคราะห์และร่างคำวินิจฉัยเบื้องต้น (6 ขั้นตอน)",
    subtitle:
      "ตั้งเรื่อง แหล่งอ้างอิงที่ยืนยันแล้ว อาวุโส/คะแนน (คำนวณโควตา 50%) ข้อเท็จจริง/ข้อกล่าวอ้าง ร่างรายส่วน และส่งออกไฟล์ Word (.docx)",
    href: "/analysis",
    badge: "6-Stage Legal Workbench",
    accentFrom: "from-[#991b1b]/40",
    accentTo: "to-rose-950/20",
    metrics: "6 ขั้นตอนมาตรฐาน · ส่งออก .docx พร้อม SHA-256",
    icon: Scale,
  },
  {
    id: "work-cases",
    category: "registry",
    categoryLabel: "บริหารสำนวน",
    title: "ทะเบียนคุมสำนวนร้องทุกข์และอุทธรณ์",
    subtitle:
      "บริหารจัดการรายการสำนวน ตรวจสอบสถานะเรื่องดำ-เรื่องแดง กำหนดวันครบกำหนด และบันทึกความเคลื่อนไหวของสำนวน",
    href: "/cases",
    badge: "Case Registry",
    accentFrom: "from-[#881337]/35",
    accentTo: "to-zinc-900/30",
    metrics: "แยกทะเบียนร้องทุกข์ & อุทธรณ์ชัดเจน",
    icon: FolderKanban,
  },
  {
    id: "work-search",
    category: "knowledge",
    categoryLabel: "คลังความรู้และคุณภาพข้อมูล",
    title: "ระบบค้นหาสำนวนและแปลงเลขไทย-อารบิกอัตโนมัติ",
    subtitle:
      "ค้นหาข้ามสำนวน ชื่อคู่กรณี เลขดำ และข้อเท็จจริง รองรับการจับคู่เลขไทย (๐-๙) และเลขอารบิก (0-9) เสมือนเป็นชุดเดียวกัน",
    href: "/search",
    badge: "Smart Legal Search",
    accentFrom: "from-[#be123c]/30",
    accentTo: "to-amber-950/20",
    metrics: "ค้นหาสองทาง ๐-๙ ↔ 0-9 ทันที",
    icon: Search,
  },
  {
    id: "work-library",
    category: "knowledge",
    categoryLabel: "คลังความรู้และคุณภาพข้อมูล",
    title: "คลังความรู้กฎหมาย กฎ ก.ตร. และแนวคำวินิจฉัย",
    subtitle:
      "รวบรวมพระราชบัญญัติตำรวจแห่งชาติ พ.ศ. 2565 กฎ ก.ตร. ระเบียบ และแนวคำวินิจฉัยบรรทัดฐานเพื่อใช้ผูกอ้างอิงในสำนวน",
    href: "/library",
    badge: "Verified Legal Corpus",
    accentFrom: "from-[#7f1d1d]/40",
    accentTo: "to-slate-950/30",
    metrics: "เฉพาะแหล่งอ้างอิงที่ยืนยันสถานะแล้ว",
    icon: BookOpen,
  },
  {
    id: "work-ai-harness",
    category: "analysis",
    categoryLabel: "วิเคราะห์และร่างคำวินิจฉัย",
    title: "AI Harness นิรนาม & ระบบป้องกันการเขียนทับร่างมนุษย์",
    subtitle:
      "ปิดบังข้อมูลส่วนบุคคลก่อนส่งประมวลผล (Pseudonymization) ตรวจ Citation Allowlist และตรวจ Stale Revision (409) ทุกครั้ง",
    href: "/legal-qa",
    badge: "Safe Legal AI Harness",
    accentFrom: "from-[#be123c]/35",
    accentTo: "to-fuchsia-950/20",
    metrics: "store:false · Pseudonymized · 409 Guard",
    icon: Sparkles,
  },
];

const PILLARS = [
  {
    code: "ก.พ.ค.ตร.",
    label: "คณะกรรมการพิทักษ์ระบบคุณธรรมข้าราชการตำรวจ",
  },
  {
    code: "พ.ร.บ. ๒๕๖๕",
    label: "พระราชบัญญัติตำรวจแห่งชาติ พ.ศ. ๒๕๖๕",
  },
  {
    code: "เรื่องร้องทุกข์",
    label: "คุ้มครองสิทธิและเยียวยาความเดือดร้อนเสียหาย",
  },
  {
    code: "เรื่องอุทธรณ์",
    label: "ตรวจสอบคำสั่งลงโทษทางวินัยและคำสั่งทางปกครอง",
  },
  {
    code: "โควตาอาวุโส 50%",
    label: "ตรวจสอบสัดส่วนการเลื่อนตำแหน่งสูงขึ้นตามกฎ ก.ตร.",
  },
];

export function OwnerBentoShowcase({
  totalCases = 216,
  activeCases = 48,
  completedCases = 168,
}: {
  totalCases?: number;
  activeCases?: number;
  completedCases?: number;
}) {
  const [activeCategory, setActiveCategory] = useState<WorkCategory>("all");
  const [portraitMode, setPortraitMode] = useState<"wide" | "circle">("wide");

  const filteredWorks =
    activeCategory === "all"
      ? WORK_ITEMS
      : WORK_ITEMS.filter((item) => item.category === activeCategory);

  const numFmt = new Intl.NumberFormat("th-TH");
  const pctFmt = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 });
  const total = totalCases || 216;
  const completed = completedCases ?? Math.max(0, total - (activeCases ?? 48));
  const pending = activeCases ?? Math.max(0, total - completed);
  const compPct = total > 0 ? (completed / total) * 100 : 77.8;
  const pendPct = total > 0 ? (pending / total) * 100 : 22.2;
  const needleAngle = -90 + (Math.min(100, Math.max(0, compPct)) / 100) * 180;

  return (
    <div className="min-h-full bg-[#08080a] px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-6">
        {/* Top CYBER Floating Capsule Navigation Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-[#3a1d24] bg-[#101014]/95 px-5 py-3 shadow-[0_18px_40px_-15px_rgba(0,0,0,0.85)]">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e11d48]/40 bg-gradient-to-br from-[#be123c] to-[#6b111b] text-xs font-black tracking-wider text-white shadow-[0_0_24px_rgba(185,28,28,0.65)]">
              กพค
            </span>
            <div>
              <p className="text-sm font-black tracking-[0.12em] uppercase text-white">
                {OWNER_NAME}
              </p>
              <p className="text-[11px] text-[#fda4af]">
                {OWNER_ROLE} · {OWNER_ORG_EN}
              </p>
            </div>
          </div>

          <nav
            aria-label="หมวดหมู่หน้าข้อมูลเจ้าของเว็บไซต์"
            className="hidden xl:flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0b0b0e] p-1.5 text-xs font-bold"
          >
            <a
              href="#owner-hero"
              className="rounded-full bg-gradient-to-r from-[#be123c] via-[#991b1b] to-[#6b111b] px-4 py-1.5 text-white shadow-[0_6px_18px_-4px_rgba(225,29,72,0.65)]"
            >
              ภาพรวมผู้ดำรงตำแหน่ง
            </a>
            <a
              href="#owner-intelligence"
              className="rounded-full px-3.5 py-1.5 text-zinc-400 transition hover:text-white"
            >
              กราฟวิเคราะห์สำนวน
            </a>
            <a
              href="#owner-portrait"
              className="rounded-full px-3.5 py-1.5 text-zinc-400 transition hover:text-white"
            >
              ภาพถ่ายทางการ & หลักการวินิจฉัย
            </a>
            <a
              href="#owner-works"
              className="rounded-full px-3.5 py-1.5 text-zinc-400 transition hover:text-white"
            >
              ระบบงานดิจิทัล ({WORK_ITEMS.length})
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#be123c] via-[#991b1b] to-[#6b111b] px-4 py-2 text-xs font-bold text-white shadow-[0_8px_20px_-6px_rgba(185,28,28,0.65)] transition hover:brightness-110"
            >
              <span>เข้าสู่แดชบอร์ด</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </header>

        {/* Hero Section: Left Official Portrait Card + Right CYBER Fanned Police Maroon Insight Cards */}
        <section
          id="owner-hero"
          className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch"
        >
          {/* Left 5 Cols: Official Police Maroon Wall Portrait Card */}
          <article className="flex flex-col justify-between rounded-[2rem] border border-[#4c1d24] bg-[radial-gradient(125%_115%_at_50%_105%,rgba(153,27,27,0.42)_0%,rgba(16,16,20,0.98)_72%)] p-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] lg:col-span-5">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5b1d28] bg-[#1a1114] px-3 py-1 text-[11px] font-bold text-[#fda4af]">
                  <Award className="h-3.5 w-3.5 text-[#fb7185]" aria-hidden="true" />
                  <span>เจ้าของเว็บไซต์ · ก.พ.ค.ตร.</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPortraitMode((prev) => (prev === "wide" ? "circle" : "wide"))
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#14141b] px-3 py-1 text-[11px] font-medium text-zinc-300 transition hover:border-[#be123c] hover:text-white"
                >
                  <Eye className="h-3 w-3 text-[#fb7185]" aria-hidden="true" />
                  <span>{portraitMode === "wide" ? "กรอบวงกลม" : "ภาพตราสัญลักษณ์เต็ม"}</span>
                </button>
              </div>

              {portraitMode === "wide" ? (
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-[#7f1d1d] bg-[#14141b] shadow-[0_20px_50px_-14px_rgba(153,27,27,0.65)]">
                  <Image
                    src={OWNER_PHOTO_WIDE}
                    alt={`${OWNER_NAME} ${OWNER_ROLE} ณ สำนักงาน ก.พ.ค.ตร.`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 560px"
                    priority
                    className="object-cover object-top transition duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#be123c] to-[#881337] px-3 py-0.5 text-[10px] font-bold text-white shadow">
                      <Landmark className="h-3 w-3" aria-hidden="true" />
                      <span>{OWNER_ORG_TH}</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative mx-auto my-3 flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-3 rounded-full border-2 border-dashed border-[#be123c]/50"
                  />
                  <div className="relative h-full w-full overflow-hidden rounded-full bg-gradient-to-b from-[#be123c] via-[#991b1b] to-[#4c0519] p-1.5 shadow-[0_20px_50px_-12px_rgba(185,28,28,0.65)]">
                    <div className="relative h-full w-full overflow-hidden rounded-full bg-[#14141b]">
                      <Image
                        src={OWNER_PHOTO}
                        alt={`${OWNER_NAME} ${OWNER_ROLE}`}
                        fill
                        sizes="288px"
                        priority
                        className="scale-[1.7] object-cover object-[50%_26%]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 text-center">
                <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  {OWNER_NAME}
                </h1>
                <p className="mt-1 text-base font-bold text-[#fb7185]">{OWNER_ROLE}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-300">{OWNER_ORG_TH}</p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                  {OWNER_ORG_EN}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  { href: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
                  { href: "/cases", label: "สำนวน", icon: FolderKanban },
                  { href: "/analysis", label: "วิเคราะห์", icon: Scale },
                  { href: "/library", label: "คลังความรู้", icon: BookOpen },
                ].map((btn) => (
                  <Link
                    key={btn.href}
                    href={btn.href}
                    className="group flex flex-col items-center justify-center gap-1 rounded-2xl border border-[#3a1d24] bg-[#14141b] py-3 text-zinc-300 transition hover:border-[#be123c] hover:bg-[#be123c]/15 hover:text-white"
                  >
                    <btn.icon className="h-4 w-4 text-[#fb7185]" />
                    <span className="text-[10px] font-semibold">{btn.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </article>

          {/* Right 7 Cols: CYBER Executive Hero + Fanned 3D Stacked Police Maroon Insight Cards */}
          <div className="flex flex-col justify-between gap-6 lg:col-span-7">
            <article className="relative overflow-hidden rounded-[2rem] border border-[#4c1d24] bg-[radial-gradient(125%_110%_at_50%_0%,rgba(153,27,27,0.32)_0%,rgba(16,16,20,0.98)_70%)] p-6 sm:p-8 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#fda4af]">
                Police Merit System Protection Commission · ก.พ.ค.ตร.
              </p>
              <h2 className="mt-2.5 text-2xl font-extrabold leading-snug tracking-tight text-white sm:text-3xl">
                พิทักษ์ระบบคุณธรรม อำนวยความยุติธรรมในการบริหารงานบุคคลข้าราชการตำรวจ{" "}
                <span className="text-[#fb7185]">
                  ด้วยหลักนิติธรรมและหลักฐานที่ตรวจสอบได้
                </span>
              </h2>

              {/* Fanned 3D Stacked Police Maroon Insight Cards (CYBER "Account Insights" design) */}
              <div className="relative my-6 py-2">
                {/* Back Fanned Card 3 */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-4 right-2 hidden w-[78%] translate-x-6 rotate-6 rounded-3xl border border-[#4c1d24]/60 bg-[radial-gradient(120%_100%_at_50%_100%,rgba(153,27,27,0.35)_0%,rgba(18,18,24,0.85)_75%)] p-5 opacity-55 sm:block"
                >
                  <div className="flex justify-end text-[#fb7185]/70">
                    <ChevronsRight size={16} />
                  </div>
                </div>
                {/* Middle Fanned Card 2 */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-2 right-6 hidden w-[84%] translate-x-3 rotate-3 rounded-3xl border border-[#5b1d28]/75 bg-[radial-gradient(120%_100%_at_50%_100%,rgba(185,28,28,0.42)_0%,rgba(20,20,26,0.92)_75%)] p-5 opacity-75 sm:block"
                >
                  <div className="flex justify-end text-[#fb7185]">
                    <ChevronsRight size={16} />
                  </div>
                </div>
                {/* Front Active Insight Card 1 */}
                <div className="relative z-10 w-full sm:w-[88%] rounded-3xl border border-[#7f1d1d] bg-[radial-gradient(125%_115%_at_50%_105%,rgba(185,28,28,0.72)_0%,rgba(127,29,29,0.32)_48%,rgba(16,16,22,0.98)_100%)] p-6 shadow-[0_24px_50px_-15px_rgba(153,27,27,0.7)]">
                  <div className="flex items-center justify-between text-xs font-bold text-[#fda4af]">
                    <span className="inline-flex items-center gap-1.5">
                      <Zap size={14} className="text-[#fb7185]" aria-hidden="true" />
                      <span>Executive Adjudication Insights</span>
                    </span>
                    <ChevronsRight size={18} className="text-[#fb7185]" aria-hidden="true" />
                  </div>
                  <p className="mt-3.5 text-lg font-medium leading-relaxed text-zinc-100 sm:text-xl">
                    บริหารทะเบียนคุมสำนวนเรื่องร้องทุกข์และเรื่องอุทธรณ์รวม{" "}
                    <strong className="font-extrabold text-[#fda4af]">
                      {numFmt.format(total)} สำนวน
                    </strong>{" "}
                    ดำเนินการแล้วเสร็จ{" "}
                    <span className="font-extrabold text-[#fb7185] underline decoration-[#be123c] underline-offset-4">
                      {numFmt.format(completed)} เรื่อง ({pctFmt.format(compPct)}%)
                    </span>
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-zinc-300">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      พร้อมปฏิบัติหน้าที่พิจารณาวินิจฉัยสำนวน
                    </span>
                    <span className="font-bold text-[#fda4af]">
                      คงค้าง {numFmt.format(pending)} เรื่อง
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/analysis"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#be123c] via-[#991b1b] to-[#6b111b] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_28px_-8px_rgba(185,28,28,0.7)] transition hover:brightness-110"
                >
                  <span>เปิดระบบวิเคราะห์คำวินิจฉัย</span>
                  <Scale className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full border border-[#4c1d24] bg-[#16161d] px-5 py-3 text-sm font-bold text-zinc-100 transition hover:border-[#be123c] hover:text-[#fda4af]"
                >
                  <span>เข้าสู่แดชบอร์ดสำนวน</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>

            {/* Institutional Pillars Strip */}
            <article className="rounded-[2rem] border border-[#3a1d24] bg-[#101014] p-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold tracking-wide text-zinc-200">
                  หน่วยงานและขอบเขตภารกิจตามกฎหมาย (Institutional Mandate & Legal Pillars)
                </h3>
                <span className="text-[11px] font-bold text-[#fda4af]">
                  พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕
                </span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {PILLARS.map((pillar) => (
                  <div
                    key={pillar.code}
                    className="flex flex-col justify-between rounded-2xl border border-[#2f1d22] bg-[radial-gradient(120%_100%_at_50%_105%,rgba(153,27,27,0.22)_0%,rgba(20,20,27,0.96)_75%)] px-4 py-3.5 transition hover:border-[#be123c]/60"
                  >
                    <p className="text-sm font-extrabold tracking-tight text-white">
                      {pillar.code}
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-zinc-400">
                      {pillar.label}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        {/* CYBER 3-Column Gradient Charts Preview on Owner Page */}
        <section
          id="owner-intelligence"
          className="rounded-[2rem] border border-[#3a1d24] bg-[#0e0e12] p-6 sm:p-8 shadow-2xl"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#fb7185]">
                Executive Analytics · เฉดสีแดงเข้มตำรวจไล่ระดับ
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">
                ดัชนีผลการพิจารณาและสถิติทะเบียนสำนวน ก.พ.ค.ตร.
              </h2>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#4c1d24] bg-[#16161d] px-4 py-2 text-xs font-bold text-[#fda4af] transition hover:border-[#be123c] hover:text-white"
            >
              <span>ดูกราฟฉบับเต็มที่หน้าแดชบอร์ด</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* 1. Semi-Circular Gauge + Needle */}
            <article className="flex flex-col justify-between rounded-3xl border border-[#3a1d24] bg-[radial-gradient(120%_100%_at_50%_105%,rgba(153,27,27,0.25)_0%,rgba(18,18,24,0.98)_75%)] p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#4c1d24] bg-[#be123c]/15 text-[#fb7185]">
                    <Gauge size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">สัดส่วนความสำเร็จรวม</h3>
                    <p className="text-[11px] text-zinc-400">Completion Gauge</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-zinc-400">ทั้งหมด</span>
                  <p className="text-2xl font-extrabold tabular-nums text-white">
                    {numFmt.format(total)}
                  </p>
                </div>
              </div>

              <div className="relative mx-auto my-2 w-full max-w-[260px]">
                <svg viewBox="0 0 240 145" className="w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="ownerPoliceArc" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7f1d1d" />
                      <stop offset="55%" stopColor="#be123c" />
                      <stop offset="100%" stopColor="#fb7185" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 24 122 A 96 96 0 0 1 216 122"
                    fill="none"
                    stroke="#24242e"
                    strokeWidth="20"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 24 122 A 96 96 0 0 1 216 122"
                    fill="none"
                    stroke="url(#ownerPoliceArc)"
                    strokeWidth="20"
                    pathLength="100"
                    strokeDasharray={`${Math.max(compPct - 1.5, 0)} 100`}
                    strokeLinecap="round"
                  />
                  <path
                    d="M 24 122 A 96 96 0 0 1 216 122"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="20"
                    pathLength="100"
                    strokeDasharray={`${Math.max(pendPct - 1.5, 0)} 100`}
                    strokeDashoffset={-compPct}
                  />
                  <text x="58" y="55" fill="#fff" fontSize="10" fontWeight="700">
                    {pctFmt.format(compPct)}%
                  </text>
                  <text x="172" y="68" fill="#fde68a" fontSize="10" fontWeight="700">
                    {pctFmt.format(pendPct)}%
                  </text>
                  <g transform={`translate(120, 122) rotate(${needleAngle})`}>
                    <polygon points="-4,0 0,-42 4,0" fill="#f4f4f5" />
                    <circle cx="0" cy="0" r="7" fill="#be123c" stroke="#fda4af" strokeWidth="2" />
                  </g>
                </svg>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-zinc-300">
                <span>เสร็จสิ้น: <strong className="text-white">{numFmt.format(completed)}</strong></span>
                <span>ค้างดำเนินการ: <strong className="text-[#fda4af]">{numFmt.format(pending)}</strong></span>
              </div>
            </article>

            {/* 2. Dual Smooth Wave Breakdown */}
            <article className="flex flex-col justify-between rounded-3xl border border-[#3a1d24] bg-[radial-gradient(120%_100%_at_50%_105%,rgba(153,27,27,0.25)_0%,rgba(18,18,24,0.98)_75%)] p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#4c1d24] bg-[#be123c]/15 text-[#fb7185]">
                    <TrendingUp size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">เปรียบเทียบสองทะเบียนหลัก</h3>
                    <p className="text-[11px] text-zinc-400">ร้องทุกข์ 107 · อุทธรณ์ 109</p>
                  </div>
                </div>
                <span className="rounded-full border border-[#be123c] bg-[#1a1216] px-2.5 py-0.5 text-[10px] font-bold text-[#fda4af]">
                  +{pctFmt.format(compPct)}%
                </span>
              </div>

              <div className="my-2">
                <svg viewBox="0 0 280 110" className="w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="ownerWaveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#e11d48" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#e11d48" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[24, 48, 72, 92].map((y) => (
                    <line
                      key={y}
                      x1="20"
                      y1={y}
                      x2="268"
                      y2={y}
                      stroke="#272732"
                      strokeDasharray="2 3"
                    />
                  ))}
                  <path
                    d="M 20 75 C 55 55, 85 38, 120 44 C 155 50, 190 26, 225 32 C 245 35, 255 24, 268 22 L 268 92 L 20 92 Z"
                    fill="url(#ownerWaveFill)"
                  />
                  <path
                    d="M 20 82 C 55 70, 85 78, 120 65 C 155 54, 190 72, 225 58 C 245 50, 255 62, 268 54"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2"
                  />
                  <path
                    d="M 20 75 C 55 55, 85 38, 120 44 C 155 50, 190 26, 225 32 C 245 35, 255 24, 268 22"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-zinc-300">
                <span>ร้องทุกข์สำเร็จ 90.7%</span>
                <span className="text-[#fda4af]">อุทธรณ์สำเร็จ 65.1%</span>
              </div>
            </article>

            {/* 3. Vertical Gradient Pillars */}
            <article className="flex flex-col justify-between rounded-3xl border border-[#3a1d24] bg-[radial-gradient(120%_100%_at_50%_105%,rgba(153,27,27,0.25)_0%,rgba(18,18,24,0.98)_75%)] p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#4c1d24] bg-[#be123c]/15 text-[#fb7185]">
                    <BarChart3 size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">ขั้นตอนระบบวิเคราะห์ 6 ขั้น</h3>
                    <p className="text-[11px] text-zinc-400">6-Stage Legal Pipeline</p>
                  </div>
                </div>
                <span className="rounded-full border border-[#4c1d24] bg-[#1a1216] px-2.5 py-0.5 text-[10px] font-bold text-[#fda4af]">
                  Top Activity
                </span>
              </div>

              <div className="my-3 flex h-32 items-end justify-around gap-2 border-b border-white/10 pb-1 pt-5">
                {[
                  { label: "ตั้งเรื่อง", h: 55, active: false },
                  { label: "อ้างอิง", h: 72, active: false },
                  { label: "อาวุโส 50%", h: 96, active: true },
                  { label: "ข้อเท็จจริง", h: 82, active: false },
                  { label: "ร่างรายส่วน", h: 88, active: false },
                  { label: "ส่งออก Word", h: 68, active: false },
                ].map((bar) => (
                  <div key={bar.label} className="flex h-full flex-1 flex-col items-center justify-end">
                    {bar.active && (
                      <span className="mb-1 rounded-full border border-[#be123c] bg-[#1a1216] px-1.5 py-0.5 text-[9px] font-bold text-[#fda4af]">
                        50%
                      </span>
                    )}
                    <div
                      style={{ height: `${bar.h}%` }}
                      className={`w-full max-w-[26px] rounded-t-lg ${
                        bar.active
                          ? "bg-gradient-to-b from-[#fda4af] via-[#e11d48] to-[#4c0519] shadow-[0_0_24px_rgba(225,29,72,0.75)] ring-1 ring-white/30"
                          : "bg-gradient-to-b from-zinc-600/55 via-zinc-700/30 to-zinc-900/10"
                      }`}
                    />
                    <span className="mt-1.5 truncate text-[9.5px] text-zinc-400">{bar.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                <span className="text-zinc-400">มาตรฐานร่างคำวินิจฉัย ก.พ.ค.ตร.</span>
                <Link href="/analysis" className="font-bold text-[#fda4af] hover:underline">
                  เปิดใช้งาน →
                </Link>
              </div>
            </article>
          </div>
        </section>

        {/* Full Official Portrait & 4 Core Adjudication Standards */}
        <section
          id="owner-portrait"
          className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch"
        >
          <article className="overflow-hidden rounded-[2rem] border border-[#4c1d24] bg-[#101014] p-5 sm:p-6 lg:col-span-6 shadow-2xl">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#7f1d1d] bg-[#16161d]">
              <Image
                src={OWNER_PHOTO_WIDE}
                alt={`ภาพถ่ายทางการ ${OWNER_NAME} ${OWNER_ROLE} ณ สำนักงาน ก.พ.ค.ตร.`}
                fill
                sizes="(max-width: 1024px) 100vw, 680px"
                className="object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#be123c] to-[#881337] px-3 py-0.5 text-[11px] font-bold text-white">
                  <Landmark className="h-3 w-3" aria-hidden="true" />
                  <span>{OWNER_ORG_TH}</span>
                </span>
                <p className="mt-2 text-xl font-extrabold text-white">{OWNER_NAME}</p>
                <p className="text-xs text-[#fda4af]">
                  {OWNER_ROLE} · {OWNER_ORG_EN}
                </p>
              </div>
            </div>
          </article>

          <article className="flex flex-col justify-between rounded-[2rem] border border-[#3a1d24] bg-[#101014] p-6 sm:p-8 lg:col-span-6 shadow-2xl">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#be123c]/40 bg-[#be123c]/15 px-3 py-1 text-xs font-bold text-[#fda4af]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>มาตรฐานการพิจารณาวินิจฉัยและธรรมาภิบาลข้อมูล</span>
              </span>
              <h2 className="mt-3 text-2xl font-extrabold text-white">
                หลักการสำคัญในการปฏิบัติหน้าที่กรรมการ ก.พ.ค.ตร.
              </h2>

              <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {[
                  {
                    num: "๐๑",
                    title: "พิทักษ์ระบบคุณธรรม (Merit Protection)",
                    desc: "คุ้มครองให้การแต่งตั้งโยกย้ายและเลื่อนตำแหน่งข้าราชการตำรวจคำนึงถึงความรู้ความสามารถ ความเสมอภาค และความเป็นธรรม",
                    icon: Award,
                  },
                  {
                    num: "๐๒",
                    title: "ตรวจสอบสัดส่วนอาวุโส 50% อย่างแม่นยำ",
                    desc: "คำนวณจำนวนตำแหน่งว่างจริงและสัดส่วนโควตาอาวุโส 50% ตาม พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. 2565 และกฎ ก.ตร. ที่เกี่ยวข้อง",
                    icon: CheckCircle2,
                  },
                  {
                    num: "๐๓",
                    title: "อ้างอิงเฉพาะแหล่งข้อมูลที่ยืนยันแล้ว",
                    desc: "ข้อเท็จจริงและข้อกฎหมายทุกประเด็นต้องผูกกับเอกสารในสำนวนหรือคลังกฎหมายที่มีสถานะยืนยันแล้ว (Verified Sources Only)",
                    icon: FileCheck2,
                  },
                  {
                    num: "๐๔",
                    title: "มนุษย์เป็นผู้มีอำนาจวินิจฉัยสูงสุด",
                    desc: "เครื่องมือวิเคราะห์และ AI ทำหน้าที่ช่วยจัดระเบียบและตรวจสอบความครบถ้วนเท่านั้น ไม่ตัดสินแทนกรรมการหรือนิติกรผู้รับผิดชอบ",
                    icon: UserCheck,
                  },
                ].map((item) => (
                  <div
                    key={item.num}
                    className="rounded-2xl border border-[#2f1d22] bg-[radial-gradient(120%_100%_at_50%_105%,rgba(153,27,27,0.22)_0%,rgba(20,20,27,0.96)_75%)] p-4 transition hover:border-[#be123c]/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#fb7185]">
                        หลักการที่ {item.num}
                      </span>
                      <item.icon className="h-4 w-4 text-[#fda4af]" aria-hidden="true" />
                    </div>
                    <h3 className="mt-1.5 text-sm font-bold text-white">{item.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </section>

        {/* Bottom Section: Works & Core Systems */}
        <section
          id="owner-works"
          className="rounded-[2rem] border border-[#3a1d24] bg-[#101014] p-6 sm:p-10 shadow-2xl"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              ระบบงานหลักและโครงการดิจิทัล (Works & Core Systems)
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              ชุดเครื่องมือดิจิทัลสำหรับบริหารทะเบียนคุมสำนวน วิเคราะห์ข้อเท็จจริงและข้อกฎหมาย
              คำนวณสัดส่วนอาวุโส และจัดทำร่างคำวินิจฉัยของ{" "}
              <strong className="text-zinc-200">
                {OWNER_NAME} {OWNER_ROLE}
              </strong>
            </p>
          </div>

          <div
            role="tablist"
            aria-label="กรองหมวดหมู่ระบบงาน"
            className="mt-6 flex flex-wrap items-center justify-center gap-2"
          >
            {[
              { id: "all" as const, label: "ทั้งหมด" },
              { id: "registry" as const, label: "บริหารสำนวน" },
              { id: "analysis" as const, label: "วิเคราะห์และร่างคำวินิจฉัย" },
              { id: "knowledge" as const, label: "คลังความรู้และคุณภาพข้อมูล" },
            ].map((tab) => {
              const active = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    active
                      ? "bg-gradient-to-r from-[#be123c] via-[#991b1b] to-[#6b111b] text-white shadow-[0_8px_20px_-6px_rgba(225,29,72,0.65)]"
                      : "border border-white/10 bg-[#16161d] text-zinc-400 hover:border-[#be123c]/50 hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredWorks.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[#2f1d22] bg-[#16161d] transition duration-200 hover:-translate-y-1 hover:border-[#be123c]/70 hover:shadow-[0_20px_40px_-20px_rgba(185,28,28,0.5)]"
              >
                <div
                  className={`relative flex h-44 flex-col justify-between bg-gradient-to-br ${item.accentFrom} ${item.accentTo} p-6 border-b border-[#2f1d22]`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[11px] font-bold text-[#fda4af] backdrop-blur">
                      {item.badge}
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#be123c] to-[#881337] text-white shadow-md transition group-hover:scale-110">
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#be123c]/40 bg-[#101014]/90 text-[#fb7185] shadow-inner">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-lg bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-zinc-200">
                      {item.metrics}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#fb7185]">
                      {item.categoryLabel}
                    </p>
                    <h3 className="mt-1.5 text-lg font-extrabold text-white group-hover:text-[#fda4af] transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-zinc-400">{item.subtitle}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs font-bold text-zinc-300 group-hover:text-[#fda4af]">
                    <span>เข้าใช้งานระบบ</span>
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
