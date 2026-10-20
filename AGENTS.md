<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:user-global-skill-defaults -->
# User skill defaults for every project

The user explicitly wants Ponytail, Archify, Impeccable, and Caveman considered on every task in every project, including C:\APP. At the start of each session, read these installed primary SKILL.md files from C:\Users\polic\.codex\skills, and consider their applicability on every turn:

- ponytail/SKILL.md: default to full mode for coding, debugging, refactoring, reviews, and dependency choices. Complete the requested scope with the smallest readable change; preserve validation, error handling, security, accessibility, and required checks.
- caveman/SKILL.md: use concise, clear replies by default in the user's language, normally Thai. Preserve all essential facts, exact code, commands, paths, numbers, negations, and verification limits. Use ordinary complete prose for persisted documents, factual case content, and questions. Do not activate ultracave or megacave unless requested.
- impeccable/SKILL.md: use for frontend design, implementation, refinement, UI copy, and UI reviews. For case-management screens, prefer Operate mode: readable case lists, clear form labels, searchable information, accessible controls, and consistent status presentation. Preserve factual case text unless the user asks to edit it.
- archify/SKILL.md: use for architecture, process, relationship, schema, state, and timeline diagrams, or when a diagram materially clarifies the requested work. Keep diagrams grounded in supplied facts and repository evidence.

Apply the relevant skill workflow automatically without asking the user to select it again.
<!-- END:user-global-skill-defaults -->

<!-- BEGIN:gpc-project-current-state-and-deploy-rule -->
# สถานะปัจจุบันของโปรเจกต์ GPC และกฎเหล็กเมื่อจบงาน (อัปเดตล่าสุด 2026-10-20)

1. **อ่านไฟล์ความจำหลักทันทีโดยไม่ต้องไล่อ่านประวัติเก่า**:
   - ข้อมูลสถานะปัจจุบันทั้งหมดถูกสรุปไว้ที่ส่วนต้นของ `SKILL.md` และ `PROJECT_STATE.md` แล้ว
   - ชื่อระบบ/อัตลักษณ์หน้าเว็บปัจจุบัน: **`พล.ต.อ.วิเชียร พจน์โพธิ์ศรี กรรมการ ก.พ.ค.ตร.`**
   - โครงสร้างหลักที่พัฒนาเสร็จแล้ว:

- **ปรับปรุง Light Mode และป้ายข้อความสีแดง (Light Mode & Red Badge Contrast Fix)**:
  - แก้ไขปัญหาป้ายและชิปใน Light Mode ให้แสดงผลเป็นโทนสว่างนุ่มนวลกลมกลืนตา (`#f1f5f9` ขอบ `#cbd5e1` หรือ `#e2e8f0`) ไม่เป็นปื้นสีดำผิดเพี้ยน
  - กำหนดให้ตัวอักษรและไอคอนทั้งหมดบนป้ายสีแดงตำรวจ ปุ่มสีแดง และแคปซูลเมนูที่แอกทีฟ (`bg-[#991b1b]`, `bg-[#c81e2b]`, `bg-[#d62839]`, `from-[#d62839]`, `bg-red-6*`, `cyber-pill-active`) เป็น **สีขาวสนิท (`#ffffff !important`)** เสมอ
- **ปุ่มสลับ Dark/Light Mode อยู่ที่มุมขวาบนสุดของเว็บเด่นชัด**:
  - ย้ายและปรับแต่ง `ThemeToggle` ให้ติดตั้งที่ตำแหน่งขวาสุดของ `TopHeader.tsx` (มุมขวาบนสุดของทุกหน้าจอ) มีป้ายบอกสถานะ `☀️ โหมดสว่าง` / `🌙 โหมดมืด` คมชัดสูง พร้อมขอบและเงาเด่นชัด
- **กำหนด Light Mode เป็นค่าเริ่มต้นอย่างเคร่งครัด (Strict Default Light Mode)**:
  - กำหนด `data-theme="light"` และคลาส `light` ตั้งแต่แท็ก `<html>` ใน `layout.tsx` พร้อม pre-hydration inline script บังคับ Light Mode ยกเว้นผู้ใช้จะเลือกสลับเป็น dark ด้วยตนเอง
- **อัปเดตภาพบุคคลใหม่จากไฟล์แนบและเพิ่มขนาดอวตาร์ 1 ระดับ**:
  - ไดคัทตัวบุคคล **พล.ต.อ.วิเชียร พจน์โพธิ์ศรี** (ท่ายืนกอดอก) จากภาพถ่ายล่าสุด ลบฉากหลังเดิมออก วางบนพื้นแดงตำรวจ `#991b1b` (`public/owner/wichian-studio-red.jpg` และ `public/owner/wichian-cutout.png`)
  - เพิ่มขนาดอวตาร์โปรไฟล์ขึ้น 1 ระดับทั่วทั้งระบบ:
    - `TopHeader.tsx`: ขยายเป็น `h-10 w-10` (40px)
    - `Sidebar.tsx`: ขยายเป็น `h-14 w-14` (56px)
    - `dashboard/page.tsx`: ขยายเป็น `h-12 w-12` (48px)

   - ผลตรวจล่าสุด: `npm test` ผ่าน **83/83 ข้อ**, `analysis-app` ผ่าน **18/18 ข้อ**, `typecheck` & `lint` **0 errors**, `build` ผ่าน **35/35 routes**
2. **กฎเหล็กเมื่อจบงานทุกครั้ง (Mandatory End-of-Task Rule)**:
   - ทุกครั้งที่ทำงานและตรวจสอบ (`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`) เสร็จสิ้น:
     1. **อัปเดตสถานะปัจจุบันลงใน `SKILL.md`, `PROJECT_STATE.md` และ `AGENTS.md`** เพื่อให้รอบถัดไปทราบข้อมูลล่าสุดทันทีโดยไม่ต้องเสียเวลาไล่อ่านใหม่
     2. **Commit และ Push ขึ้น GitHub (`origin/main` และ branch งานปัจจุบัน) เพื่อทำการ Deploy ผ่าน Vercel อัปเดตหน้าเว็บไซต์ทันทีทุกครั้ง** โดยไม่ต้องรอให้ผู้ใช้สั่งซ้ำ
   - **ห้าม reset หรือ clean งานค้างใน `C:\APP`**: ให้ทำ Git commit/push ผ่าน clean worktree (`C:\Users\polic\.codex\worktrees\ai-harness\APP`) และซิงก์เฉพาะไฟล์ที่แก้ไขกลับมายัง `C:\APP`
<!-- END:gpc-project-current-state-and-deploy-rule -->
