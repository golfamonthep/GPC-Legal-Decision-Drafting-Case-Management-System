import { Case, LegalResource, Activity } from "../types";
import { addDays, format, subDays } from "date-fns";

const today = new Date();

// Helper to calculate due dates
const calculateDueDates = (receivedDate: Date) => {
  return {
    days30: format(addDays(receivedDate, 30), "yyyy-MM-dd"),
    days60: format(addDays(receivedDate, 60), "yyyy-MM-dd"),
    days90: format(addDays(receivedDate, 90), "yyyy-MM-dd"),
    days120: format(addDays(receivedDate, 120), "yyyy-MM-dd"),
    days240: format(addDays(receivedDate, 240), "yyyy-MM-dd"),
  };
};

// Case 1: Overdue grievance (Received 100 days ago)
const dateCase1 = subDays(today, 100);
// Case 2: Appeal due very soon (Received 85 days ago, due in 5 days for 90-day mark)
const dateCase2 = subDays(today, 85);
// Case 3: New grievance
const dateCase3 = subDays(today, 5);

export const mockCases: Case[] = [
  {
    id: "case-001",
    type: "ร้องทุกข์",
    blackNumber: "ร.12/2567",
    petitionerName: "พ.ต.ท. สมชาย รักชาติ",
    respondentName: "ผู้บัญชาการตำรวจแห่งชาติ",
    subject: "ร้องทุกข์ไม่ได้รับความเป็นธรรมในการแต่งตั้ง",
    legalCategory: "การแต่งตั้งโยกย้าย",
    ownerCommissioner: "นาย ประยุทธ์ ศิริราช",
    legalOfficer: "นางสาว สมหญิง ยุติธรรม",
    receivedDate: format(dateCase1, "yyyy-MM-dd"),
    dueDates: calculateDueDates(dateCase1),
    currentStatus: "รอเข้าประชุม",
    isOverdue: true,
    daysUntilDue: -10, 
    oneDriveUrl: "https://onedrive.live.com/placeholder-case-001",
    draftUrl: "/cases/case-001/draft"
  },
  {
    id: "case-002",
    type: "อุทธรณ์",
    blackNumber: "อ.45/2567",
    redNumber: "อ.แดง.12/2567",
    petitionerName: "ด.ต. วินัย ช่างทำ",
    respondentName: "ผู้บังคับการตำรวจภูธรจังหวัดขอนแก่น",
    subject: "อุทธรณ์คำสั่งลงโทษไล่ออกจากราชการ",
    legalCategory: "วินัยร้ายแรง",
    ownerCommissioner: "พล.ต.อ. เอกราช ยิ่งใหญ่",
    legalOfficer: "นาย สมศักดิ์ กฎหมาย",
    receivedDate: format(dateCase2, "yyyy-MM-dd"),
    dueDates: calculateDueDates(dateCase2),
    currentStatus: "รอตรวจร่าง",
    isOverdue: false,
    daysUntilDue: 5, // Due soon warning should trigger
    oneDriveUrl: "https://onedrive.live.com/placeholder-case-002",
    draftUrl: "/cases/case-002/draft"
  },
  {
    id: "case-003",
    type: "ร้องทุกข์",
    blackNumber: "ร.112/2567",
    petitionerName: "ร.ต.อ. หญิง สุดารัตน์ งามตา",
    respondentName: "ผู้บัญชาการตำรวจนครบาล",
    subject: "ร้องทุกข์เรื่องการประเมินผลการปฏิบัติราชการ",
    legalCategory: "การประเมินผล",
    ownerCommissioner: "นาย ประยุทธ์ ศิริราช",
    legalOfficer: "นางสาว สมหญิง ยุติธรรม",
    receivedDate: format(dateCase3, "yyyy-MM-dd"),
    dueDates: calculateDueDates(dateCase3),
    currentStatus: "รับเรื่อง",
    isOverdue: false,
    daysUntilDue: 85,
    oneDriveUrl: "https://onedrive.live.com/placeholder-case-003",
    draftUrl: "/cases/case-003/draft"
  },
  {
    id: "case-004",
    type: "อุทธรณ์",
    blackNumber: "อ.89/2567",
    petitionerName: "ร.ต.ท. มานะ อดทน",
    respondentName: "ผู้บังคับการตำรวจจราจร",
    subject: "อุทธรณ์คำสั่งลงโทษตัดเงินเดือน",
    legalCategory: "วินัยไม่ร้ายแรง",
    ownerCommissioner: "พล.ต.ท. สมเกียรติ ยุติธรรม",
    legalOfficer: "นาย สมศักดิ์ กฎหมาย",
    receivedDate: format(subDays(today, 20), "yyyy-MM-dd"),
    dueDates: calculateDueDates(subDays(today, 20)),
    currentStatus: "รอคำแก้",
    isOverdue: false,
    daysUntilDue: 70,
    oneDriveUrl: "https://onedrive.live.com/placeholder-case-004",
  },
  {
    id: "case-005",
    type: "ร้องทุกข์",
    blackNumber: "ร.95/2567",
    petitionerName: "พ.ต.อ. สุรศักดิ์ เก่งกาจ",
    respondentName: "ผู้บัญชาการตำรวจสอบสวนกลาง",
    subject: "ร้องทุกข์คำสั่งให้ไปปฏิบัติราชการ",
    legalCategory: "การบริหารงานบุคคล",
    ownerCommissioner: "นาย ประยุทธ์ ศิริราช",
    legalOfficer: "นางสาว สมหญิง ยุติธรรม",
    receivedDate: format(subDays(today, 45), "yyyy-MM-dd"),
    dueDates: calculateDueDates(subDays(today, 45)),
    currentStatus: "แสวงหาข้อเท็จจริง",
    isOverdue: false,
    daysUntilDue: 45,
    oneDriveUrl: "https://onedrive.live.com/placeholder-case-005",
  },
  {
    id: "case-006",
    type: "อุทธรณ์",
    blackNumber: "อ.15/2567",
    redNumber: "อ.แดง.1/2567",
    petitionerName: "ส.ต.อ. ธนัท รักดี",
    respondentName: "ผู้บังคับการตำรวจภูธรจังหวัดเชียงใหม่",
    subject: "อุทธรณ์คำสั่งลงโทษปลดออกจากราชการ",
    legalCategory: "วินัยร้ายแรง",
    ownerCommissioner: "พล.ต.อ. เอกราช ยิ่งใหญ่",
    legalOfficer: "นาย สมศักดิ์ กฎหมาย",
    receivedDate: format(subDays(today, 120), "yyyy-MM-dd"),
    dueDates: calculateDueDates(subDays(today, 120)),
    currentStatus: "มีมติแล้ว",
    isOverdue: false,
    daysUntilDue: 0,
    oneDriveUrl: "https://onedrive.live.com/placeholder-case-006",
  },
  {
    id: "case-007",
    type: "ร้องทุกข์",
    blackNumber: "ร.5/2566",
    redNumber: "ร.แดง.18/2566",
    petitionerName: "พ.ต.ท. วิชัย สายตรง",
    respondentName: "จเรตำรวจแห่งชาติ",
    subject: "ร้องทุกข์การประเมินเพื่อเลื่อนตำแหน่ง",
    legalCategory: "การเลื่อนตำแหน่ง",
    ownerCommissioner: "นาย ประยุทธ์ ศิริราช",
    legalOfficer: "นางสาว สมหญิง ยุติธรรม",
    receivedDate: format(subDays(today, 250), "yyyy-MM-dd"),
    dueDates: calculateDueDates(subDays(today, 250)),
    currentStatus: "แจ้งผลแล้ว",
    isOverdue: false,
    daysUntilDue: 0,
    oneDriveUrl: "https://onedrive.live.com/placeholder-case-007",
  }
];

