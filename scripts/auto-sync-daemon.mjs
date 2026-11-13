import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';

const DAEMON_PORT = 49876;
const APP_ROOT = 'C:\\APP';
const ONEDRIVE_DIR = 'C:\\Users\\polic\\OneDrive\\04 ทะเบียนคุม ร้องทุกข์-อุทธรณ์';
const LOG_FILE = path.join(APP_ROOT, 'tools', 'registry-dropzone', 'sync-history.log');
const TSX_CLI = path.join(APP_ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const SYNC_SCRIPT = path.join(APP_ROOT, 'scripts', 'sync-registry.ts');

function log(msg) {
  const ts = new Date().toLocaleString('th-TH', { hour12: false });
  const line = `[${ts}] [Daemon] ${msg}\r\n`;
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch {}
}

let isSyncing = false;
let pendingReason = null;

function runSync(reason) {
  if (isSyncing) {
    pendingReason = reason;
    return;
  }
  isSyncing = true;
  log(`เริ่มซิงค์อัตโนมัติ (สาเหตุ: ${reason})...`);

  const child = spawn(process.execPath, [TSX_CLI, SYNC_SCRIPT, '--all', '--notify'], {
    cwd: APP_ROOT,
    windowsHide: true,
    stdio: 'ignore',
  });

  child.on('close', (code) => {
    log(`ซิงค์อัตโนมัติเสร็จสิ้น (Exit code: ${code})`);
    isSyncing = false;
    if (pendingReason) {
      const next = pendingReason;
      pendingReason = null;
      setTimeout(() => runSync(next), 500);
    }
  });

  child.on('error', (err) => {
    log(`ข้อผิดพลาดในการเรียก sync-registry: ${err.message}`);
    isSyncing = false;
  });
}

// Ensure single instance via localhost port
const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const cmd = data.toString().trim();
    if (cmd === 'SYNC_NOW') {
      runSync('Manual IPC Trigger');
    }
  });
  socket.end('OK\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // Daemon already running in background
    process.exit(0);
  } else {
    log(`Server error: ${err.message}`);
    process.exit(1);
  }
});

server.listen(DAEMON_PORT, '127.0.0.1', () => {
  log(`เริ่มทำงานระบบเฝ้าตรวจไฟล์ OneDrive อัตโนมัติ (Port ${DAEMON_PORT}, โฟลเดอร์: ${ONEDRIVE_DIR})`);

  const fileStates = new Map();
  let activeLockFiles = new Set();
  let debounceTimer = null;
  let initialized = false;

  function pollDirectory() {
    if (!fs.existsSync(ONEDRIVE_DIR)) return;
    try {
      const entries = fs.readdirSync(ONEDRIVE_DIR);
      const currentLocks = new Set();

      for (const name of entries) {
        if (!name.endsWith('.xlsm') && !name.endsWith('.xlsx')) continue;
        if (name.startsWith('~$')) {
          if (name.includes('ทะเบียนคุม')) {
            currentLocks.add(name);
          }
          continue;
        }
        if (!name.includes('ทะเบียนคุม')) continue;

        const fullPath = path.join(ONEDRIVE_DIR, name);
        try {
          const stat = fs.statSync(fullPath);
          const sig = `${stat.mtimeMs}:${stat.size}`;
          const prevSig = fileStates.get(name);
          if (initialized && prevSig && prevSig !== sig) {
            log(`ตรวจพบการบันทึกไฟล์ Excel: ${name}`);
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              runSync(`บันทึกไฟล์ ${name}`);
            }, 1200);
          }
          fileStates.set(name, sig);
        } catch {}
      }

      // Check if any Excel lock file ~$... was just deleted (Excel closed!)
      if (initialized) {
        for (const oldLock of activeLockFiles) {
          if (!currentLocks.has(oldLock)) {
            const workbookName = oldLock.slice(2);
            log(`ตรวจพบการปิดโปรแกรม Excel (${workbookName}) -> ซิงค์ข้อมูลทันที!`);
            if (debounceTimer) clearTimeout(debounceTimer);
            runSync(`ปิดโปรแกรม Excel (${workbookName})`);
          }
        }
      }

      activeLockFiles = currentLocks;
      initialized = true;
    } catch {}
  }

  pollDirectory();
  setInterval(pollDirectory, 1000);
});
