import type { DashboardCaseRecord, DashboardDataSource, DashboardSourcePayload } from "./types";

const day = 86_400_000;

function dateFrom(now: Date, days: number) {
  return new Date(now.getTime() + days * day);
}

function createDemoCase(
  index: number,
  now: Date,
  overrides: Partial<DashboardCaseRecord> = {},
): DashboardCaseRecord {
  const receivedOffset = -(index * 13 + 4);
  return {
    id: `demo-case-${index}`,
    type: index % 3 === 0 ? "อุทธรณ์" : "ร้องทุกข์",
    blackNumber: `${120 + index}/${String(now.getFullYear() + 543).slice(-2)}`,
    redNumber: null,
    subject: [
      "การพิจารณาคำร้องตามระเบียบราชการ",
      "การอุทธรณ์คำสั่งทางปกครอง",
      "การตรวจสอบสิทธิประโยชน์และสวัสดิการ",
      "การดำเนินการทางวินัยและการเยียวยา",
    ][index % 4],
    currentStatus: ["ตรวจสอบข้อเท็จจริง", "จัดทำร่างคำวินิจฉัย", "รอเข้าที่ประชุม"][index % 3],
    receivedDate: dateFrom(now, receivedOffset),
    dueDate30: dateFrom(now, index - 5),
    dueDate60: null,
    dueDate90: null,
    dueDate120: null,
    dueDate240: null,
    legalOfficerId: index % 7 === 0 ? null : `demo-officer-${index % 5}`,
    legalOfficerName: index % 7 === 0 ? null : `นิติกร ${String.fromCharCode(3585 + (index % 5))}`,
    legalOfficer: null,
    updatedAt: dateFrom(now, -(index % 9)),
    ...overrides,
  };
}

export function createDemoDashboardPayload(now = new Date()): DashboardSourcePayload {
  const cases = Array.from({ length: 28 }, (_, index) => createDemoCase(index, now));
  cases.push(
    createDemoCase(29, now, {
      currentStatus: "เสร็จสิ้น",
      redNumber: null,
      dueDate30: null,
      receivedDate: dateFrom(now, -16),
    }),
    createDemoCase(30, now, {
      currentStatus: "ตรวจสอบข้อเท็จจริง",
      redNumber: `44/${String(now.getFullYear() + 543).slice(-2)}`,
      dueDate30: null,
      receivedDate: null,
    }),
  );

  return {
    cases,
    activities: Array.from({ length: 6 }, (_, index) => ({
      id: `demo-event-${index}`,
      blackNumber: cases[index].blackNumber,
      type: cases[index].type,
      action: ["รับเรื่องเข้าสู่ระบบ", "มอบหมายนิติกร", "อัปเดตข้อเท็จจริง", "ส่งร่างตรวจทาน"][index % 4],
      actor: "เจ้าหน้าที่สาธิต",
      timestamp: dateFrom(now, -index),
    })),
    meetings: [
      {
        id: "demo-meeting-1",
        title: "ประชุมพิจารณาสำนวนประจำเดือน",
        meetingNo: "สาธิต 8/2569",
        meetingDate: dateFrom(now, 5),
        status: "SCHEDULED",
        caseCount: 7,
      },
      {
        id: "demo-meeting-2",
        title: "ประชุมติดตามสำนวนเร่งด่วน",
        meetingNo: "สาธิต 9/2569",
        meetingDate: dateFrom(now, 12),
        status: "DRAFT",
        caseCount: 4,
      },
    ],
  };
}

export class DemoDashboardDataSource implements DashboardDataSource {
  readonly kind = "demo" as const;

  constructor(private readonly now = new Date()) {}

  async load() {
    return createDemoDashboardPayload(this.now);
  }
}
