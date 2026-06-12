import { Document, Packer, Paragraph, TextRun, AlignmentType, PageOrientation } from "docx";
import prisma from "@/lib/db";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

function formatThaiDate(date: Date | null | undefined): string {
  if (!date) return "[วันที่]";
  const buddhistYear = date.getFullYear() + 543;
  return `${date.getDate()} ${format(date, "MMM", { locale: th })} ${buddhistYear}`;
}

export async function generateDecisionDocx(caseId: string, userId?: string) {
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      owner: true,
      legalOfficer: true,
      drafts: {
        include: {
          sections: {
            orderBy: { order: 'asc' }
          }
        }
      }
    }
  });

  if (!caseData) {
    throw new Error("ไม่พบสำนวนที่ต้องการส่งออก");
  }

  const draft = caseData.drafts[0];
  if (!draft) {
    throw new Error("ยังไม่มีร่างคำวินิจฉัยสำหรับสำนวนนี้");
  }

  const sections = draft.sections;
  const safeBlackNumber = caseData.blackNumber ? caseData.blackNumber.replace(/\//g, '-') : caseId;
  const filename = `คำวินิจฉัย-${caseData.type}-${safeBlackNumber}.docx`;

  const templatePath = path.join(process.cwd(), "templates", "docx", "gpc-decision-template.docx");
  let templateExists = false;
  try {
    await fs.access(templatePath);
    templateExists = true;
  } catch (err) {
    templateExists = false;
  }

  // Log DOCX_EXPORT_REQUESTED
  await prisma.auditLog.create({
    data: {
      action: templateExists ? "DOCX_TEMPLATE_EXPORT_REQUESTED" : "DOCX_EXPORT_REQUESTED",
      entityType: "Case",
      entityId: caseId,
      userId: userId || null,
      beforeValue: JSON.stringify({ draftId: draft.id, templateUsed: templateExists, filename }),
    }
  });

  try {
    if (templateExists) {
      const templateContent = await fs.readFile(templatePath, "binary");
      const zip = new PizZip(templateContent);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      const petitionerLabel = caseData.type === "อุทธรณ์" ? "ผู้อุทธรณ์" : "ผู้ร้องทุกข์";
      const counterpartyLabel = caseData.type === "อุทธรณ์" ? "คู่กรณีในอุทธรณ์" : "คู่กรณีในการร้องทุกข์";

      const sectionMap: Record<string, string> = {
        section_summary: "[ยังไม่มีข้อความในส่วนนี้]",
        section_request: "[ยังไม่มีข้อความในส่วนนี้]",
        section_counterparty_statement: "[ยังไม่มีข้อความในส่วนนี้]",
        section_facts: "[ยังไม่มีข้อความในส่วนนี้]",
        section_jurisdiction: "[ยังไม่มีข้อความในส่วนนี้]",
        section_issues: "[ยังไม่มีข้อความในส่วนนี้]",
        section_laws: "[ยังไม่มีข้อความในส่วนนี้]",
        section_analysis: "[ยังไม่มีข้อความในส่วนนี้]",
        section_decision_result: "[ยังไม่มีข้อความในส่วนนี้]",
        section_court_right: "[ยังไม่มีข้อความในส่วนนี้]",
        section_signatures: "[ยังไม่มีข้อความในส่วนนี้]"
      };

      for (const section of sections) {
        let key = "";
        switch(section.sectionType) {
          case "heading": key = "section_summary"; break;
          case "request": key = "section_request"; break;
          case "parties": key = "section_counterparty_statement"; break;
          case "established_facts": key = "section_facts"; break;
          case "jurisdiction": key = "section_jurisdiction"; break;
          case "issues": key = "section_issues"; break;
          case "applicable_laws": key = "section_laws"; break;
          case "reasoning": key = "section_analysis"; break;
          case "conclusion": key = "section_decision_result"; break;
          case "court_right": key = "section_court_right"; break;
          case "signatures": key = "section_signatures"; break;
        }
        if (key && section.content && section.content.trim()) {
          sectionMap[key] = section.content;
        }
      }

      const data = {
        caseType: caseData.type || "",
        blackCaseNumber: caseData.blackNumber || "",
        redCaseNumber: caseData.redNumber || "",
        decisionDate: formatThaiDate(caseData.meetingDate),
        receivedDate: formatThaiDate(caseData.receivedDate),
        petitionerLabel,
        petitionerName: caseData.petitionerName || "",
        counterpartyLabel,
        counterpartyName: caseData.respondentName || "",
        subject: caseData.subject || "",
        legalOfficerName: caseData.legalOfficer?.name || caseData.legalOfficerName || "",
        committeeOwnerName: caseData.owner?.name || "",
        status: caseData.currentStatus || "",
        decisionResult: caseData.decisionResult || "",
        systemDraftWarning: "เอกสารนี้เป็นร่างที่ส่งออกจากระบบเพื่อการตรวจทาน ต้องตรวจสอบโดยนิติกร/กรรมการก่อนนำไปใช้เป็นเอกสารทางราชการ",
        ...sectionMap
      };

      doc.render(data);

      const buffer = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE",
      });

      await prisma.auditLog.create({
        data: {
          action: "DOCX_TEMPLATE_EXPORT_COMPLETED",
          entityType: "Case",
          entityId: caseId,
          userId: userId || null,
          afterValue: JSON.stringify({ filename, templateUsed: true, templateName: "gpc-decision-template.docx" }),
        }
      });

      return { buffer, filename };
    }

    // Fallback to programmatic export
    return await generateProgrammaticDocx(caseData, sections, filename, userId);
  } catch (error) {
    await prisma.auditLog.create({
      data: {
        action: templateExists ? "DOCX_TEMPLATE_EXPORT_FAILED" : "DOCX_EXPORT_FAILED",
        entityType: "Case",
        entityId: caseId,
        userId: userId || null,
        afterValue: JSON.stringify({ error: String(error) }),
      }
    });
    throw error;
  }
}

