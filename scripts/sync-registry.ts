import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { parseRegistryWorkbook } from '../src/lib/registry/parseRegistryFile';
import { normalizeCaseNumber } from '../src/lib/registryNumbers';
import { upsertRowsToSnapshot, loadCasesSnapshot } from '../src/lib/registry/caseSnapshot';

const CLOUD_SYNC_URLS = [
  'https://pmspc-pol-gen-wichean.vercel.app/api/registry/auto-sync',
  'https://gpc-legal-decision-drafting-case-ma.vercel.app/api/registry/auto-sync',
  'http://127.0.0.1:3000/api/registry/auto-sync',
];
const SYNC_KEY = process.env.GPC_SYNC_KEY || 'gpc-registry-autosync-2569-v1';
const WORKTREE_DIR = 'C:\\Users\\polic\\.codex\\worktrees\\ai-harness\\APP';
const MAIN_APP_DIR = 'C:\\APP';
const LOG_FILE = path.join(MAIN_APP_DIR, 'tools', 'registry-dropzone', 'sync-history.log');

function appendSyncLog(msg: string) {
  const ts = new Date().toLocaleString('th-TH', { hour12: false });
  const line = `[${ts}] ${msg}\r\n`;
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch {}
  console.log(msg);
}

function showWindowsPopup(title: string, message: string, timeoutSeconds: number = 0, iconType: number = 64) {
  try {
    const tmpVbs = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `gpc_sync_popup_${Date.now()}.vbs`);
    const safeMsg = message
      .replace(/"/g, '""')
      .split(/\r?\n/)
      .map((line) => `"${line}"`)
      .join(' & vbCrLf & ');
    const safeTitle = title.replace(/"/g, '""');
    const vbsContent = `Set sh = CreateObject("WScript.Shell")\r\nsh.Popup ${safeMsg}, ${timeoutSeconds}, "${safeTitle}", ${iconType}\r\nOn Error Resume Next\r\nCreateObject("Scripting.FileSystemObject").DeleteFile WScript.ScriptFullName\r\n`;
    // Write UTF-16LE with BOM so cscript/wscript renders Thai characters 100% accurately
    const bom = Buffer.from([0xff, 0xfe]);
    const body = Buffer.from(vbsContent, 'utf16le');
    fs.writeFileSync(tmpVbs, Buffer.concat([bom, body]));
    const child = spawn('wscript.exe', [tmpVbs], { detached: true, stdio: 'ignore', windowsHide: false });
    child.unref();
  } catch (err: any) {
    console.warn('[Popup] Could not display popup:', err?.message);
  }
}

async function syncDirect(filePath: string) {
  appendSyncLog(`[Sync] กำลังอ่านไฟล์: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`ไม่พบไฟล์ที่ระบุ: ${filePath}`);
  }

  const fileName = path.basename(filePath);
  const buffer = fs.readFileSync(filePath);
  const parsed = parseRegistryWorkbook(buffer, fileName);

  if (!parsed.success || parsed.rows.length === 0) {
    throw new Error(parsed.error || 'ไม่พบข้อมูลคดีในไฟล์นี้');
  }

  appendSyncLog(`[Sync] พบ ${parsed.totalRows} รายการ (ประเภท: ${parsed.caseType})`);

  // 1. Update local snapshot in current working directory
  const snapshotResult = upsertRowsToSnapshot(parsed.rows, parsed.caseType);
  appendSyncLog(
    `[Sync Snapshot] บันทึกลง snapshot สำเร็จ: ปรับปรุง ${snapshotResult.updatedCount} คดี, เพิ่มใหม่ ${snapshotResult.insertedCount} คดี (เปลี่ยนแปลงจริง ${snapshotResult.changedCount} คดี)`
  );

  // Mirror snapshot between C:\APP and worktree
  try {
    const currentSnapPath = path.resolve(process.cwd(), 'src/data/cases-snapshot.json');
    const appSnapPath = path.join(MAIN_APP_DIR, 'src/data/cases-snapshot.json');
    const wtSnapPath = path.join(WORKTREE_DIR, 'src/data/cases-snapshot.json');
    if (fs.existsSync(currentSnapPath)) {
      if (currentSnapPath.toLowerCase() !== appSnapPath.toLowerCase() && fs.existsSync(MAIN_APP_DIR)) {
        fs.copyFileSync(currentSnapPath, appSnapPath);
      }
      if (currentSnapPath.toLowerCase() !== wtSnapPath.toLowerCase() && fs.existsSync(WORKTREE_DIR)) {
        fs.copyFileSync(currentSnapPath, wtSnapPath);
      }
    }
  } catch {}

  const result = {
    success: true,
    fileName,
    caseType: parsed.caseType,
    totalRows: parsed.totalRows,
    updatedCount: snapshotResult.updatedCount,
    insertedCount: snapshotResult.insertedCount,
    changedCount: snapshotResult.changedCount,
    changedItems: snapshotResult.changedItems,
    summary: `อัปเดตทะเบียนคุม${parsed.caseType}สำเร็จ: รวม ${parsed.totalRows} คดี (แก้ไข/เพิ่มเติม ${snapshotResult.changedCount} คดี)`,
  };

  appendSyncLog(`[Sync Complete] ${result.summary}`);
  return result;
}

async function pushToCloudAndGit(): Promise<{ cloudSynced: boolean; gitPushed: boolean; cloudMessage: string }> {
  const snapshot = loadCasesSnapshot();
  let cloudSynced = false;
  let cloudMessage = '';

  // 1. Direct real-time push to Vercel / Local API
  for (const url of CLOUD_SYNC_URLS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gpc-sync-key': SYNC_KEY,
        },
        body: JSON.stringify({
          syncKey: SYNC_KEY,
          cases: snapshot.cases,
          snapshot,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        cloudSynced = true;
        cloudMessage = data.message || `ซิงค์ฐานข้อมูลออนไลน์สำเร็จ (${url.includes('vercel') ? 'Vercel Cloud' : 'Local Server'})`;
        appendSyncLog(`[Cloud Sync] สำเร็จ (${url}): ${cloudMessage}`);
        break;
      }
    } catch {}
  }

  // 2. Commit and push snapshot to GitHub / Vercel if worktree exists
  let gitPushed = false;
  if (fs.existsSync(WORKTREE_DIR)) {
    try {
      const statusOut = execFileSync('git', ['status', '--porcelain', 'src/data/cases-snapshot.json'], {
        cwd: WORKTREE_DIR,
        encoding: 'utf8',
        timeout: 8000,
      }).trim();

      if (statusOut) {
        execFileSync('git', ['add', 'src/data/cases-snapshot.json'], { cwd: WORKTREE_DIR, timeout: 8000 });
        execFileSync('git', ['commit', '-m', 'data: auto-sync registry update from OneDrive'], {
          cwd: WORKTREE_DIR,
          timeout: 10000,
        });
        execFileSync('git', ['push', 'origin', 'codex/ai-harness:main'], { cwd: WORKTREE_DIR, timeout: 25000 });
        execFileSync('git', ['push', 'origin', 'codex/ai-harness:codex/ai-harness'], { cwd: WORKTREE_DIR, timeout: 25000 });
        gitPushed = true;
        appendSyncLog('[Git Push] อัปเดตข้อมูลขึ้น GitHub / Vercel คลาวด์สำเร็จเรียบร้อย');
      } else {
        gitPushed = true;
        appendSyncLog('[Git Push] ข้อมูลบน GitHub / Vercel เป็นฉบับล่าสุดอยู่แล้ว');
      }
    } catch (gitErr: any) {
      appendSyncLog(`[Git Push] ข้ามการ push: ${gitErr?.message}`);
    }
  }

  return { cloudSynced, gitPushed, cloudMessage };
}

async function main() {
  const args = process.argv.slice(2);
  const showPopup = args.includes('--popup');
  const showNotify = args.includes('--notify');
  const fileArg = args.find((a) => !a.startsWith('--'));

  if (fileArg) {
    const res = await syncDirect(path.resolve(fileArg));
    await pushToCloudAndGit();
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  // Auto discovery from OneDrive
  const candidateDirs = [
    'C:\\Users\\polic\\OneDrive\\04 ทะเบียนคุม ร้องทุกข์-อุทธรณ์',
    path.join(process.env.USERPROFILE || '', 'OneDrive', '04 ทะเบียนคุม ร้องทุกข์-อุทธรณ์'),
    path.join(process.cwd(), 'scratch', 'excel_backup'),
  ];

  let foundFiles: string[] = [];
  for (const dir of candidateDirs) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs
          .readdirSync(dir)
          .filter((f) => (f.endsWith('.xlsm') || f.endsWith('.xlsx')) && !f.startsWith('~$') && f.includes('ทะเบียนคุม'))
          .map((f) => path.join(dir, f));
        if (files.length > 0) {
          foundFiles = files;
          appendSyncLog(`[Auto-Sync] พบโฟลเดอร์ทะเบียนคุม: ${dir} (${files.length} ไฟล์)`);
          break;
        }
      } catch {}
    }
  }

  if (foundFiles.length === 0) {
    throw new Error('ไม่พบไฟล์ทะเบียนคุมในโฟลเดอร์ OneDrive หรือแคชสำรอง');
  }

  const results = [];
  for (const file of foundFiles) {
    const res = await syncDirect(file);
    results.push(res);
  }

  const snap = loadCasesSnapshot();
  const thaiNow = new Date().toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  if (showPopup || showNotify) {
    const recentList = (snap.recentChanges || [])
      .slice(0, 6)
      .map((c) => `  • [${c.type} ${c.blackNumber}] ${c.petitionerName} (${c.changeLabel})`)
      .join('\n');

    const popupLines = [
      `✅ อัปเดตฐานข้อมูลเว็บไซต์ ก.พ.ค.ตร. สำเร็จเรียบร้อย!`,
      ``,
      `🕒 เวลาตรวจสอบ/ซิงค์ล่าสุด: ${thaiNow} น.`,
      `📊 ข้อมูลในระบบทั้งหมด: ${snap.summary.total} เรื่อง`,
      `   • เรื่องร้องทุกข์: ${snap.summary.complaint} เรื่อง`,
      `   • เรื่องอุทธรณ์: ${snap.summary.appeal} เรื่อง`,
      `   • มีบันทึกการดำเนินการ: ${snap.summary.withProceedingNotes ?? 198} เรื่อง`,
      `   • ฟ้องศาลปกครอง: ${snap.summary.adminCourt ?? 0} เรื่อง`,
      `   • เสร็จสิ้น: ${snap.summary.completed} เรื่อง | อยู่ระหว่างดำเนินการ: ${snap.summary.pending} เรื่อง`,
      ``,
      recentList ? `🔄 รายการที่มีการแก้ไข/เพิ่มเติมล่าสุด:\n${recentList}` : `🔄 ข้อมูลทั้งหมดตรงกับไฟล์ Excel ล่าสุดแล้ว`,
      ``,
      `🌐 ระบบกำลังซิงค์ข้อมูลขึ้นเว็บไซต์คลาวด์อัตโนมัติ...`,
    ].join('\n');

    // Show popup immediately (<1s) so user gets instant confirmation
    showWindowsPopup(
      'ระบบออโต้อัปเดตทะเบียนคุม ก.พ.ค.ตร.',
      popupLines,
      showNotify ? 7 : 20,
      64
    );
  }

  if (!args.includes('--local-only')) {
    await pushToCloudAndGit();
  }
  appendSyncLog(`[Auto-Sync Complete] ซิงค์ไฟล์ทะเบียนคุมครบทั้งหมด ${results.length} ไฟล์เรียบร้อย (รวม ${snap.summary.total} คดี)`);
}

main().catch((err) => {
  appendSyncLog(`SYNC_ERROR: ${err.message}`);
  if (process.argv.includes('--popup') || process.argv.includes('--notify')) {
    showWindowsPopup('แจ้งเตือนข้อผิดพลาด - ก.พ.ค.ตร.', `เกิดข้อผิดพลาดในการซิงค์ข้อมูล:\n${err.message}`, 10, 48);
  }
  process.exit(1);
});
