import prisma from '../src/lib/db';

async function main() {
  const isDryRun = process.env.PILOT_SEED_DRY_RUN === 'true' || process.env.PILOT_SEED_CONFIRM !== 'YES';

  // Production detection: use NODE_ENV only. Do NOT rely on DATABASE_URL content,
  // because staging Supabase projects also use pooler URLs, which would cause false positives.
  const isProductionEnv = process.env.NODE_ENV === 'production';

  // Staging Supabase projects use pooler URLs — allow staging seed via ALLOW_STAGING_PILOT_SEED.
  // Production requires the harder ALLOW_PRODUCTION_PILOT_SEED flag — never set this for staging.
  const isStagingPoolerUrl = process.env.DATABASE_URL?.includes('pooler') && !isProductionEnv;
  const requiresOverride = isProductionEnv || isStagingPoolerUrl;

  console.log(`Starting Pilot Data Seeding...`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'REAL'}`);
  console.log(`Production ENV: ${isProductionEnv}`);
  console.log(`Pooler URL detected (staging flag required): ${isStagingPoolerUrl}`);

  if (isProductionEnv && process.env.ALLOW_PRODUCTION_PILOT_SEED !== 'YES') {
    console.error("ERROR: Production environment (NODE_ENV=production) detected. Set ALLOW_PRODUCTION_PILOT_SEED=YES to proceed. WARNING: this will mutate production data.");
    process.exit(1);
  }

  if (isStagingPoolerUrl && process.env.ALLOW_STAGING_PILOT_SEED !== 'YES') {
    console.error("BLOCKED: Supabase pooler URL detected outside of production NODE_ENV. This likely means a staging Supabase project. Set ALLOW_STAGING_PILOT_SEED=YES to confirm you are targeting a confirmed non-production staging database.");
    process.exit(1);
  }

  if (isDryRun) {
    console.log("--- DRY RUN MODE ---");
    console.log("No data will be inserted or modified.");
  } else {
    console.log("--- REAL SEED MODE ---");
  }


  const pilotUsers = [
    { email: 'uat-admin@example.test', name: 'Pilot Admin', role: 'ADMIN', status: 'ACTIVE' },
    { email: 'uat-case-manager@example.test', name: 'Pilot Registry', role: 'REGISTRY_OFFICER', status: 'ACTIVE' },
    { email: 'uat-drafter@example.test', name: 'Pilot Drafter', role: 'LEGAL_OFFICER', status: 'ACTIVE' },
    { email: 'uat-reviewer@example.test', name: 'Pilot Reviewer', role: 'COMMISSIONER', status: 'ACTIVE' },
    { email: 'uat-viewer@example.test', name: 'Pilot Viewer', role: 'VIEWER', status: 'ACTIVE' }
  ];

  const pilotCases = [
    { blackNumber: 'PILOT-CASE-001', type: 'ร้องทุกข์', petitionerName: 'PILOT_PETITIONER_1', respondentName: 'PILOT_RESPONDENT_1', subject: 'ร้องทุกข์ภาคทัณฑ์', legalCategory: 'วินัยไม่ร้ายแรง', currentStatus: 'รับเรื่อง' },
    { blackNumber: 'PILOT-CASE-002', type: 'อุทธรณ์', petitionerName: 'PILOT_PETITIONER_2', respondentName: 'PILOT_RESPONDENT_2', subject: 'อุทธรณ์ปลดออก', legalCategory: 'วินัยร้ายแรง', currentStatus: 'อยู่ระหว่างพิจารณา/ร่างคำวินิจฉัย' },
    { blackNumber: 'PILOT-CASE-003', type: 'ร้องทุกข์', petitionerName: 'PILOT_PETITIONER_3', respondentName: 'PILOT_RESPONDENT_3', subject: 'ร้องทุกข์ไม่เลื่อนขั้น', legalCategory: 'การบริหารงานบุคคล', currentStatus: 'รอเข้าประชุม' },
    { blackNumber: 'PILOT-CASE-004', type: 'อุทธรณ์', petitionerName: 'PILOT_PETITIONER_4', respondentName: 'PILOT_RESPONDENT_4', subject: 'อุทธรณ์ไล่ออก', legalCategory: 'วินัยร้ายแรง', currentStatus: 'รอดำเนินการทางธุรการ (จัดทำรูปเล่ม)' },
    { blackNumber: 'PILOT-CASE-005', type: 'อุทธรณ์', petitionerName: 'PILOT_PETITIONER_5', respondentName: 'PILOT_RESPONDENT_5', subject: 'อุทธรณ์ไล่ออก', legalCategory: 'วินัยร้ายแรง', currentStatus: 'เสร็จสิ้น', decisionResult: 'ยกอุทธรณ์', redNumber: 'PILOT-RED-005' },
    { blackNumber: 'PILOT-CASE-006', type: 'ร้องทุกข์', petitionerName: 'PILOT_PETITIONER_6', respondentName: 'PILOT_RESPONDENT_6', subject: 'ร้องทุกข์ย้ายไม่เป็นธรรม', legalCategory: 'การแต่งตั้งโยกย้าย', currentStatus: 'รับเรื่อง' },
    { blackNumber: 'PILOT-CASE-007', type: 'ร้องทุกข์', petitionerName: 'PILOT_PETITIONER_7', respondentName: 'PILOT_RESPONDENT_7', subject: 'ร้องทุกข์วินัย', legalCategory: 'วินัยไม่ร้ายแรง', currentStatus: 'รอเข้าประชุม' },
    { blackNumber: 'PILOT-CASE-008', type: 'อุทธรณ์', petitionerName: 'PILOT_PETITIONER_8', respondentName: 'PILOT_RESPONDENT_8', subject: 'อุทธรณ์ให้ออก', legalCategory: 'วินัยร้ายแรง', currentStatus: 'รับเรื่อง' }
  ];

  let createdCount = 0;
  let skippedCount = 0;

  if (isDryRun) {
    console.log(`[DRY RUN] Would upsert ${pilotUsers.length} users.`);
    console.log(`[DRY RUN] Would upsert ${pilotCases.length} cases.`);
    console.log(`[DRY RUN] Would upsert 1 meeting.`);
    console.log(`[DRY RUN] Would upsert 1 draft.`);
  } else {
    for (const u of pilotUsers) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: u
      });
      createdCount++;
    }

    let legalOfficer = await prisma.user.findFirst({ where: { role: 'LEGAL_OFFICER' } });

    for (const c of pilotCases) {
      const createdCase = await prisma.case.upsert({
        where: { blackNumber: c.blackNumber },
        update: {},
        create: {
          ...c,
          legalOfficerId: legalOfficer?.id,
          legalOfficerName: legalOfficer?.name
        }
      });
      createdCount++;

      if (c.blackNumber === 'PILOT-CASE-002') {
        const existingDraft = await prisma.decisionDraft.findFirst({ where: { caseId: createdCase.id } });
        if (!existingDraft) {
          await prisma.decisionDraft.create({
            data: {
              caseId: createdCase.id,
              title: 'PILOT_DRAFT_1',
              status: 'draft',
              sections: {
                create: [
                  { sectionType: 'facts', content: 'PILOT_FACTS_TEXT', order: 1, status: 'in_progress' }
                ]
              }
            }
          });
          createdCount++;
        }
      }
    }

    const meeting = await prisma.meeting.findFirst({ where: { meetingNo: 'PILOT-MTG-1' } });
    if (!meeting) {
      await prisma.meeting.create({
        data: {
          title: 'PILOT_MEETING_1',
          meetingNo: 'PILOT-MTG-1',
          meetingDate: new Date(),
          status: 'SCHEDULED'
        }
      });
      createdCount++;
    }

    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (adminUser) {
      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'PILOT_SEED_EXECUTED',
          entityType: 'SYSTEM',
          entityId: 'SYSTEM',
          afterValue: `Seeded ${createdCount} records`
        }
      });
    }
  }

  console.log(`\n--- SUMMARY ---`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'REAL'}`);
  console.log(`Records Planned: ${pilotUsers.length + pilotCases.length + 2}`);
  console.log(`Records Created/Updated: ${createdCount}`);
  console.log(`Records Skipped: ${skippedCount}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
