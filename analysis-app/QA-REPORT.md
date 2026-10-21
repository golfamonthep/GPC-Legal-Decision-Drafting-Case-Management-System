# ผลตรวจระบบวิเคราะห์ 9 ตุลาคม 2569

## หน้าโฮมและหน้าวิเคราะห์ 12 ตุลาคม 2569

Build Vite ผ่าน, TypeScript ทะเบียนผ่าน, unit 16 tests ผ่าน (เพิ่ม route/handoff และ snapshot empty/ready/query failure) ไม่มี schema change. Browser ของ Codex ตรวจจริงที่ฐาน QA แยก 4319: `/` แสดงโฮม → `/analysis` รายการ → สร้างงาน → กรอกข้อมูล → กดกลับถูกป้องกัน → บันทึก → URL งาน → แก้ร่าง → กดกลับถูกป้องกัน → บันทึกร่าง → โฮมแสดง 1 งาน/1 ฉบับ → เปิดงานจากตาราง → reload แล้วข้อความร่างคงเดิม → back/forward กลับถูกหน้า. แนบเอกสารข้อความจำลองด้วย API แล้วรีเฟรชแสดงรอตรวจ 1 ฉบับ

ทดสอบ query failure ด้วยการ rename ตาราง documents เฉพาะ SQLite QA ชั่วคราว: API คืน 503/ข้อความทั่วไป หน้าแสดง alert และไม่มี metric/table ศูนย์ปลอม Restore ตารางเดิมแล้วกดรีเฟรช กลับเป็น 1/1/1. ไม่เปลี่ยน schema/ข้อมูลใน `.state` หรือ Supabase. Console ไม่มี app error ก่อนทดสอบ failure; HTTP 503 ระหว่าง failure เป็นสิ่งที่ทดสอบโดยตั้งใจ

Browser desktop CSS 1536×1024 และมือถือ CSS 320×845 ตรวจ page identity, meaningful content, no framework overlay, interaction และ screenshot. มือถือ scrollWidth 305 <= 320 หลังแก้ entry rows จาก flex เป็น grid และตำแหน่ง sr-only ใน table header; ตารางมีข้อมูลเลื่อนภายใน wrapper. เปรียบเทียบ `home-concept.png` กับ `home-qa-desktop.jpg` ด้วย view_image detail original ในรอบเดียวกันแล้ว

| จุดตรวจ | หลักฐาน/การแก้ |
|---|---|
| ข้อความและเมนู | หน้าแรกมีแดชบอร์ด/ระบบวิเคราะห์/ฐาน/รับงาน/ตั้งค่า ตรงรายการใน home-design-spec; เพิ่ม timestamp และค่าจริงเป็นข้อแตกต่างที่จำเป็น |
| โครงและลำดับ | Sidebar, metric band, recent table, entry rows, source rail ตรงรูปแบบ; ย้ายหัวแดชบอร์ดเข้าคอลัมน์ซ้ายให้ rail เริ่มบนตาม concept |
| ตัวอักษร | Tahoma/Leelawadee และสเกลเดิม; Windows Thai น้ำหนักต่างจากภาพ generated ตามที่บันทึกไว้ |
| สีและพื้น | พื้นขาว navy/teal/slate/amber ตรง tokens ไม่เพิ่มภาพหรือกราฟสาธิต |
| Containers/spacing | ไม่มี card grid; sidebar คง 255px เดิมแทนประมาณ 288px ใน concept, rail/ปุ่มใช้ family เดิม |
| Icons | ใช้ outline SVG home/file/folder/database/settings/refresh/arrow จริง; rail icons คงของระบบเดิม |
| Responsive | ปรับ metric numbers ให้ baseline ตรง, entry rows อ่านได้, ไม่มี page overflow ที่ 320px |

ตรวจ copy เหนือ fold: ไม่มีข้อความตกแต่งเพิ่ม; timestamp/ข้อมูล QA/สถานะการทำงานเป็น dynamic copy ที่จำเป็น ความต่างที่ตั้งใจอยู่ใน home-design-spec. ตรวจเทียบแบบและหน้าจอจริงโดยคง design system เดิมแล้ว ขอบเขตนี้เป็นหน้าโฮม/วิเคราะห์ในเครื่อง ไม่ใช่ deploy หรือการฟื้น Supabase. ทางเข้าทะเบียน typecheck ผ่าน แต่ใช้งานฐานจริงยังติด config เดิม ไม่มีการเปลี่ยน credentials/auth

