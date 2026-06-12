import { Document, Packer, Paragraph, TextRun, AlignmentType, PageOrientation, Table, TableRow, TableCell, BorderStyle, WidthType } from "docx";
import prisma from "@/lib/db";
import { docxLayoutConfig } from "./docxLayoutConfig";
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
        caseType: caseData.type || "[ยังไม่มีข้อมูล]",
        blackCaseNumber: caseData.blackNumber || "[ยังไม่มีข้อมูล]",
        redCaseNumber: caseData.redNumber || " ",
        decisionDate: formatThaiDate(caseData.meetingDate),
        receivedDate: formatThaiDate(caseData.receivedDate),
        petitionerLabel,
        petitionerName: caseData.petitionerName || "[ยังไม่มีข้อมูล]",
        counterpartyLabel,
        counterpartyName: caseData.respondentName || "[ยังไม่มีข้อมูล]",
        subject: caseData.subject || "[ยังไม่มีข้อมูล]",
        legalOfficerName: caseData.legalOfficer?.name || caseData.legalOfficerName || "[ยังไม่มีข้อมูล]",
        committeeOwnerName: caseData.owner?.name || "[ยังไม่มีข้อมูล]",
        status: caseData.currentStatus || "[ยังไม่มีข้อมูล]",
        decisionResult: caseData.decisionResult || "[ยังไม่มีข้อมูล]",
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
          afterValue: JSON.stringify({ filename, exportMode: "template", templateUsed: true }),
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
  const { font, paragraph: pConfig } = docxLayoutConfig;

  // Warning
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "ข้อควรตรวจสอบก่อนใช้เอกสาร",
          bold: true,
          size: font.sizes.body,
          color: "FF0000",
          font: font.family
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
          size: font.sizes.body,
          color: "FF0000",
          font: font.family
        })
      ]
    })
  );

  // Header Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "คำวินิจฉัย", bold: true, size: font.sizes.heading, font: font.family })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: pConfig.spacing.headingMain.after },
      children: [new TextRun({ text: "คณะกรรมการพิทักษ์ระบบคุณธรรมข้าราชการตำรวจ", bold: true, size: font.sizes.heading, font: font.family })]
    })
  );

  // Case Number Block
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "auto" };
  const tableBorders = {
    top: noBorder, bottom: noBorder, left: noBorder, right: noBorder,
    insideHorizontal: noBorder, insideVertical: noBorder
  };

  children.push(
    new Table({
      borders: tableBorders,
      alignment: AlignmentType.RIGHT,
      width: { size: 35, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: "เรื่องดำที่", size: font.sizes.body, font: font.family })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: caseData.blackNumber || "[ยังไม่มีข้อมูล]", size: font.sizes.body, font: font.family })] })] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: "เรื่องแดงที่", size: font.sizes.body, font: font.family })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: caseData.redNumber || " ", size: font.sizes.body, font: font.family })] })] })
          ]
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 120, after: 400 },
      children: [new TextRun({ text: `วันที่ ${formatThaiDate(caseData.meetingDate)}`, size: font.sizes.body, font: font.family })]
    })
  );

  // Metadata / Parties Block
  children.push(
    new Table({
      borders: tableBorders,
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, margins: { bottom: 120 }, children: [new Paragraph({ children: [new TextRun({ text: petitionerLabel, size: font.sizes.body, font: font.family })] })] }),
            new TableCell({ width: { size: 80, type: WidthType.PERCENTAGE }, margins: { bottom: 120 }, children: [new Paragraph({ children: [new TextRun({ text: caseData.petitionerName || "[ยังไม่มีข้อมูล]", size: font.sizes.body, font: font.family })] })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ margins: { bottom: 120 }, children: [new Paragraph({ children: [new TextRun({ text: respondentLabel, size: font.sizes.body, font: font.family })] })] }),
            new TableCell({ margins: { bottom: 120 }, children: [new Paragraph({ children: [new TextRun({ text: caseData.respondentName || "[ยังไม่มีข้อมูล]", size: font.sizes.body, font: font.family })] })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ margins: { bottom: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "เรื่อง", size: font.sizes.body, font: font.family })] })] }),
            new TableCell({ margins: { bottom: 120 }, children: [new Paragraph({ children: [new TextRun({ text: caseData.subject || "[ยังไม่มีข้อมูล]", size: font.sizes.body, font: font.family })] })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ margins: { bottom: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "ประเภทเรื่อง", size: font.sizes.body, font: font.family })] })] }),
            new TableCell({ margins: { bottom: 120 }, children: [new Paragraph({ children: [new TextRun({ text: caseData.type || "-", size: font.sizes.body, font: font.family })] })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ margins: { bottom: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "วันที่รับเรื่อง", size: font.sizes.body, font: font.family })] })] }),
            new TableCell({ margins: { bottom: 120 }, children: [new Paragraph({ children: [new TextRun({ text: formatThaiDate(caseData.receivedDate), size: font.sizes.body, font: font.family })] })] }),
          ]
        })
      ]
    })
  );

  // We intentionally exclude operational fields from official body unless requested. The prompt says "do not show operational internal fields in the official body unless intentionally included". I removed legalOfficer and owner for now, or keep them if they are in official format. Actually, in Thai official docs, legal officer and owner are sometimes at the very end or not included in the decision doc. I will omit them to make it look official, or add them at the end. Wait, previous prompt said "Include, only where appropriate: เรื่อง ประเภทเรื่อง วันที่รับเรื่อง นิติกร กรรมการเจ้าของสำนวน". I'll add them back to the table for completeness.

  children.push(
    new Table({
      borders: tableBorders,
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, margins: { bottom: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "นิติกร", size: font.sizes.body, font: font.family })] })] }),
            new TableCell({ width: { size: 80, type: WidthType.PERCENTAGE }, margins: { bottom: 120 }, children: [new Paragraph({ children: [new TextRun({ text: caseData.legalOfficer?.name || caseData.legalOfficerName || "[ยังไม่มีข้อมูล]", size: font.sizes.body, font: font.family })] })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ margins: { bottom: 400 }, children: [new Paragraph({ children: [new TextRun({ text: "กรรมการเจ้าของสำนวน", size: font.sizes.body, font: font.family })] })] }),
            new TableCell({ margins: { bottom: 400 }, children: [new Paragraph({ children: [new TextRun({ text: caseData.owner?.name || "[ยังไม่มีข้อมูล]", size: font.sizes.body, font: font.family })] })] }),
          ]
        })
      ]
    })
  );

  const officialSectionOrder = [
    { type: "heading", title: caseData.type === "อุทธรณ์" ? "สรุปอุทธรณ์" : "สรุปคำร้องทุกข์" },
    { type: "request", title: caseData.type === "อุทธรณ์" ? "คำขอของผู้อุทธรณ์" : "คำขอของผู้ร้องทุกข์" },
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
      new Paragraph({ 
        spacing: pConfig.spacing.sectionHeading, 
        keepNext: true,
        children: [new TextRun({ text: template.title, bold: true, size: font.sizes.sectionHeading, font: font.family })] 
      })
    );

    if (sectionData && sectionData.content && sectionData.content.trim()) {
      const lines = sectionData.content.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        children.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: pConfig.spacing.body,
            indent: pConfig.indent,
            children: [new TextRun({ text: line, size: font.sizes.body, font: font.family })]
          })
        );
      }
    } else {
      children.push(
        new Paragraph({
          spacing: pConfig.spacing.body,
          indent: pConfig.indent,
          children: [new TextRun({ text: "[ยังไม่มีข้อความในส่วนนี้]", color: "888888", size: font.sizes.body, font: font.family })]
        })
      );
    }
  }

  children.push(
    new Paragraph({ 
      spacing: pConfig.spacing.sectionHeading, 
      keepNext: true,
      children: [new TextRun({ text: "สิทธิฟ้องคดีต่อศาลปกครองสูงสุด", bold: true, size: font.sizes.sectionHeading, font: font.family })] 
    }),
    new Paragraph({ 
      alignment: AlignmentType.JUSTIFIED, 
      spacing: pConfig.spacing.body, 
      indent: pConfig.indent, 
      children: [new TextRun({ text: "[ยังไม่มีข้อความในส่วนนี้]", color: "888888", size: font.sizes.body, font: font.family })] 
    })
  );

  // Signatures
  children.push(
    new Paragraph({ spacing: { before: 800 }, keepNext: true, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(ลงชื่อ) .......................................................", size: font.sizes.body, font: font.family })] }),
    new Paragraph({ spacing: { before: pConfig.spacing.signature.beforeRole }, keepNext: true, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(.......................................................)", size: font.sizes.body, font: font.family })] }),
    new Paragraph({ spacing: { before: pConfig.spacing.signature.beforeRole, after: pConfig.spacing.signature.afterRole }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ประธานกรรมการ", size: font.sizes.body, font: font.family })] }),
    
    new Paragraph({ spacing: { before: pConfig.spacing.signature.beforeNewSignature }, keepNext: true, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(ลงชื่อ) .......................................................", size: font.sizes.body, font: font.family })] }),
    new Paragraph({ spacing: { before: pConfig.spacing.signature.beforeRole }, keepNext: true, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(.......................................................)", size: font.sizes.body, font: font.family })] }),
    new Paragraph({ spacing: { before: pConfig.spacing.signature.beforeRole, after: pConfig.spacing.signature.afterRole }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "กรรมการ", size: font.sizes.body, font: font.family })] }),
    
    new Paragraph({ spacing: { before: pConfig.spacing.signature.beforeNewSignature }, keepNext: true, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(ลงชื่อ) .......................................................", size: font.sizes.body, font: font.family })] }),
    new Paragraph({ spacing: { before: pConfig.spacing.signature.beforeRole }, keepNext: true, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(.......................................................)", size: font.sizes.body, font: font.family })] }),
    new Paragraph({ spacing: { before: pConfig.spacing.signature.beforeRole }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "กรรมการและเลขานุการ", size: font.sizes.body, font: font.family })] })
  );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            size: font.sizes.body,
            font: font.family
          }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          margin: docxLayoutConfig.page.margins,
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
      afterValue: JSON.stringify({ filename, exportMode: "fallback", templateUsed: false }),
    }
  });

  return { buffer, filename };
}
