export type CaseType = "ร้องทุกข์" | "อุทธรณ์";

export type CaseStatus = 
  | "รับเรื่อง"
  | "ตรวจสอบคำร้อง"
  | "รอคำแก้"
  | "แสวงหาข้อเท็จจริง"
  | "รอเอกสาร/คำชี้แจง"
  | "รอตรวจร่าง"
  | "รอเข้าประชุม"
  | "มีมติแล้ว"
  | "แจ้งผลแล้ว"
  | "เสร็จสิ้น"
  | "เสร็จสิ้น (ศาลปกครอง)"
  | "ยุติเรื่อง"
  | "ปิดเรื่อง";

export interface Case {
  id: string;
  type: CaseType;
  blackNumber: string;
  redNumber?: string;
  petitionerName: string; // ผู้ร้องทุกข์ / ผู้อุทธรณ์
  respondentName: string; // ผู้ถูกร้องทุกข์ / คู่กรณี
  subject: string;
  legalCategory: string;
  ownerCommissioner: string;
  legalOfficer: string;
  receivedDate: string;
  dueDates: {
    days30: string;
    days60: string;
    days90: string;
    days120: string;
    days240: string;
  };
  currentStatus: CaseStatus | string;
  proceedingNote?: string;
  updatedAt?: string;
  meetingDate?: string;
  decisionResult?: string;
  oneDriveUrl?: string;
  draftUrl?: string;
  // Computed property for UI convenience
  isOverdue?: boolean;
  daysUntilDue?: number;
}

export interface Activity {
  id: string;
  caseId: string;
  action: string;
  actor: string;
  timestamp: string;
}

export interface LegalResource {
  id: string;
  title: string;
  type: "คำวินิจฉัย ก.พ.ค.ตร." | "คำพิพากษาศาลปกครองสูงสุด" | "พระราชบัญญัติ" | "กฎ ก.ตร." | "กฎ ก.พ.ค.ตร." | "ถ้อยคำมาตรฐาน";
  referenceNumber?: string;
  date?: string;
  url: string;
}
