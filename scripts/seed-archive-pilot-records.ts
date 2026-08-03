import { PrismaClient } from '../src/generated/prisma';

const isProductionEnv = process.env.NODE_ENV === 'production';
const isStagingPoolerUrl = process.env.DATABASE_URL?.includes('pooler') && !isProductionEnv;

const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--execute');

const ALLOW_ARCHIVE_PILOT_SEED = process.env.ALLOW_ARCHIVE_PILOT_SEED === 'YES';

async function main() {
  console.log('--- Archive Pilot Records Seeding ---');
  console.log(`Mode: ${isDryRun ? 'DRY-RUN' : 'EXECUTE'}`);
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run this script');
  }

  if (isProductionEnv) {
    console.error('ERROR: Cannot run pilot seed in production environment (NODE_ENV=production).');
    process.exit(1);
  }

  if (isStagingPoolerUrl && !ALLOW_ARCHIVE_PILOT_SEED) {
    console.error('ERROR: Staging pooler URL detected but ALLOW_ARCHIVE_PILOT_SEED is not set to YES.');
    process.exit(1);
  }

  if (!isDryRun && !ALLOW_ARCHIVE_PILOT_SEED) {
    console.error('ERROR: Execute mode requires ALLOW_ARCHIVE_PILOT_SEED=YES.');
    process.exit(1);
  }

  console.log('Environment checks passed.');
  
  const prisma = new PrismaClient();
  
  try {
    const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
        console.error('ERROR: No ADMIN user found for creating cases.');
        process.exit(1);
    }
    
    const pilotCases = [
      {
        blackNumber: 'PILOT_ARCHIVE_ELIGIBLE_001',
        type: 'ร้องทุกข์',
        subject: 'Pilot Eligible Case',
        petitionerName: 'Pilot Petitioner 1',
        respondentName: 'Pilot Respondent 1',
        legalCategory: 'วินัย',
        currentStatus: 'FINALIZED',
        ownerId: adminUser.id,
      },
      {
        blackNumber: 'PILOT_ARCHIVE_BLOCKED_ACTIVE_001',
        type: 'ร้องทุกข์',
        subject: 'Pilot Active Case',
        petitionerName: 'Pilot Petitioner 2',
        respondentName: 'Pilot Respondent 2',
        legalCategory: 'วินัย',
        currentStatus: 'REVIEW',
        ownerId: adminUser.id,
      },
      {
        blackNumber: 'PILOT_ARCHIVE_BLOCKED_DISPATCH_001',
        type: 'อุทธรณ์',
        subject: 'Pilot Dispatch Case',
        petitionerName: 'Pilot Petitioner 3',
        respondentName: 'Pilot Respondent 3',
        legalCategory: 'อุทธรณ์',
        currentStatus: 'READY_TO_ARCHIVE',
        ownerId: adminUser.id,
      },
      {
        blackNumber: 'PILOT_ARCHIVE_BLOCKED_LEGAL_HOLD_001',
        type: 'อุทธรณ์',
        subject: 'Pilot Legal Hold Case',
        petitionerName: 'Pilot Petitioner 4',
        respondentName: 'Pilot Respondent 4',
        legalCategory: 'อุทธรณ์',
        currentStatus: 'HOLD',
        ownerId: adminUser.id,
      },
      {
        blackNumber: 'PILOT_ARCHIVE_BLOCKED_ALREADY_001',
        type: 'ร้องทุกข์',
        subject: 'Pilot Already Archived Case',
        petitionerName: 'Pilot Petitioner 5',
        respondentName: 'Pilot Respondent 5',
        legalCategory: 'วินัย',
        currentStatus: 'ARCHIVED',
        ownerId: adminUser.id,
      }
    ];

    console.log(`Planning to seed ${pilotCases.length} pilot archive records...`);

    if (isDryRun) {
      console.log('[DRY-RUN] No records will be created.');
      for (const pc of pilotCases) {
        console.log(`[DRY-RUN] Would upsert case: ${pc.blackNumber} with status ${pc.currentStatus}`);
      }
      console.log('[DRY-RUN] Completed successfully.');
    } else {
      console.log('Executing seed...');
      let count = 0;
      for (const pc of pilotCases) {
        await prisma.case.upsert({
          where: { type_blackNumber: { type: pc.type, blackNumber: pc.blackNumber } },
          update: { currentStatus: pc.currentStatus },
          create: pc
        });
        count++;
      }
      console.log(`Successfully upserted ${count} pilot archive records.`);
    }

  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
