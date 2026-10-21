import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import fs from "fs/promises";
import os from "os";

export const dynamic = 'force-dynamic';

const PYTHON_EXECUTABLE = "C:\\Users\\polic\\AppData\\Local\\Programs\\Python\\Python311\\python.exe";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let targetFilePath = "";
    let isTempFile = false;
    let engine = "paddle";
    let page = 1;
    let lang = "en";
    let apiKey = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "ไม่พบไฟล์ที่อัปโหลด" }, { status: 400 });
      }

      engine = (formData.get("engine") as string) || "paddle";
      page = parseInt((formData.get("page") as string) || "1", 10);
      lang = (formData.get("lang") as string) || "en";
      apiKey = (formData.get("apiKey") as string) || "";

      // Write uploaded file to temp dir
      const buffer = Buffer.from(await file.arrayBuffer());
      const tempDir = os.tmpdir();
      const ext = path.extname(file.name) || ".pdf";
      targetFilePath = path.join(tempDir, `gpc_ocr_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
      await fs.writeFile(targetFilePath, buffer);
      isTempFile = true;
    } else {
      const body = await req.json();
      targetFilePath = body.filePath;
      if (!targetFilePath) {
        return NextResponse.json({ error: "กรุณาระบุ filePath หรืออัปโหลดไฟล์" }, { status: 400 });
      }
      engine = body.engine || "paddle";
      page = body.page || 1;
      lang = body.lang || "en";
      apiKey = body.apiKey || "";
    }

    const scriptPath = path.resolve(process.cwd(), "scripts/ocr_processor.py");

    const args = [
      scriptPath,
      "--file", targetFilePath,
      "--engine", engine,
      "--page", page.toString(),
      "--lang", lang,
      "--json"
    ];

    if (apiKey) {
      args.push("--api-key", apiKey);
    }

    const ocrResult = await new Promise((resolve, reject) => {
      execFile(
        PYTHON_EXECUTABLE,
        args,
        {
          timeout: 120000,
          maxBuffer: 10 * 1024 * 1024,
          windowsHide: true,
          env: {
            ...process.env,
            PYTHONIOENCODING: "utf-8"
          }
        },
        (error, stdout, stderr) => {
          if (error && !stdout) {
            return reject(new Error(stderr || error.message));
          }
          try {
            const parsed = JSON.parse(stdout);
            resolve(parsed);
          } catch (e) {
            if (stdout) {
              resolve({ raw: stdout, text: stdout });
            } else {
              reject(new Error(stderr || "Failed to parse OCR response"));
            }
          }
        }
      );
    });

    if (isTempFile && targetFilePath) {
      try {
        await fs.unlink(targetFilePath);
      } catch (e) {
        // ignore cleanup error
      }
    }

    return NextResponse.json({
      success: true,
      data: ocrResult
    });
  } catch (error: any) {
    console.error("OCR API error:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการประมวลผล OCR" },
      { status: 500 }
    );
  }
}
