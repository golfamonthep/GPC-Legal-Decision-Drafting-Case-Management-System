This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database Setup (Prisma + PostgreSQL)

This project uses Prisma as its ORM and PostgreSQL as the database.
Currently, the UI runs on mock data, but we are migrating to the database.

To get the database running:
1. Ensure you have a PostgreSQL server running.
2. Create a `.env` file in the root directory (based on `.env.example` if available) and add your connection string:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
   ```
3. Run migrations to create the tables:
   ```bash
   npx prisma migrate dev
   ```
4. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```

5. Seed the database with mock data for cases and users:
   ```bash
   npm run db:seed
   ```

### pgvector Setup for Embeddings
This project uses `pgvector` for document embeddings. 
- Ensure your PostgreSQL database supports the `vector` extension.
- The `vector` extension is created automatically via Prisma migrations. 
- Because we use Prisma's `Unsupported("vector(1536)")` type, ensure you use `npx prisma migrate dev` (which executes our raw SQL for indexes and extensions) rather than just `prisma db push` if you want the full search functionality.
- We currently assume the `text-embedding-3-small` model which outputs `1536` dimensions. If you upgrade to `text-embedding-3-large`, the database schema must be updated to use `vector(3072)`.

For detailed steps on the migration from mock data, see [MIGRATION_PATH.md](docs/MIGRATION_PATH.md).

## Microsoft Graph / OneDrive Integration
To configure document storage using Microsoft SharePoint/OneDrive, please see the [Microsoft Graph Integration Guide](docs/MICROSOFT_GRAPH_INTEGRATION.md).

## Authentication & Permissions
To configure Microsoft Entra ID authentication and manage role-based access, please see the [Microsoft Auth and Roles Guide](docs/MICROSOFT_AUTH_AND_ROLES.md).

- [Micro-service Structure](./docs/MICROSERVICE_ARCHITECTURE.md)
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)

### Modules & Workflows
- [Case Assignment and Workload Balancing Workflow](docs/assignments/CASE_ASSIGNMENT_WORKFLOW.md)
- [Meeting Agenda and Board Review Workflow](docs/meetings/MEETING_AGENDA_WORKFLOW.md)
  - [Board Review Checklist](docs/meetings/BOARD_REVIEW_CHECKLIST.md)

## Development Setups

## 🚀 Setup & Development Checklist
- Set DATABASE_URL in Vercel Production
- Set OPENAI_API_KEY in Vercel Production
- Set EMBEDDING_MODEL
- Redeploy after changing env vars
- Run production migrations
- Seed production database only when intended

  
## Security Review  
See [Production Security Review](docs/PRODUCTION_SECURITY_REVIEW.md) for details.

## Pilot Training and SOP
- [Pilot User Training Guide](docs/training/PILOT_USER_TRAINING.md)
- [Pilot Operation SOP](docs/training/SOP_PILOT_OPERATION.md)
- [Quick Start Guide](docs/training/QUICK_START.md)
- [Training Checklist](docs/training/TRAINING_CHECKLIST.md)

## Pilot Feedback Loop
- [Pilot Feedback Loop](docs/training/PILOT_FEEDBACK_LOOP.md)
- [Pilot Issue Log](docs/training/PILOT_ISSUE_LOG.md)
- [Pilot Weekly Review Template](docs/training/PILOT_WEEKLY_REVIEW_TEMPLATE.md)
- [Pilot Release Notes Template](docs/training/PILOT_RELEASE_NOTES_TEMPLATE.md)
- [Pilot Backlog](docs/training/PILOT_BACKLOG.md)

## Stabilization and Pilot Rollout
- [Stabilization Sprint Plan](docs/stabilization/STABILIZATION_SPRINT_PLAN.md)
- [Stabilization Backlog](docs/stabilization/STABILIZATION_BACKLOG.md)
- [Regression Test Checklist](docs/stabilization/REGRESSION_TEST_CHECKLIST.md)
- [Release Decision Log](docs/stabilization/RELEASE_DECISION_LOG.md)

## Wider Rollout and Change Management
- [Wider Rollout Plan](docs/rollout/WIDER_ROLLOUT_PLAN.md)
- [Change Management Plan](docs/rollout/CHANGE_MANAGEMENT_PLAN.md)
- [Rollout Readiness Checklist](docs/rollout/ROLLOUT_READINESS_CHECKLIST.md)
- [Support Model](docs/rollout/SUPPORT_MODEL.md)
- [Rollback and Pause Plan](docs/rollout/ROLLBACK_AND_PAUSE_PLAN.md)

## Executive Dashboard and Reporting
- [Executive Dashboard Documentation](docs/reports/EXECUTIVE_DASHBOARD.md)
# #   A d v a n c e d   S e a r c h   a n d   C a s e   I n t e l l i g e n c e  
 -   [ A d v a n c e d   S e a r c h   G u i d e ] ( d o c s / s e a r c h / A D V A N C E D _ S E A R C H . m d )  
 -   [ C a s e   I n t e l l i g e n c e   G u i d e ] ( d o c s / s e a r c h / C A S E _ I N T E L L I G E N C E . m d )  

## Data Quality Cleanup Workflow
- [Data Quality Cleanup Workflow](docs/data-quality/DATA_QUALITY_CLEANUP_WORKFLOW.md)
- [Data Quality Field Rules](docs/data-quality/DATA_QUALITY_FIELD_RULES.md)