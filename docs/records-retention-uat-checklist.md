# Records Retention UAT Checklist

## Access & Permissions
- [ ] Unauthenticated user is blocked and redirected to `/login` when accessing `/records-retention`.
- [ ] Unauthorized user (e.g. VIEWER) is blocked (returns 403 or redirects to dashboard) when accessing `/records-retention`.
- [ ] Authorized user (e.g. COMMISSIONER, LEGAL_OFFICER, REGISTRY_OFFICER) can successfully load `/records-retention`.

## UI Components
- [ ] Summary cards (Total Cases, Archive-Ready, Retained) render correctly.
- [ ] Retention queue table renders.
- [ ] Empty state works (shows clear message when no cases match criteria).
- [ ] Safety notice and Policy reference panels are clearly visible.

## Safety & Data Mutability
- [ ] No mutation occurs when rendering the page.
- [ ] No delete, archive, or purge buttons are functional or present that mutate data.
- [ ] Audit writes do not occur during page render.
- [ ] No actual secret values or internal private data fields are exposed.

## Build & Deployment
- [ ] `npm run build` passes with no errors.
- [ ] Runtime route opens without 500 error on valid data.
- [ ] Prisma queries do not crash the Vercel deployment.
