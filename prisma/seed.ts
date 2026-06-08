import { PrismaClient } from '@prisma/client'

import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...')

  // 1. Create Users
  const userAdmin = await prisma.user.upsert({
    where: { email: 'admin@gpc.go.th' },
    update: {},
    create: {
      email: 'admin@gpc.go.th',
      name: 'ผู้ดูแลระบบ',
      role: 'admin',
    },
  })

  const userCommissioner = await prisma.user.upsert({
    where: { email: 'commissioner@gpc.go.th' },
    update: {},
    create: {
      email: 'commissioner@gpc.go.th',
      name: 'พล.ต.อ. ตัวอย่าง กรรมการ',
      role: 'commissioner',
    },
  })

  const userLegalOfficer = await prisma.user.upsert({
    where: { email: 'legal@gpc.go.th' },
    update: {},
    create: {
      email: 'legal@gpc.go.th',
      name: 'นิติกร ทดสอบ',
      role: 'legal_officer',
    },
  })

  console.log('Users seeded.')

  // 2. Create Cases
  const case1 = await prisma.case.upsert({
    where: { blackNumber: 'ร.1/2567' },
    update: {},
    create: {
      type: 'ร้องทุกข์',
      blackNumber: 'ร.1/2567',
      petitionerName: 'พ.ต.ท. สมชาย ร้องทุกข์',
      respondentName: 'ผบ.ตร.',
      subject: 'ร้องทุกข์ไม่ได้รับความเป็นธรรมในการแต่งตั้งข้าราชการตำรวจ',
      legalCategory: 'การแต่งตั้งโยกย้าย',
      ownerId: userCommissioner.id,
      legalOfficerId: userLegalOfficer.id,
      receivedDate: new Date('2024-01-15T00:00:00.000Z'),
      currentStatus: 'รอตรวจร่าง',
      decisionResult: 'ฟังไม่ขึ้น / ยกคำร้องทุกข์',
      documents: {
        create: [
          {
            title: 'คำร้องทุกข์',
            fileUrl: '/mock/complaint.pdf',
            type: 'complaint',
          },
        ],
      },
      events: {
        create: [
          {
            action: 'รับเรื่องร้องทุกข์',
            actorName: 'นิติกร ทดสอบ',
            timestamp: new Date('2024-01-15T10:00:00.000Z'),
          },
          {
            action: 'มอบหมายกรรมการเจ้าของสำนวน',
            actorName: 'ผู้ดูแลระบบ',
            timestamp: new Date('2024-01-16T10:00:00.000Z'),
          },
        ],
      },
      drafts: {
        create: [
          {
            title: 'ร่างคำวินิจฉัย (ฟังไม่ขึ้น)',
            status: 'draft',
            sections: {
              create: [
                {
                  sectionType: 'facts',
                  content: 'ผู้ร้องทุกข์อ้างว่าตนมีคุณสมบัติครบถ้วนแต่ไม่ได้รับการแต่งตั้งให้ดำรงตำแหน่งที่สูงขึ้นในการแต่งตั้งวาระประจำปี...',
                  order: 1,
                  status: 'completed',
                },
                {
                  sectionType: 'issues',
                  content: 'ประเด็นที่ต้องวินิจฉัย: การแต่งตั้งข้าราชการตำรวจตามคำสั่งที่อ้างถึง เป็นไปตามหลักเกณฑ์และวิธีการที่กฎหมายกำหนดหรือไม่',
                  order: 2,
                  status: 'completed',
                },
                {
                  sectionType: 'reasoning',
                  content: 'พิจารณาแล้วเห็นว่า ผู้มีอำนาจแต่งตั้งได้พิจารณาตามความเหมาะสมและเป็นไปตามกฎ ก.ตร. ว่าด้วยการแต่งตั้งข้าราชการตำรวจแล้ว...',
                  order: 3,
                  status: 'in_progress',
                },
                {
                  sectionType: 'conclusion',
                  content: 'จึงวินิจฉัยให้ยกคำร้องทุกข์',
                  order: 4,
                  status: 'pending',
                },
              ],
            },
          },
        ],
      },
    },
  })

  const case2 = await prisma.case.upsert({
    where: { blackNumber: 'อ.1/2567' },
    update: {},
    create: {
      type: 'อุทธรณ์',
      blackNumber: 'อ.1/2567',
      petitionerName: 'ส.ต.อ. ผู้ถูกลงโทษ',
      respondentName: 'ผบ.กช.',
      subject: 'อุทธรณ์คำสั่งลงโทษไล่ออกจากราชการ',
      legalCategory: 'วินัยร้ายแรง',
      ownerId: userCommissioner.id,
      legalOfficerId: userLegalOfficer.id,
      receivedDate: new Date('2024-02-20T00:00:00.000Z'),
      currentStatus: 'รอเข้าประชุม',
      decisionResult: 'ฟังขึ้น / ยกเลิกคำสั่ง',
      documents: {
        create: [
          {
            title: 'หนังสืออุทธรณ์',
            fileUrl: '/mock/appeal.pdf',
            type: 'appeal',
          },
          {
            title: 'พยานหลักฐานเพิ่มเติม',
            fileUrl: '/mock/evidence.pdf',
            type: 'evidence',
          },
        ],
      },
      events: {
        create: [
          {
            action: 'รับเรื่องอุทธรณ์',
            actorName: 'นิติกร ทดสอบ',
            timestamp: new Date('2024-02-20T10:00:00.000Z'),
          },
        ],
      },
      drafts: {
        create: [
          {
            title: 'ร่างคำวินิจฉัย (ฟังขึ้น)',
            status: 'review',
            sections: {
              create: [
                {
                  sectionType: 'facts',
                  content: 'ผู้อุทธรณ์ถูกกล่าวหาว่ากระทำผิดวินัยอย่างร้ายแรงฐานละทิ้งหน้าที่ราชการติดต่อกันในคราวเดียวกันเป็นเวลาเกิน 15 วัน...',
                  order: 1,
                  status: 'completed',
                },
                {
                  sectionType: 'issues',
                  content: 'ประเด็นที่ต้องวินิจฉัย: คำสั่งลงโทษไล่ผู้อุทธรณ์ออกจากราชการชอบด้วยกฎหมายหรือไม่',
                  order: 2,
                  status: 'completed',
                },
                {
                  sectionType: 'reasoning',
                  content: 'พิจารณาแล้วเห็นว่า ผู้อุทธรณ์มีเหตุผลความจำเป็น 불가피ที่ทำให้ไม่สามารถมาปฏิบัติหน้าที่ได้ และได้พยายามแจ้งให้ผู้บังคับบัญชาทราบแล้ว...',
                  order: 3,
                  status: 'completed',
                },
                {
                  sectionType: 'conclusion',
                  content: 'จึงวินิจฉัยให้ยกเลิกคำสั่งลงโทษไล่ออกจากราชการ และให้ผู้บังคับบัญชาพิจารณาดำเนินการให้ผู้อุทธรณ์กลับเข้ารับราชการต่อไป',
                  order: 4,
                  status: 'completed',
                },
              ],
            },
          },
        ],
      },
    },
  })

  console.log('Cases seeded.')

  // 3. Legal Sources
  await prisma.legalSource.deleteMany() // Clear old ones just in case

  const source1 = await prisma.legalSource.create({
    data: {
      title: 'พ.ร.บ. ตำรวจแห่งชาติ พ.ศ. 2565',
      documentType: 'พระราชบัญญัติ',
      referenceNumber: 'พ.ร.บ.ตร.2565',
      year: 2565,
      legalCategory: 'การบริหารงานบุคคล',
      issueTags: ['การแต่งตั้ง', 'สิทธิร้องทุกข์'],
      lawNames: ['พระราชบัญญัติตำรวจแห่งชาติ'],
      sectionNumbers: ['114'],
      sourceStatus: 'ใช้งาน',
      reliabilityLevel: 'official',
      date: new Date('2022-10-16T00:00:00.000Z'),
      effectiveDate: new Date('2022-10-17T00:00:00.000Z'),
      url: '#',
      clauses: {
        create: [
          {
            clauseNumber: 'มาตรา 114',
            content: 'ข้าราชการตำรวจผู้ใดเห็นว่าตนไม่ได้รับความเป็นธรรมในการแต่งตั้ง ให้มีสิทธิร้องทุกข์ต่อ ก.พ.ค.ตร.',
          },
        ],
      },
    },
  })

  const source2 = await prisma.legalSource.create({
    data: {
      title: 'คำวินิจฉัย ก.พ.ค.ตร. เรื่อง การพิจารณาความผิดวินัยร้ายแรง (มาตรฐาน)',
      documentType: 'คำวินิจฉัย ก.พ.ค.ตร.',
      referenceNumber: 'ว.1/2566',
      year: 2566,
      caseType: 'อุทธรณ์',
      legalCategory: 'วินัยร้ายแรง',
      issueTags: ['ละทิ้งหน้าที่ราชการ', 'วินัยร้ายแรง'],
      decisionResult: 'ยกเลิกคำสั่ง',
      sourceStatus: 'ใช้งาน',
      reliabilityLevel: 'official',
      date: new Date('2023-05-10T00:00:00.000Z'),
      url: '#'
    }
  })

  const source3 = await prisma.legalSource.create({
    data: {
      title: 'ร่าง กฎ ก.ตร. ว่าด้วยการแต่งตั้งข้าราชการตำรวจ พ.ศ. 2567 (ฉบับร่าง)',
      documentType: 'กฎ ก.ตร.',
      referenceNumber: 'ร่าง 1/2567',
      year: 2567,
      legalCategory: 'การแต่งตั้งโยกย้าย',
      issueTags: ['การแต่งตั้ง'],
      sourceStatus: 'ร่าง',
      reliabilityLevel: 'draft',
      url: '#'
    }
  })

  console.log('Legal Sources seeded.')

  // 4. Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: userAdmin.id,
      action: 'SYSTEM_SEED',
      entityType: 'Database',
      entityId: 'SYSTEM',
      afterValue: 'Initial database seed with mock data completed',
    },
  })

  console.log('Audit Logs seeded.')
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
