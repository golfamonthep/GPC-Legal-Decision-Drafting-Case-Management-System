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
# สถานะปัจจุบันของโปรเจกต์ GPC และกฎเหล็กเมื่อจบงาน (อัปเดตล่าสุด 2026-10-19)

1. **อ่านไฟล์ความจำหลักทันทีโดยไม่ต้องไล่อ่านประวัติเก่า**:
   - ข้อมูลสถานะปัจจุบันทั้งหมดถูกสรุปไว้ที่ส่วนต้นของ `SKILL.md` และ `PROJECT_STATE.md` แล้ว
   - ชื่อระบบ/อัตลักษณ์หน้าเว็บปัจจุบัน: **`พล.ต.อ.วิเชียร พจน์โพธิ์ศรี กรรมการ ก.พ.ค.ตร.`**
   - โครงสร้างหลักที่พัฒนาเสร็จแล้ว:
     - **AI Harness (`shared/ai-harness.mjs` & `src/lib/ai/*`)**: Provider-neutral (ค่าเริ่มต้น DeepSeek `deepseek-v4-pro`, `store: false`, JSON Schema, ไม่มี tools/web search, ไม่มี automatic fallback), ปิดบังข้อมูลส่วนบุคคล (Pseudonymization), ตรวจ Citation Allowlist, ตัด `<think>...</think>` CoT leakage และตรวจ Stale Revision (`409 Conflict` / `STALE_REVISION`) ทั้งก่อนและหลังเรียก AI ครบทุกเส้นทาง (`revisionGuard.ts`) โดยค่าเริ่มต้น `AI_ENABLED=false`
     - **หน้าแดชบอร์ด (`/dashboard`)**: มี `DashboardInteractiveHub.tsx` (4 แท็บอินเทอร์แอคทีฟ: เปรียบเทียบทะเบียน & สถานะ, ค้นหาเรื่องค้าง, ภาระงานนิติกร, เร่งด่วน & ความเคลื่อนไหว) คู่กับ `RegistryOverview.tsx`
     - **ระบบวิเคราะห์และร่างคำวินิจฉัย (`/analysis`)**: ครบ 6 แท็บตาม `docs/ANALYSIS-ONLY-SYSTEM-DESIGN-TH.md` พร้อมแถบสถานะ 6 ขั้นตอน, `KnowledgeRail`, แถบเช็กความพร้อมข้อมูลตั้งต้น, ปุ่มนำเข้าย่อหน้าคำร้อง/คำชี้แจงเป็นข้อกล่าวอ้าง, เครื่องคำนวณโควตาตำแหน่งว่างจริง 50%, ปุ่มแทรกถ้อยคำวินิจฉัยมาตรฐาน (`พิเคราะห์แล้วเห็นว่า`, `พิจารณาแล้วเห็นว่า`), ตัวอย่างหน้ากระดาษ `ร่างคำวินิจฉัยเบื้องต้น` พร้อมส่งออก `.docx` (ตรวจ SHA-256) และค้นหาเลขไทย `๐-๙` <-> `0-9`
   - ผลตรวจล่าสุด: `npm test` ผ่าน **82/82 ข้อ**, `analysis-app` ผ่าน **18/18 ข้อ**, `typecheck` & `lint` **0 errors**, `build` ผ่าน **35/35 routes**
2. **กฎเหล็กเมื่อจบงานทุกครั้ง (Mandatory End-of-Task Rule)**:
   - ทุกครั้งที่ทำงานและตรวจสอบ (`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`) เสร็จสิ้น:
     1. **อัปเดตสถานะปัจจุบันลงใน `SKILL.md`, `PROJECT_STATE.md` และ `AGENTS.md`** เพื่อให้รอบถัดไปทราบข้อมูลล่าสุดทันทีโดยไม่ต้องเสียเวลาไล่อ่านใหม่
     2. **Commit และ Push ขึ้น GitHub (`origin/main` และ branch งานปัจจุบัน) เพื่อทำการ Deploy ผ่าน Vercel อัปเดตหน้าเว็บไซต์ทันทีทุกครั้ง** โดยไม่ต้องรอให้ผู้ใช้สั่งซ้ำ
   - **ห้าม reset หรือ clean งานค้างใน `C:\APP`**: ให้ทำ Git commit/push ผ่าน clean worktree (`C:\Users\polic\.codex\worktrees\ai-harness\APP`) และซิงก์เฉพาะไฟล์ที่แก้ไขกลับมายัง `C:\APP`
<!-- END:gpc-project-current-state-and-deploy-rule -->