async function generateProgrammaticDocx(caseData: any, sections: any[], filename: string, userId?: string) {
  const petitionerLabel = caseData.type === "อุทธรณ์" ? "ผู้อุทธรณ์" : "ผู้ร้องทุกข์";
  const respondentLabel = caseData.type === "อุทธรณ์" ? "คู่กรณีในอุทธรณ์" : "คู่กรณีในการร้องทุกข์";

  const children: any[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "ข้อควรตรวจสอบก่อนใช้เอกสาร",
          bold: true,
          size: 32, // 16pt (half-points)
          color: "FF0000"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: "เอกสารนี้เป็นร่างที่ส่งออกจากระบบเพื่อการตรวจทาน ต้องตรวจสอบโดยนิติกร/กรรมการก่อนนำไปใช้เป็นเอกสารทางราชการ",
          bold: true,
          size: 28, // 14pt
          color: "FF0000"
        })
      ]
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "คำวินิจฉัย", bold: true, size: 36 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "คณะกรรมการพิทักษ์ระบบคุณธรรมข้าราชการตำรวจ", bold: true, size: 32 })]
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: `เรื่องดำที่: ${caseData.blackNumber || "[เรื่องดำ]"}`, size: 32 })]
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 200 },
      children: [new TextRun({ text: `เรื่องแดงที่: ${caseData.redNumber || "[เรื่องแดง]"}`, size: 32 })]
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 400 },
      children: [new TextRun({ text: `วันที่: ${formatThaiDate(caseData.meetingDate || new Date())}`, size: 32 })]
    })
  );

  children.push(
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `${petitionerLabel}: \t\t\t${caseData.petitionerName || "-"}`, size: 32 })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `${respondentLabel}: \t\t${caseData.respondentName || "-"}`, size: 32 })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `เรื่อง: \t\t\t\t${caseData.subject || "-"}`, size: 32 })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `ประเภทเรื่อง: \t\t\t${caseData.type || "-"}`, size: 32 })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `วันที่รับเรื่อง: \t\t\t${formatThaiDate(caseData.receivedDate)}`, size: 32 })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: `นิติกร: \t\t\t\t${caseData.legalOfficer?.name || caseData.legalOfficerName || "-"}`, size: 32 })] }),
    new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: `กรรมการเจ้าของสำนวน: \t\t${caseData.owner?.name || "-"}`, size: 32 })] })
  );

  const officialSectionOrder = [
    { type: "heading", title: caseData.type === "อุทธรณ์" ? "สรุปอุทธรณ์" : "สรุปคำร้องทุกข์" },
    { type: "parties", title: "คำแก้ของคู่กรณี" },
    { type: "established_facts", title: "ข้อเท็จจริงรับฟังได้" },
    { type: "jurisdiction", title: "อำนาจและเงื่อนไขการพิจารณา" },
    { type: "issues", title: "ประเด็นที่ต้องวินิจฉัย" },
    { type: "applicable_laws", title: "ข้อกฎหมายที่เกี่ยวข้อง" },
    { type: "reasoning", title: "พิเคราะห์" },
    { type: "conclusion", title: "ผลคำวินิจฉัย" }
  ];

  for (const template of officialSectionOrder) {
    const sectionData = sections.find(s => s.sectionType === template.type);

    children.push(
      new Paragraph({ spacing: { before: 240, after: 120 }, children: [new TextRun({ text: template.title, bold: true, size: 32 })] })
    );

    if (sectionData && sectionData.content && sectionData.content.trim()) {
      const lines = sectionData.content.split('\n');
      for (const line of lines) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.THAI_DISTRIBUTE,
            spacing: { before: 60, after: 60 },
            indent: { firstLine: 720 },
            children: [new TextRun({ text: line, size: 32 })]
          })
        );
      }
    } else {
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 60 },
          indent: { firstLine: 720 },
          children: [new TextRun({ text: "[ยังไม่มีข้อความในส่วนนี้]", color: "888888", size: 32 })]
        })
      );
    }
  }

  children.push(
    new Paragraph({ spacing: { before: 240, after: 120 }, children: [new TextRun({ text: "สิทธิฟ้องคดีต่อศาลปกครองสูงสุด", bold: true, size: 32 })] }),
    new Paragraph({ alignment: AlignmentType.THAI_DISTRIBUTE, spacing: { before: 60, after: 60 }, indent: { firstLine: 720 }, children: [new TextRun({ text: "[ยังไม่มีข้อความในส่วนนี้]", color: "888888", size: 32 })] })
  );

  children.push(
    new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(ลงชื่อ) .......................................................", size: 32 })] }),
    new Paragraph({ spacing: { before: 120 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(.......................................................)", size: 32 })] }),
    new Paragraph({ spacing: { before: 120, after: 400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ประธานกรรมการ", size: 32 })] }),
    new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(ลงชื่อ) .......................................................", size: 32 })] }),
    new Paragraph({ spacing: { before: 120 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(.......................................................)", size: 32 })] }),
    new Paragraph({ spacing: { before: 120, after: 400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "กรรมการ", size: 32 })] }),
    new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(ลงชื่อ) .......................................................", size: 32 })] }),
    new Paragraph({ spacing: { before: 120 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(.......................................................)", size: 32 })] }),
    new Paragraph({ spacing: { before: 120 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "กรรมการและเลขานุการ", size: 32 })] })
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1417, right: 1134, bottom: 1134, left: 1701 },
          size: { orientation: PageOrientation.PORTRAIT }
        }
      },
      children,
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  
  await prisma.auditLog.create({
    data: {
      action: "DOCX_EXPORT_COMPLETED",
      entityType: "Case",
      entityId: caseData.id,
      userId: userId || null,
      afterValue: JSON.stringify({ filename, templateUsed: false }),
    }
  });

  return { buffer, filename };
}
