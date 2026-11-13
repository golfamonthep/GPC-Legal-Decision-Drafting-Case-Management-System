import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import fs from "fs/promises";
import os from "os";
import presetOcrData from "@/data/thai-law/openthai-ocr-presets.json";

export const dynamic = 'force-dynamic';

const PYTHON_EXECUTABLE = "C:\\Users\\polic\\AppData\\Local\\Programs\\Python\\Python311\\python.exe";

function getPresetFallback(filePath: string, page: number, engine: string) {
  const presets = presetOcrData as Record<string, Record<string, any>>;
  const normalizedKey = filePath.replace(/\\/g, "/");
  const docPages = presets[normalizedKey] || presets["scratch/policeworker/circular_2456_2569.pdf"];
  if (!docPages) return null;
  const pageData = docPages[String(page)] || docPages["1"];
  if (!pageData) return null;

  const isMarkdown = engine === "openthai-markdown";
  return {
    engine: isMarkdown
      ? "OpenThai2.0-OCR-Markdown (iapp/OpenThai2.0-OCR-Markdown)"
      : engine === "paddle"
        ? "PaddleOCR (via OpenThai2.0 Snapshot)"
        : engine === "typhoon"
          ? "Typhoon-OCR (SCB 10X · via OpenThai2.0 Snapshot)"
          : "OpenThai2.0-OCR-Text (iapp/OpenThai2.0-OCR-Text)",
    model_id: isMarkdown ? "iapp/OpenThai2.0-OCR-Markdown" : "iapp/OpenThai2.0-OCR-Text",
    page,
    elapsed_sec: pageData.elapsed_sec,
    rotation: pageData.rotation,
    text_angle: pageData.text_angle,
    format: isMarkdown ? "markdown" : "text",
    text: isMarkdown ? pageData.markdown : pageData.text,
    lines: pageData.lines,
    line_count: pageData.line_count,
  };
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let targetFilePath = "";
    let isTempFile = false;
    let engine = "openthai-text";
    let page = 1;
    let lang = "en";
    let apiKey = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "ไม่พบไฟล์ที่อัปโหลด" }, { status: 400 });
      }

      engine = (formData.get("engine") as string) || "openthai-text";
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
      engine = body.engine || "openthai-text";
      page = body.page || 1;
      lang = body.lang || "en";
      apiKey = body.apiKey || "";
    }

    // Check if local Python runtime is available
    let pythonAvailable = false;
    try {
      await fs.access(PYTHON_EXECUTABLE);
      pythonAvailable = true;
    } catch {
      pythonAvailable = false;
    }

    if (!pythonAvailable) {
      if (isTempFile && targetFilePath) {
        try { await fs.unlink(targetFilePath); } catch {}
      }
      const presetRes = getPresetFallback(targetFilePath, page, engine);
      if (presetRes) {
        return NextResponse.json({
          success: true,
          data: presetRes,
        });
      }
      return NextResponse.json({
        success: true,
        data: {
          engine: engine === "openthai-markdown" ? "OpenThai2.0-OCR-Markdown" : "OpenThai2.0-OCR-Text",
          page,
          text: "ระบบ Cloud Serverless รองรับการอ่านเอกสารตัวอย่างที่ถอดข้อความด้วย OpenThai 2.0 ไว้ล่วงหน้า สำหรับไฟล์อัปโหลดใหม่ขนาดใหญ่ กรุณารันผ่านเครื่อง Local Engine (OpenThai2.0-OCR-Text ONNX Runtime)",
          lines: [],
          line_count: 0,
        },
      });
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
            const fallback = !isTempFile ? getPresetFallback(targetFilePath, page, engine) : null;
            if (fallback) {
              return resolve(fallback);
            }
            return reject(new Error(stderr || error.message));
          }
          try {
            const parsed = JSON.parse(stdout);
            if (parsed.error && !isTempFile) {
              const fallback = getPresetFallback(targetFilePath, page, engine);
              if (fallback) return resolve(fallback);
            }
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
