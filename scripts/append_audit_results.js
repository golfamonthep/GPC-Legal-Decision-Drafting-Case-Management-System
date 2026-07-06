const fs = require('fs');
const path = require('path');

const files = [
  {
    name: 'PROJECT_STATE.md',
    content: `\n## Full System Completion Audit (Prompt 77)\n* Prompt 77 status: System Audit Completed.\n* current project phase: Feature Freeze + Stabilization.\n* overall readiness: 95% Code Complete.\n* blockers: Staging Environment/Accounts confirmation from Owner.\n* next recommended prompt: Prompt 78 (Next.js 16 Proxy Update & Code Cleanup).\n`
  },
  {
    name: 'ARCHITECTURE.md',
    content: `\n## Full System Completion Audit (Prompt 77)\n- no architecture changes were made.\n- system verified to be structurally sound and deployed correctly.\n- warning on Next.js middleware deprecation noted (requires migrating to proxy in future).\n`
  },
  {
    name: 'DATABASE_SCHEMA.md',
    content: `\n## Full System Completion Audit (Prompt 77)\n- no schema change in Prompt 77.\n- prisma validation passed without errors.\n- schema fully aligns with current application logic.\n`
  },
  {
    name: 'COMPONENT_MAP.md',
    content: `\n## Full System Completion Audit (Prompt 77)\n- verified that all routes in this map exist and compile successfully.\n- no missing or broken page/API routes detected during the build phase.\n`
  },
  {
    name: 'SKILL.md',
    content: `\n## Prompt 77 Rules & Lessons\n* Feature Freeze + Stabilization: During the pre-pilot phase, do not add new features, do not perform major refactors, and do not mutate the schema unless it is a critical blocker.\n* Focus purely on stability, testing, and UX/bug fixes that directly unblock pilot operations.\n`
  }
];

files.forEach(f => {
  const filePath = path.join(__dirname, '..', f.name);
  fs.appendFileSync(filePath, f.content, 'utf8');
  console.log('Appended to ' + f.name);
});
