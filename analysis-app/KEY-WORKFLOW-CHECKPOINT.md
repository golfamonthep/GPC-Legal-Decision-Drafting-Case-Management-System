# สถานะการเชื่อม AI Harness

19 ตุลาคม 2569: `analysis-app` ใช้ Harness กลางร่วมกับเว็บ GPC แล้ว ค่าเริ่มต้นคือ DeepSeek (`deepseek-v4-pro`) แต่ `AI_ENABLED=false` จนกว่าจะมี `AI_API_KEY` และ smoke test ด้วยข้อมูลสังเคราะห์ผ่าน

ตัวแปรอยู่ใน `C:\APP\analysis-app\.env.local` ฝั่ง server: `AI_ENABLED`, `AI_PROVIDER`, `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`, `AI_TIMEOUT_MS`, `AI_MAX_OUTPUT_TOKENS` ห้ามใช้ชื่อ `NEXT_PUBLIC_*` และห้ามบันทึก key ลง Git/รายงาน/log

ชุดทดสอบ mocked provider ยืนยัน JSON Schema, citation allowlist, pseudonymization/restore, ไม่มี tools/web search, key หาย, 401, 429, 5xx, timeout, JSON ผิด และคำตอบไม่ครบ ส่วนข้อมูล แก้ร่าง และ Word ยังทำงานได้เมื่อ AI ปิด

ยังไม่ถือว่า AI พร้อม Production จนกว่าจะติดตั้ง key ใน Preview, ทดสอบ Responses API จริงด้วยข้อมูลสังเคราะห์, ตรวจ audit metadata และยืนยันว่าปิดด้วย `AI_ENABLED=false` ได้ ห้ามใช้คดีจริงใน smoke test แรก