ส่งมอบ build ล่าสุดบนพอร์ต 4318: health ok, snapshot empty/0 งาน/0 เอกสารรอตรวจ/0 ฉบับ; Browser เปิดหน้าโฮม → `/analysis` → reload → สร้างงานเปล่า → กลับโฮม ผ่านโดยไม่มีการบันทึกข้อมูลทดสอบจริง. Console ไม่มี errors/warnings. ภาพ `home-current.jpg` จากแท็บใหม่ CSS 1536×1024 (scrollWidth 1521), ตรวจคู่กับ concept ด้วย view_image detail original แล้ว; แท็บเก่ามี zoom ค้างทำให้ screenshot scale ต่าง จึงไม่ใช้เป็นหลักฐาน desktop. ตรวจขนาดหน้าต่างเดิม CSS 695 ไม่มี page overflow และจัดปุ่ม entry ใน tablet ให้อยู่บรรทัดถัดไป. คืน viewport ปกติ ปิด QA server และล้างเฉพาะ `.qa/home`; เปิดแท็บโฮมใช้งานต่อไว้. ภาพอยู่โฟลเดอร์ visualizations ของแชต: `home-current.jpg`, `home-qa-desktop.jpg`, `home-mobile.jpg`, `home-qa-error.jpg`. ไม่มี deployment หรือ secret ถูกเปลี่ยน

## เพิ่มจุดเชื่อม 12 ตุลาคม 2569

ระบบทะเบียน TypeScript และส่วนวิเคราะห์ build ผ่าน; unit รวม 13 tests ผ่าน; integration 19 สถานการณ์เดิมกับ transfer integration ผ่าน Browser ของ Codex ทดสอบคอมโพเนนต์ CaseAnalysisPanel จริงกับ repository/Storage จำลองที่ 4320 → API วิเคราะห์/SQLite QA จริงที่ 4319 → ตรวจรับงาน → เอกสารที่เลือกมา 1 ฉบับและยังรอตรวจ → แก้/บันทึกร่าง → จัด Word กับผลจากฉบับเดียวกัน → ส่งกลับหน้าสำนวน → ตรวจ/ยืนยันแนบสำเร็จ 1 ฉบับ สถานะจำลอง unchanged ไม่ใช่การทดสอบแนบ Supabase จริง

ตรวจหน้าไม่ว่าง ไม่มี framework overlay ทะเบียน fixture ไม่มี console errors ฝั่งวิเคราะห์มี Electron sandbox_bundle errors ตอนเปิด popup ซึ่งเป็นของ Browser host; แอปยังโหลดและทำรอบส่งกลับสำเร็จ ไม่มี error จาก bundle ของแอป Desktop CSS 1280 × 720 และหน้าวิเคราะห์ที่ CSS กว้าง 557 ไม่ล้นแนวนอน เครื่องมือ screenshot บางตัวเปลี่ยนสเกล จึงใช้ tab.screenshot สำหรับภาพหลัก หลักฐานอยู่ `C:\Users\polic\.codex\visualizations\2026\10\09\01a11f50-3a7d-7f23-bc4a-5196cb79b976\bridge-roundtrip.jpg` แสดงชัดว่าเป็น QA ข้อมูลจำลอง

ยังไม่ผ่านฐานจริง: dev registry HTTP 500 เพราะไฟล์ที่โหลดไม่มีค่าฐาน/Storage; ไฟล์สำรองมี URL ที่ไม่สมบูรณ์/placeholder/localhost ที่เชื่อมไม่ได้ ตรวจ Supabase connector พบโปรเจกต์เดิม GPC-Legal-Decision-Drafting-Case-Management-System (`tlqszhlggvoirhalsxge`) สถานะ INACTIVE ยังไม่ได้ restore ไม่ได้คัดลอก credentials หรือแก้ข้อมูลจริง ส่งคำถามขอพาธไฟล์ตั้งค่าเดิมแล้ว ยังรอคำตอบ ไม่มีการ deploy และไม่ได้ทดสอบ file chooser ของ JSON fallback ในรอบนี้ AI ยังรอ approval เดิม ดูคู่มือจุดเชื่อมสำหรับขั้นตอนตั้งค่าและ legacy auth none/admin limitation