export const mockLegalResources: LegalResource[] = [
  {
    id: "leg-001",
    title: "คำวินิจฉัย ก.พ.ค.ตร. เรื่อง การพิจารณาความผิดวินัยร้ายแรง (มาตรฐาน)",
    type: "คำวินิจฉัย ก.พ.ค.ตร.",
    referenceNumber: "ว.1/2566",
    url: "#"
  },
  {
    id: "leg-002",
    title: "พระราชบัญญัติตำรวจแห่งชาติ พ.ศ. 2565",
    type: "พระราชบัญญัติ",
    date: "2022-10-16",
    url: "#"
  },
  {
    id: "leg-003",
    title: "กฎ ก.ตร. ว่าด้วยการแต่งตั้งข้าราชการตำรวจ พ.ศ. 2567",
    type: "กฎ ก.ตร.",
    date: "2024-01-10",
    url: "#"
  }
];

export const mockActivities: Activity[] = [
  {
    id: "act-001",
    caseId: "case-001",
    action: "รับเรื่องร้องทุกข์ และออกเลขเรื่องดำ",
    actor: "เจ้าหน้าที่ธุรการ",
    timestamp: format(dateCase1, "yyyy-MM-dd HH:mm:ss")
  },
  {
    id: "act-002",
    caseId: "case-001",
    action: "ส่งสำเนาคำร้องให้คู่กรณีชี้แจง",
    actor: "นางสาว สมหญิง ยุติธรรม",
    timestamp: format(addDays(dateCase1, 5), "yyyy-MM-dd HH:mm:ss")
  },
  {
    id: "act-003",
    caseId: "case-001",
    action: "คู่กรณีส่งคำแก้อุทธรณ์/คำชี้แจง",
    actor: "เจ้าหน้าที่ธุรการ",
    timestamp: format(addDays(dateCase1, 20), "yyyy-MM-dd HH:mm:ss")
  },
  {
    id: "act-004",
    caseId: "case-001",
    action: "แสวงหาข้อเท็จจริงเพิ่มเติมเสร็จสิ้น",
    actor: "นาย ประยุทธ์ ศิริราช",
    timestamp: format(addDays(dateCase1, 60), "yyyy-MM-dd HH:mm:ss")
  },
  {
    id: "act-005",
    caseId: "case-001",
    action: "จัดทำร่างคำวินิจฉัยเสร็จสิ้น รอเข้าประชุม",
    actor: "นางสาว สมหญิง ยุติธรรม",
    timestamp: format(addDays(dateCase1, 85), "yyyy-MM-dd HH:mm:ss")
  }
];
