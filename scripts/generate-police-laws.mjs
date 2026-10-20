import fs from 'fs';
import path from 'path';

const RAW_DIR = 'C:/Users/polic/.gemini/antigravity/brain/de5ac5fc-025e-4d6a-a90e-de7180a72e9d/scratch/raw';
const CRIMINAL_FILE = 'C:/Users/polic/.gemini/antigravity/brain/de5ac5fc-025e-4d6a-a90e-de7180a72e9d/scratch/criminal.csv';

const TARGET_PATHS = [
  'C:/Users/polic/.codex/worktrees/ai-harness/APP/src/data/thai-law/police-laws.json',
  'C:/APP/src/data/thai-law/police-laws.json'
];

const thaiNumMap = {
  '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
  '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9'
};

function toArabicNum(str) {
  if (!str) return '';
  return str.replace(/[๐-๙]/g, d => thaiNumMap[d] || d);
}

const actsConfig = [
  // 1. วินัย อุทธรณ์ ร้องทุกข์ และกำลังพลตำรวจ
  { id: 'police-act-2547', sysid: '646678', category: 'วินัย อุทธรณ์ ร้องทุกข์', type: 'section', prefix: 'มาตรา' },
  { id: 'ktr-appeal-2547', sysid: '441914', category: 'วินัย อุทธรณ์ ร้องทุกข์', type: 'rule', prefix: 'ข้อ' },
  { id: 'ktr-petition-2547', sysid: '446315', category: 'วินัย อุทธรณ์ ร้องทุกข์', type: 'rule', prefix: 'ข้อ' },
  { id: 'ktr-investigation-fact-2556', sysid: '687259', category: 'วินัย อุทธรณ์ ร้องทุกข์', type: 'rule', prefix: 'ข้อ' },
  { id: 'ktr-inquiry-2547', sysid: '453349', category: 'วินัย อุทธรณ์ ร้องทุกข์', type: 'rule', prefix: 'ข้อ' },
  { id: 'ktr-punish-power-2547', sysid: '453343', category: 'วินัย อุทธรณ์ ร้องทุกข์', type: 'rule', prefix: 'ข้อ' },
  { id: 'ktr-suspend-leave-2547', sysid: '453346', category: 'วินัย อุทธรณ์ ร้องทุกข์', type: 'rule', prefix: 'ข้อ' },
  { id: 'ktr-flagrant-offense-2547', sysid: '441910', category: 'วินัย อุทธรณ์ ร้องทุกข์', type: 'rule', prefix: 'ข้อ' },
  { id: 'ktr-filter-committee-2547', sysid: '647383', category: 'วินัย อุทธรณ์ ร้องทุกข์', type: 'rule', prefix: 'ข้อ' },
  { id: 'ktr-ethics-2551', sysid: '742041', category: 'วินัย อุทธรณ์ ร้องทุกข์', type: 'rule', prefix: 'ข้อ' },
  { id: 'ktr-discharge-ineff-2547', sysid: '441912', category: 'วินัย อุทธรณ์ ร้องทุกข์', type: 'rule', prefix: 'ข้อ' },
  { id: 'ktr-restore-status-2547', sysid: '446206', category: 'วินัย อุทธรณ์ ร้องทุกข์', type: 'rule', prefix: 'ข้อ' },
  { id: 'ktr-regular-reserve-2548', sysid: '458480', category: 'วินัย อุทธรณ์ ร้องทุกข์', type: 'rule', prefix: 'ข้อ' },
  { id: 'ktr-order-manner-2547', sysid: '453318', category: 'วินัย อุทธรณ์ ร้องทุกข์', type: 'rule', prefix: 'ข้อ' },
  { id: 'ktr-qualifications-2547', sysid: '591955', category: 'วินัย อุทธรณ์ ร้องทุกข์', type: 'rule', prefix: 'ข้อ' },
  
  // 2. กฎหมายอาญาและวิธีพิจารณา
  { id: 'witness-protection-2546', sysid: '387881', category: 'กฎหมายอาญาและวิธีพิจารณา', type: 'section', prefix: 'มาตรา' },
  { id: 'dsi-act-2547', sysid: '572217', category: 'กฎหมายอาญาและวิธีพิจารณา', type: 'section', prefix: 'มาตรา' },

  // 3. กฎหมายปกครองและการปฏิบัติราชการ
  { id: 'admin-court-2542', sysid: '648543', category: 'กฎหมายปกครองและการปฏิบัติราชการ', type: 'section', prefix: 'มาตรา' },
  { id: 'tortious-liability-2539', sysid: '302723', category: 'กฎหมายปกครองและการปฏิบัติราชการ', type: 'section', prefix: 'มาตรา' },
  { id: 'official-info-2540', sysid: '302231', category: 'กฎหมายปกครองและการปฏิบัติราชการ', type: 'section', prefix: 'มาตรา' },
  { id: 'pdpa-2562', sysid: '834296', category: 'กฎหมายปกครองและการปฏิบัติราชการ', type: 'section', prefix: 'มาตรา' },
  { id: 'pension-fund-2539', sysid: '641508', category: 'กฎหมายปกครองและการปฏิบัติราชการ', type: 'section', prefix: 'มาตรา' },
  { id: 'civil-pension-2494', sysid: '649562', category: 'กฎหมายปกครองและการปฏิบัติราชการ', type: 'section', prefix: 'มาตรา' },

  // 4. การรักษาความสงบเรียบร้อยและความมั่นคง
  { id: 'traffic-2522', sysid: '570840', category: 'การรักษาความสงบเรียบร้อยและความมั่นคง', type: 'section', prefix: 'มาตรา' },
  { id: 'immigration-2522', sysid: '310707', category: 'การรักษาความสงบเรียบร้อยและความมั่นคง', type: 'section', prefix: 'มาตรา' },
  { id: 'public-assembly-2558', sysid: '731248', category: 'การรักษาความสงบเรียบร้อยและความมั่นคง', type: 'section', prefix: 'มาตรา' },
  { id: 'emergency-decree-2548', sysid: '457954', category: 'การรักษาความสงบเรียบร้อยและความมั่นคง', type: 'section', prefix: 'มาตรา' },
  { id: 'internal-security-2551', sysid: '572742', category: 'การรักษาความสงบเรียบร้อยและความมั่นคง', type: 'section', prefix: 'มาตรา' },
  { id: 'gambling-2478', sysid: '301692', category: 'การรักษาความสงบเรียบร้อยและความมั่นคง', type: 'section', prefix: 'มาตรา' },
  { id: 'drug-suppression-2534', sysid: '304497', category: 'การรักษาความสงบเรียบร้อยและความมั่นคง', type: 'section', prefix: 'มาตรา' },
  { id: 'narcotics-2522', sysid: '342773', category: 'การรักษาความสงบเรียบร้อยและความมั่นคง', type: 'section', prefix: 'มาตรา' },
  { id: 'court-police-2562', sysid: '831191', category: 'การรักษาความสงบเรียบร้อยและความมั่นคง', type: 'section', prefix: 'มาตรา' },
  { id: 'water-police-2496', sysid: '303559', category: 'การรักษาความสงบเรียบร้อยและความมั่นคง', type: 'section', prefix: 'มาตรา' }
];

