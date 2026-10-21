import fs from 'fs';
import path from 'path';

const raw = JSON.parse(fs.readFileSync('scratch/policeworker_scraped_links.json', 'utf8'));

// Common navigation links to filter out
const ignoreTexts = new Set([
  'PoliceWorker', 'หน้าแรก', 'งานสารบรรณ', 'งานกำลังพล', 'งานนโยบาย/งานแผน',
  'งานยุทธศาสตร์', 'งานพัสดุ', 'งานงบประมาณ/การเงิน', 'งานวินัย', 'งานเทคโนโลยี',
  'งานสวัสดิการ', 'งานจริยธรรมและจรรยาบรรณ', 'การแต่งกาย', 'กฎหมาย/ระเบียบ',
  'ระเบียบการตำรวจไม่เกี่ยวกับคดี', 'ระเบียบการตำรวจเกี่ยวกับคดี', 'งานสอบสวน',
  'งานป้องกันปราบปราม', 'งานสืบสวน', 'งานจราจร', 'งานข่าวกรอง', 'การรักษาความปลอดภัย',
  'งานถวายความปลอดภัย', 'งานความมั่นคง', 'คำสั่ง ตร. เรื่อง กำหนดลักษณะงานและการมอบอำนาจหน้าที่ความรับผิ',
  'แต่งตั้ง วาระประจำปี 2569', 'แต่งตั้ง วาระประจำปี 2568', 'แต่งตั้ง วาระประจำปี 2567',
  'แต่งตั้ง วาระประจำปี 2566', 'แต่งตั้ง วาระประจำปี 2565', 'แต่งตั้ง วาระประจำปี 2564',
  'การศึกษา การฝึกอบรมและยุทธวิธี', 'หน่วยงานต่างๆ', 'ศูนย์ปฏิบัติการต่างๆ',
  'ศูนย์เรียนรู้', 'แผนที่งานตำรวจ', 'คู่มือ-หนังสือ-App', 'ดาวน์โหลด', 'เกี่ยวกับเรา',
  'ส่งคำแนะนำ/ความคิดเห็น', 'ตรวจสอบระดับสถานีตำรวจ', 'ตรวจสอบรุ่น นรต.'
]);

function categorize(title, section) {
  const t = title.toLowerCase();
  if (t.includes('วินัย') || t.includes('อุทธรณ์') || t.includes('ร้องทุกข์') || t.includes('ลงโทษ')) {
    return 'วินัยและการร้องทุกข์อุทธรณ์';
  }
  if (t.includes('แต่งตั้ง') || t.includes('กำลังพล') || t.includes('ลำดับอาวุโส') || t.includes('ปฏิบัติราชการ')) {
    return 'การแต่งตั้งและกำลังพล';
  }
  if (t.includes('มอบหมาย') || t.includes('อำนาจหน้าที่') || t.includes('คำสั่ง ตร.') || t.includes('ลักษณะงาน')) {
    return 'การมอบอำนาจหน้าที่และโครงสร้างบริหาร';
  }
  if (t.includes('นโยบาย') || t.includes('ยุทธศาสตร์') || t.includes('ผบ.ตร.')) {
    return 'นโยบายและแผนยุทธศาสตร์ ตร.';
  }
  if (t.includes('ไม่เกี่ยวกับคดี')) {
    return 'ระเบียบการตำรวจไม่เกี่ยวกับคดี';
  }
  if (t.includes('เกี่ยวกับคดี') || t.includes('สอบสวน') || t.includes('ป.วิ.อาญา') || t.includes('ป.อาญา')) {
    return 'ระเบียบการตำรวจเกี่ยวกับคดีและงานสอบสวน';
  }
  if (t.includes('ก.พ.ค.ตร.') || t.includes('ระบบคุณธรรม')) {
    return 'ก.พ.ค.ตร. และการพิทักษ์ระบบคุณธรรม';
  }
  return section || 'ระเบียบและแนวทางปฏิบัติราชการ ตร.';
}

function extractYear(title) {
  const m = title.match(/25[0-9]{2}/);
  return m ? parseInt(m[0], 10) : 2567;
}

const items = [];
const seen = new Set();

