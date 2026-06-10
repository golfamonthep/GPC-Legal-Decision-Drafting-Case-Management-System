import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, PageOrientation, VerticalAlign } from "docx";
import prisma from "@/lib/db";
import { format } from "date-fns";
import { th } from "date-fns/locale";

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

  // Log DOCX_EXPORT_REQUESTED
  await prisma.auditLog.create({
    data: {
      action: "DOCX_EXPORT_REQUESTED",
      entityType: "Case",
      entityId: caseId,
      userId: userId || null,
      beforeValue: JSON.stringify({ draftId: draft.id }),
    }
  });

  const petitionerLabel = caseData.type === "อุทธรณ์" ? "ผู้อุทธรณ์" : "ผู้ร้องทุกข์";
  const respondentLabel = caseData.type === "อุทธรณ์" ? "คู่กรณีในอุทธรณ์" : "คู่กรณีในการร้องทุกข์";

  const children: any[] = [];

  // Warning page/note at the beginning
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

  // A. Header
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "คำวินิจฉัย",
          bold: true,
          size: 36, // 18pt
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "คณะกรรมการพิทักษ์ระบบคุณธรรมข้าราชการตำรวจ",
          bold: true,
          size: 32, // 16pt
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: `เรื่องดำที่: ${caseData.blackNumber || "[เรื่องดำ]"}`, size: 32 }),
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: `เรื่องแดงที่: ${caseData.redNumber || "[เรื่องแดง]"}`, size: 32 }),
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 400 },
      children: [
        new TextRun({ text: `วันที่: ${formatThaiDate(caseData.meetingDate || new Date())}`, size: 32 }),
      ]
    })
  );

  // B. Parties & C. Metadata
  children.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: `${petitionerLabel}: \t\t\t${caseData.petitionerName || "-"}`, size: 32 })
      ]
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: `${respondentLabel}: \t\t${caseData.respondentName || "-"}`, size: 32 })
      ]
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: `เรื่อง: \t\t\t\t${caseData.subject || "-"}`, size: 32 })
      ]
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: `ประเภทเรื่อง: \t\t\t${caseData.type || "-"}`, size: 32 })
      ]
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: `วันที่รับเรื่อง: \t\t\t${formatThaiDate(caseData.receivedDate)}`, size: 32 })
      ]
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: `นิติกร: \t\t\t\t${caseData.legalOfficer?.name || caseData.legalOfficerName || "-"}`, size: 32 })
      ]
    }),
    new Paragraph({
      spacing: { after: 400 },
      children: [
        new TextRun({ text: `กรรมการเจ้าของสำนวน: \t\t${caseData.owner?.name || "-"}`, size: 32 })
      ]
    })
  );

  // D. Draft sections
  const officialSectionOrder = [
    { type: "heading", title: caseData.type === "อุทธรณ์" ? "สรุปอุทธรณ์" : "สรุปคำร้องทุกข์" },
    { type: "parties", title: "คำแก้ของคู่กรณี" }, // Usually contains the counterparty statement
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
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({ text: template.title, bold: true, size: 32 })
        ]
      })
    );

    if (sectionData && sectionData.content && sectionData.content.trim()) {
      const lines = sectionData.content.split('\n');
      for (const line of lines) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.THAI_DISTRIBUTE,
            spacing: { before: 60, after: 60 },
            indent: { firstLine: 720 }, // roughly 1.27 cm / 0.5 inch Thai indentation
            children: [
              new TextRun({ text: line, size: 32 })
            ]
          })
        );
      }
    } else {
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 60 },
          indent: { firstLine: 720 },
          children: [
            new TextRun({ text: "[ยังไม่มีข้อความในส่วนนี้]", color: "888888", size: 32 })
          ]
        })
      );
    }
  }

  // Right to file case with Supreme Administrative Court (สิทธิฟ้องคดีต่อศาลปกครองสูงสุด)
  children.push(
    new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({ text: "สิทธิฟ้องคดีต่อศาลปกครองสูงสุด", bold: true, size: 32 })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.THAI_DISTRIBUTE,
      spacing: { before: 60, after: 60 },
      indent: { firstLine: 720 },
      children: [
        new TextRun({ text: "[ยังไม่มีข้อความในส่วนนี้]", color: "888888", size: 32 })
      ]
    })
  );

  // E. Signature area
  children.push(
    new Paragraph({
      spacing: { before: 800 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "(ลงชื่อ) .......................................................", size: 32 })
      ]
    }),
    new Paragraph({
      spacing: { before: 120 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "(.......................................................)", size: 32 })
      ]
    }),
    new Paragraph({
      spacing: { before: 120, after: 400 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "ประธานกรรมการ", size: 32 })
      ]
    }),
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "(ลงชื่อ) .......................................................", size: 32 })
      ]
    }),
    new Paragraph({
      spacing: { before: 120 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "(.......................................................)", size: 32 })
      ]
    }),
    new Paragraph({
      spacing: { before: 120, after: 400 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "กรรมการ", size: 32 })
      ]
    }),
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "(ลงชื่อ) .......................................................", size: 32 })
      ]
    }),
    new Paragraph({
      spacing: { before: 120 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "(.......................................................)", size: 32 })
      ]
    }),
    new Paragraph({
      spacing: { before: 120 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "กรรมการและเลขานุการ", size: 32 })
      ]
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1417, // ~2.5 cm (1 cm = ~567 twips)
              right: 1134, // ~2.0 cm
              bottom: 1134, // ~2.0 cm
              left: 1701, // ~3.0 cm
            },
            size: {
              orientation: PageOrientation.PORTRAIT,
            }
          }
        },
        children,
      }
    ]
  });

  try {
    const buffer = await Packer.toBuffer(doc);
    
    let safeSubject = caseData.subject ? caseData.subject.substring(0, 30).replace(/[^a-zA-Z0-9ก-๙]/g, '_') : 'ไม่มีชื่อเรื่อง';
    const filename = `คำวินิจฉัย-${caseData.type}-${caseData.blackNumber.replace(/\//g, '-')}.docx`;

    await prisma.auditLog.create({
      data: {
        action: "DOCX_EXPORT_COMPLETED",
        entityType: "Case",
        entityId: caseId,
        userId: userId || null,
        afterValue: JSON.stringify({ filename }),
      }
    });

    return { buffer, filename };
  } catch (error) {
    await prisma.auditLog.create({
      data: {
        action: "DOCX_EXPORT_FAILED",
        entityType: "Case",
        entityId: caseId,
        userId: userId || null,
        afterValue: JSON.stringify({ error: String(error) }),
      }
    });
    throw error;
  }
}