const catalog = [];
const actList = [];

// 1. Process Acts & Regulations from scratch/raw
for (const cfg of actsConfig) {
  const file = path.join(RAW_DIR, cfg.sysid + '.json');
  if (!fs.existsSync(file)) continue;
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const rawTitle = d.title.replace(/\s+/g, ' ').trim();
  const text = (d.txt || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  actList.push({
    id: cfg.id,
    sysid: cfg.sysid,
    title: rawTitle,
    category: cfg.category,
    source: 'สำนักงานคณะกรรมการกฤษฎีกา (Krisdika) / PyThaiNLP',
    sourceUrl: `https://krisdika.go.th/librarian/get?sysid=${cfg.sysid}&format=html`
  });

  const prefixPattern = cfg.prefix === 'ข้อ' ? 'ข้อ' : 'มาตรา';
  const regex = new RegExp('(?:^|\\n)\\s*(' + prefixPattern + '\\s+[๐-๙\\d]+(?:\\/[๐-๙\\d]+)?(?:\\s*\\[[^\\]]+\\])?)\\s*([\\s\\S]*?)(?=(?:\\n\\s*' + prefixPattern + '\\s+[๐-๙\\d]+|\\n\\s*หมวด|\\n\\s*ส่วนที่|$))', 'g');
  
  let match;
  let secIdx = 0;
  while ((match = regex.exec(text)) !== null) {
    const rawHeader = match[1].replace(/\s+/g, ' ').trim();
    let body = match[2].trim();
    
    // Clean whitespace
    body = body.replace(/[\t\v\f\r ]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    if (body.length < 5) continue;
    
    secIdx++;
    const numPartMatch = rawHeader.match(/[๐-๙\d]+(?:\/[๐-๙\d]+)?/);
    const secNum = numPartMatch ? numPartMatch[0] : String(secIdx);
    const secNumArabic = toArabicNum(secNum);
    const sectionLabel = `${cfg.prefix} ${secNum}`;
    const plainExcerpt = body.replace(/\n+/g, ' ').slice(0, 220).trim();
    
    catalog.push({
      id: `${cfg.id}-${cfg.prefix === 'ข้อ' ? 'rule' : 'sec'}-${secNumArabic.replace('/', '-')}`,
      actId: cfg.id,
      actTitle: rawTitle,
      category: cfg.category,
      sectionNum: secNum,
      sectionNumArabic: secNumArabic,
      sectionLabel,
      type: cfg.type,
      excerpt: plainExcerpt,
      content: body,
      source: 'สำนักงานคณะกรรมการกฤษฎีกา / PyThaiNLP',
      sourceUrl: `https://krisdika.go.th/librarian/get?sysid=${cfg.sysid}&format=html`
    });
  }
}

// 2. Process Criminal Code
if (fs.existsSync(CRIMINAL_FILE)) {
  const crimTitle = 'ประมวลกฎหมายอาญา พ.ศ. ๒๔๙๙ (ฉบับสมบูรณ์)';
  actList.push({
    id: 'criminal-code-2499',
    sysid: 'crim-code',
    title: crimTitle,
    category: 'กฎหมายอาญาและวิธีพิจารณา',
    source: 'PyThaiNLP thai-law dataset',
    sourceUrl: 'https://github.com/PyThaiNLP/thai-law'
  });

  const lines = fs.readFileSync(CRIMINAL_FILE, 'utf8').split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const firstComma = line.indexOf(',');
    if (firstComma === -1) continue;
    const article = line.slice(0, firstComma).trim();
    const rest = line.slice(firstComma + 1).trim();
    if (!article || article === 'null') continue;

    let text = rest;
    let notes = '';
    const lastComma = rest.lastIndexOf(',[');
    if (lastComma !== -1) {
      text = rest.slice(0, lastComma).trim();
      notes = rest.slice(lastComma + 1).trim();
    }

    const secNumArabic = article.startsWith('intro-') ? article : toArabicNum(article);
    const sectionLabel = article.startsWith('intro-') ? `บทนำ ${article.replace('intro-', '')}` : `มาตรา ${article}`;
    const plainExcerpt = text.slice(0, 220).trim();

    catalog.push({
      id: `crim-code-sec-${secNumArabic}`,
      actId: 'criminal-code-2499',
      actTitle: crimTitle,
      category: 'กฎหมายอาญาและวิธีพิจารณา',
      sectionNum: article,
      sectionNumArabic: secNumArabic,
      sectionLabel,
      type: 'section',
      excerpt: plainExcerpt,
      content: text,
      notes: notes || undefined,
      source: 'ประมวลกฎหมายอาญา / PyThaiNLP',
      sourceUrl: 'https://github.com/PyThaiNLP/thai-law'
    });
  }
}

const outData = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  totalSections: catalog.length,
  acts: actList,
  catalog
};

const jsonStr = JSON.stringify(outData);
console.log(`Generated ${catalog.length} sections across ${actList.length} Acts (${(jsonStr.length / 1024 / 1024).toFixed(2)} MB)`);

for (const p of TARGET_PATHS) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, jsonStr, 'utf8');
  console.log(`Written to: ${p}`);
}