// Priority items that must be at the very top (highlighted NEW items from user request and screenshot)
const priorityItems = [
  {
    id: "discipline-regulation-2569",
    title: "กฎ ก.ตร. ว่าด้วยการดำเนินการทางวินัย พ.ศ. ๒๕๖๙ (๑๒ ต.ค. ๖๙)",
    shortTitle: "กฎ ก.ตร. วินัย ๒๕๖๙ (ฉบับใหม่ล่าสุด)",
    category: "วินัยและการร้องทุกข์อุทธรณ์",
    year: 2569,
    dateIssued: "2569-10-12",
    sourceUrl: "https://drive.google.com/file/d/19LZd1pbMTrF5nOZAtmjcqv-mQH_n5AR6/view",
    localFile: "scratch/policeworker/discipline-2569.pdf",
    summary: "กฎ ก.ตร. ออกตามความใน พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕ ว่าด้วยหลักเกณฑ์ วิธีการ และระยะเวลาการดำเนินการทางวินัย การสืบสวนข้อเท็จจริง และการสอบสวนพิจารณาโทษข้าราชการตำรวจ (ฉบับสมบูรณ์ ๙๑ หน้า)",
    isNew: true,
    badgeText: "NEW ล่าสุด 2569",
    authority: "ก.ตร. / สำนักงานตำรวจแห่งชาติ"
  },
  {
    id: "police-order-424-2569",
    title: "คำสั่ง ตร. ที่ ๔๒๔/๒๕๖๙ ลง ๑ ต.ค. ๖๙ เรื่อง กำหนดลักษณะงานและการมอบอำนาจหน้าที่ความรับผิดชอบให้ รอง ผบ.ตร. และ ผู้ช่วย ผบ.ตร.",
    shortTitle: "คำสั่ง ตร. ที่ ๔๒๔/๒๕๖๙ มอบอำนาจหน้าที่ รอง ผบ.ตร. และ ผู้ช่วย ผบ.ตร.",
    category: "การมอบอำนาจหน้าที่และโครงสร้างบริหาร",
    year: 2569,
    dateIssued: "2569-10-01",
    sourceUrl: "https://drive.google.com/file/d/1j7fi3Dl2QaI8gKGUFIt0gngsF___20iu/view",
    localFile: "scratch/policeworker/order-424-2569.pdf",
    summary: "คำสั่ง ตร. แบ่งมอบสายงานบังคับบัญชาด้านความมั่นคง กฎหมายและคดี ป้องกันปราบปราม สืบสวน กิจการพิเศษ และบริหารงานบุคคล ประจำปีงบประมาณ ๒๕๗๐",
    isNew: true,
    badgeText: "NEW ล่าสุด 2569",
    authority: "พล.ต.อ.สำราญ นวลมา ผบ.ตร."
  },
  {
    id: "police-policy-2570",
    title: "พล.ต.อ.สำราญ นวลมา ผบ.ตร. มอบนโยบายการปฏิบัติราชการ ตร. ประจำปีงบประมาณ ๒๕๗๐ (๙ ต.ค. ๖๙)",
    shortTitle: "นโยบาย ผบ.ตร. ประจำปีงบประมาณ ๒๕๗๐",
    category: "นโยบายและแผนยุทธศาสตร์ ตร.",
    year: 2570,
    dateIssued: "2569-10-09",
    sourceUrl: "https://drive.google.com/drive/folders/11f86a9G8YzD51-c73PKeECmBB0qAXlhG",
    summary: "แนวทางและวิสัยทัศน์การขับเคลื่อนสำนักงานตำรวจแห่งชาติ ประจำปีงบประมาณ ๒๕๗๐ ภายใต้การบริหารของ พล.ต.อ.สำราญ นวลมา ผบ.ตร.",
    isNew: true,
    badgeText: "NEW ล่าสุด 2570",
    authority: "พล.ต.อ.สำราญ นวลมา ผบ.ตร."
  },
  {
    id: "royal-decree-gpc-remuneration-2567",
    title: "พระราชกฤษฎีกาเงินประจำตำแหน่งและประโยชน์ตอบแทนอย่างอื่นของกรรมการพิทักษ์ระบบคุณธรรมข้าราชการตำรวจ พ.ศ. ๒๕๖๗",
    shortTitle: "พ.ร.ฎ.เงินประจำตำแหน่งและประโยชน์ตอบแทน ก.พ.ค.ตร. ๒๕๖๗",
    category: "ก.พ.ค.ตร. และการพิทักษ์ระบบคุณธรรม",
    year: 2567,
    dateIssued: "2567-01-01",
    sourceUrl: "https://drive.google.com/file/d/1PydpnYR8478sh3mSKl5sy5kmqxsKo5xg/view",
    summary: "พระราชกฤษฎีกากำหนดเงินประจำตำแหน่ง ค่าตอบแทน และสิทธิประโยชน์ของกรรมการพิทักษ์ระบบคุณธรรมข้าราชการตำรวจ (ก.พ.ค.ตร.) ตาม พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. ๒๕๖๕",
    isNew: false,
    badgeText: "ก.พ.ค.ตร. โดยตรง",
    authority: "ราชกิจจานุเบกษา / ก.พ.ค.ตร."
  }
];

for (const p of priorityItems) {
  items.push(p);
  seen.add(p.title);
  seen.add(p.sourceUrl);
}

// Ingest from scraped pages
for (const [sectionName, sectionData] of Object.entries(raw)) {
  for (const link of sectionData.links) {
    const text = link.text ? link.text.replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim() : '';
    const href = link.href.trim();
    if (!text || text.length < 5 || ignoreTexts.has(text)) continue;
    if (href.startsWith('https://www.facebook') || href.startsWith('https://fonts') || href.startsWith('#')) continue;
    if (seen.has(text) || seen.has(href)) continue;

    seen.add(text);
    seen.add(href);

    const year = extractYear(text);
    const category = categorize(text, sectionName);
    const isDrive = href.includes('drive.google.com');

    // Create unique slug
    const slug = text.slice(0, 40).replace(/[^a-zA-Z0-9\u0E00-\u0E7F]/g, '-').replace(/-+/g, '-').toLowerCase();

    items.push({
      id: `pw-${items.length + 1}-${slug}`,
      title: text,
      shortTitle: text.length > 60 ? text.slice(0, 57) + '...' : text,
      category,
      year,
      sourceUrl: href,
      summary: `เอกสารและระเบียบตำรวจจากสารระบบ PoliceWorker.one (${category}) ประจำปี ${year}`,
      isNew: year >= 2568,
      badgeText: year >= 2569 ? `ปี ${year}` : (category.includes('วินัย') ? 'วินัย ตร.' : null),
      authority: "สำนักงานตำรวจแห่งชาติ / ก.ตร."
    });
  }
}

console.log(`Compiled ${items.length} regulations and orders from PoliceWorker.one.`);
const outPath = path.resolve('src/data/thai-law/policeworker-regulations.json');
fs.writeFileSync(outPath, JSON.stringify(items, null, 2), 'utf8');
console.log(`Saved to ${outPath}`);