สถานะ: แอปในเครื่องรับข้อมูล ตรวจเอกสารและแหล่ง แก้ร่าง เก็บฉบับ และส่งออก Word ได้ ส่วนเรียก AI ยังไม่ได้ทดสอบบริการจริงเพราะไม่มี key ที่ได้รับอนุมัติ ไม่ถือว่าระบบพร้อมเปิดผ่านอินเทอร์เน็ตหรือรับรองผลวิเคราะห์ทางกฎหมายแล้ว

## ตรวจการทำงาน

- Vite build ผ่าน React 19 / Vite 7.3.7; unit tests 6 ผ่าน
- integration 19 สถานการณ์ผ่านในฐานทดสอบแยกพอร์ต 4319: งาน A/B; เอกสารงานอื่นเปิดหรือแก้ไม่ได้; ยืนยันข้อเท็จจริงด้วยเอกสารต่างงานไม่ได้; ปฏิเสธรุ่นข้อมูลเก่า; ตรวจและอนุมัติข้อความแหล่ง; ปฏิเสธแหล่งอาวุโสเก่า; ไม่คำนวณโควตาขาดแหล่ง; เก็บหลักฐานและร่างแบบ snapshot; แก้หลักฐานแล้วยกเลิกสถานะข้อเท็จจริง; ร่างใหม่ไม่แก้ฉบับเดิม; ส่งออกฉบับที่เลือก; ปฏิเสธส่งออกฉบับต่างงาน; ปฏิเสธ Origin ภายนอกและเส้นทาง .state/.private/.env
- ตรวจ hash 27 ไฟล์ SQLite และ fingerprint ตรง ใช้ SQLite ต้นทาง read-only แหล่ง PDF 7 ฉบับ แต่งตั้ง 281 ราย อาวุโสตรวจภาพ 181 ราย บัญชี 13 ประเภท กฎหมาย/ตัวอย่างค้นจากข้อความ canonical ไม่ใช้ข้อความดัชนีเป็น authority
- Browser Chrome: สร้างงาน → แก้ร่าง → สลับผลวิเคราะห์/ร่างโดยข้อความไม่หาย → บันทึกฉบับ → preview ฉบับ → สร้างและดาวน์โหลด Word ผ่าน ไฟล์ที่ดาวน์โหลดมีข้อความมนุษย์ครบ
- อัปโหลดผ่าน API และถอด/ตรวจข้อความผ่าน การแนบผ่านเครื่องมือ Chrome ทดสอบต่อไม่ได้เนื่องจากส่วนขยายยังไม่ได้เปิด Allow access to file URLs ไม่ได้เปลี่ยนสิทธิ์ส่วนขยาย การเลือกไฟล์จริงโดยผู้ใช้ต้องลองในเครื่องอีกครั้ง
- Word จากฉบับแรกถูกเลือกหลังมีฉบับใหม่ ตรวจเนื้อหาด้วย python-docx และ render 2 หน้า แล้ว view_image ทุกหน้า ไม่มีข้อความทับ/ล้น ภาษาไทยกับเลขหน้าครบ เอาเส้นสีของแม่แบบออกแล้ว แม่แบบร่างนี้ยังไม่ใช่แม่แบบราชการที่รับรอง
- เปิด build จริงด้วย Start-Analysis.ps1 ที่ 127.0.0.1:4318 health ok, ฐานใช้งานจริง 0 งาน ไม่ปนข้อมูลทดสอบ
- Browser console ของ Chrome พบข้อความจาก Grammarly extension ไม่มีข้อผิดพลาดแอปที่ยังค้างจากรอบตรวจสุดท้าย ข้อผิดพลาด API ระหว่าง dev watcher อ่านเครื่องมือ render ถูกแก้ด้วย watch exclusions และส่งมอบจาก production build

## ตรวจหน้าจอเทียบต้นแบบ

Concept: `concept.png` 1536 × 1024. หลักฐาน Browser: `screen-current.jpg` เป็นภาพ desktop รอบปรับ typography แล้ว (สำเนา bytes จาก `screenshot-mobile.png` ซึ่งชื่อไฟล์เดิมคลาดเคลื่อน), `screenshot-desktop.png` รอบก่อนปรับสเกล, `screenshot-desktop.jpg` จาก Browser ของ Codex, `screenshot-mobile.jpg` จากจอมือถือ ใช้ view_image เทียบ concept และภาพจริงก่อนส่งมอบ ไม่ใช้ screenshot เป็น UI

