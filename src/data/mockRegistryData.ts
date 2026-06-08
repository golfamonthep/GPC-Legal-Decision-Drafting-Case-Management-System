export type CaseRegistryEntry = {
  id: string;
  order: number; // ลำดับ
  caseType: 'ร้องทุกข์' | 'อุทธรณ์'; // ประเภทเรื่อง
  blackCaseNo: string; // เรื่องดำ
  redCaseNo: string; // เรื่องแดง
  complainantName: string; // ชื่อผู้ร้องทุกข์/ผู้อุทธรณ์
  parties: string; // คู่กรณี
  subject: string; // เรื่อง
  dateReceived: string; // วันที่รับเรื่อง (ISO string)
  commissioner: string; // กรรมการเจ้าของสำนวน
  legalOfficer: string; // นิติกร
  status: 'รอดำเนินการ' | 'อยู่ระหว่างพิจารณา' | 'รอพิจารณาคำวินิจฉัย' | 'วินิจฉัยแล้ว' | 'จำหน่ายคดี'; // สถานะ
  deadline30: string | null; // วันครบกำหนด 30 วัน
  deadline60: string | null; // วันครบกำหนด 60 วัน
  deadline90: string | null; // วันครบกำหนด 90 วัน
  deadline120: string | null; // วันครบกำหนด 120 วัน
  deadline240: string | null; // วันครบกำหนด 240 วัน
  meetingDate: string | null; // วันประชุม
  decisionResult: string; // ผลคำวินิจฉัย
};

export const mockRegistryData: CaseRegistryEntry[] = [
  {
    id: 'REG-001',
    order: 1,
    caseType: 'ร้องทุกข์',
    blackCaseNo: 'รท.01/2569',
    redCaseNo: '-',
    complainantName: 'พ.ต.ต. สมชาย ใจดี',
    parties: 'ผบก.ภ.จว.เชียงใหม่',
    subject: 'ขอความเป็นธรรมกรณีถูกสั่งย้ายไม่เป็นธรรม',
    dateReceived: '2026-05-15',
    commissioner: 'พล.ต.อ. เอก อังสนานนท์',
    legalOfficer: 'นายสมมุติ รักความยุติธรรม',
    status: 'อยู่ระหว่างพิจารณา',
    deadline30: '2026-06-14',
    deadline60: '2026-07-14',
    deadline90: '2026-08-13',
    deadline120: '2026-09-12',
    deadline240: '2027-01-10',
    meetingDate: '2026-06-20',
    decisionResult: '-',
  },
  {
    id: 'REG-002',
    order: 2,
    caseType: 'อุทธรณ์',
    blackCaseNo: 'อธ.12/2569',
    redCaseNo: 'อธ.แดง.05/2569',
    complainantName: 'ร.ต.อ. หญิง สุดา สวยงาม',
    parties: 'ผบช.น.',
    subject: 'อุทธรณ์คำสั่งลงโทษภาคทัณฑ์',
    dateReceived: '2026-04-10',
    commissioner: 'พล.ต.อ. วินัย ทองสอง',
    legalOfficer: 'นางสาวนิติกร ขยันยิ่ง',
    status: 'วินิจฉัยแล้ว',
    deadline30: '2026-05-10',
    deadline60: '2026-06-09',
    deadline90: '2026-07-09',
    deadline120: '2026-08-08',
    deadline240: '2026-12-06',
    meetingDate: '2026-05-25',
    decisionResult: 'ยกอุทธรณ์',
  },
  {
    id: 'REG-003',
    order: 3,
    caseType: 'ร้องทุกข์',
    blackCaseNo: 'รท.05/2569',
    redCaseNo: '-',
    complainantName: 'ด.ต. มานะ อดทน',
    parties: 'ผกก.สภ.เมืองขอนแก่น',
    subject: 'ร้องทุกข์ผู้บังคับบัญชาไม่อนุมัติวันลา',
    dateReceived: '2026-06-05',
    commissioner: 'พล.ต.ท. อนุชัย เล็กบำรุง',
    legalOfficer: 'นายสมมุติ รักความยุติธรรม',
    status: 'รอดำเนินการ',
    deadline30: '2026-07-05',
    deadline60: '2026-08-04',
    deadline90: '2026-09-03',
    deadline120: '2026-10-03',
    deadline240: '2027-01-31',
    meetingDate: null,
    decisionResult: '-',
  },
  {
    id: 'REG-004',
    order: 4,
    caseType: 'อุทธรณ์',
    blackCaseNo: 'อธ.15/2569',
    redCaseNo: '-',
    complainantName: 'ส.ต.ท. วีระ กล้าหาญ',
    parties: 'ผบก.สปพ.',
    subject: 'อุทธรณ์คำสั่งปลดออกจากราชการ',
    dateReceived: '2026-05-20',
    commissioner: 'พล.ต.ท. อนุชัย เล็กบำรุง',
    legalOfficer: 'นายยุติธรรม นำไทย',
    status: 'อยู่ระหว่างพิจารณา',
    deadline30: '2026-06-19',
    deadline60: '2026-07-19',
    deadline90: '2026-08-18',
    deadline120: '2026-09-17',
    deadline240: '2027-01-15',
    meetingDate: '2026-06-15',
    decisionResult: '-',
  },
  {
    id: 'REG-005',
    order: 5,
    caseType: 'ร้องทุกข์',
    blackCaseNo: 'รท.08/2569',
    redCaseNo: 'รท.แดง.02/2569',
    complainantName: 'พ.ต.ท. ทรงพล มั่นคง',
    parties: 'ตร.',
    subject: 'ร้องทุกข์การประเมินผลการปฏิบัติราชการ',
    dateReceived: '2026-02-15',
    commissioner: 'พล.ต.อ. เอก อังสนานนท์',
    legalOfficer: 'นางสาวนิติกร ขยันยิ่ง',
    status: 'จำหน่ายคดี',
    deadline30: '2026-03-17',
    deadline60: '2026-04-16',
    deadline90: '2026-05-16',
    deadline120: '2026-06-15',
    deadline240: '2026-10-13',
    meetingDate: '2026-03-10',
    decisionResult: 'ถอนเรื่องร้องทุกข์',
  }
];