| จุดตรวจ | แบบและหน้าจอจริง | การแก้/ข้อแตกต่าง |
|---|---|---|
| ข้อความ | หัวข้อ sidebar, 5 ขั้นตอน, ชื่อช่อง และฐาน 281/181 ตรง allowed copy | ไม่มีข้อความโฆษณาหรือข้อมูลคดีที่แต่งขึ้นบนหน้าสร้าง |
| โครง | sidebar ซ้าย ฟอร์มเปิดสองคอลัมน์ rail อ้างอิงขวา | ปรับความกว้าง rail และระยะขอบตามแบบ ไม่เพิ่ม card grid |
| ตัวอักษร | Thai sans-serif มีหัวข้อ/label/control แยกขนาด | เพิ่ม h1/h2 และ label; Tahoma บน Windows รูปทรงต่างจากภาพแนวออกแบบ เป็นการปรับที่จำเป็นให้ภาษาไทยอ่านได้ |
| สี | พื้นขาว กรมท่า teal เส้นเทา amber ของช่องว่าง | ตรง family; ไม่มีภาพตกแต่งหรือ overlay |
| ช่องกรอก | ขอบบาง มุมเล็ก textarea 3 ส่วน | ลดความสูง textarea ให้ประเด็น/คำขออยู่ในองค์ประกอบจอ; ระดับและประเภทใช้สอง select เพื่อยืนยันบัญชี เป็นความต่างที่จำเป็นตาม workflow |
| Icons | outline file/database/settings/back/open | ใช้ SVG ในโค้ดจริง ขนาด/สีสอดคล้อง |
| มือถือ | จอ CSS 390 × 845 form 1 คอลัมน์ sidebar static หน้าไม่ล้นแนวนอน | ขั้นตอนเลื่อนแนวนอนได้ตามตั้งใจ rail อยู่ท้ายแบบฟอร์ม; รูปมือถือบันทึกผ่าน Browser ของ Codex |

เทียบ copy หน้าแรกแล้วไม่มีข้อความสำคัญที่เพิ่ม/หายจากรายการใน design-spec.md นอกจาก placeholder ของ select ที่จำเป็น ไม่รวมข้อความแจ้งผลเมื่อผู้ใช้กดปุ่มและส่วน workflow ที่ผู้ใช้ร้องขอ

Native-size: ตรวจ Chrome CSS 1536 × 1024 และ Browser ของ Codex CSS 1536 × 1024 (ต้องชดเชย zoom ของ Browser) ภาพที่ API บันทึกมีขนาดพิกเซลต่างจาก CSS viewport บางรอบ Chrome screenshot/viewport หมดเวลา จึงเก็บหลักฐานเพิ่มเติมใน Browser ของ Codex ไม่ใช้ shell Playwright

ตรวจความสอดคล้องกับต้นแบบครบด้านข้อความ layout typography สี containers ระยะและ icons แล้ว ความต่างที่ตั้งใจคือฟอนต์ Windows, select แยกสองช่อง และส่วนงานที่จำเป็นตาม workflow ไม่มีภาพ asset ที่ขาดหรือหน้าจอเปล่า

## สิ่งที่ยังไม่ผ่าน

เก็บผลทดสอบและภาพ Word ที่ตรวจแล้วไว้ใน `evidence/integration-result.json` และ `evidence/word-page-1.png`, `word-page-2.png` หยุดเซิร์ฟเวอร์ทดสอบ 4319 และล้าง `.qa` รวมฐาน/เครื่องมือ render ชั่วคราวแล้ว เซิร์ฟเวอร์ใช้งานจริง 4318 ยังเปิดและมี 0 งานทดสอบ

AI service: ระบบตรวจสอบอัตโนมัติปฏิเสธสร้าง API key ไม่หมดอายุ เนื่องจากไม่ได้ยืนยันบัญชี ขอบเขต และอายุชัดเจน ยังไม่มี key ถูกสร้างหรือเขียน `.env.local` ส่งคำขออนุมัติใหม่แบบจำกัด 30 วันสำหรับ Personal / Default project แล้วและยังรอคำตอบ ไม่มีการลองสร้างซ้ำหรือเลี่ยงผ่าน UI

การยืนยันรหัสอ้างอิงด้วยโค้ดไม่ใช่การตรวจว่าอ้างอิงรองรับข้อความทางกฎหมายทุกประโยค ต้องตรวจข้อเสนอโดยมนุษย์ การสแกนที่ไม่มีข้อความต้องถอดเอง รุ่นนี้ไม่มี OCR อัตโนมัติทั้งหมด ไม่ใช่ระบบทะเบียนหรือระบบหลายผู้ใช้
