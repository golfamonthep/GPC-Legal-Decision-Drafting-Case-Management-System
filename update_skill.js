const fs = require('fs');

const skillUpdate = `
## 12. Prompt 85: Controlled Launch Gate Rules
- **Launch is not guaranteed**: Launch gate prompts must verify code build, Prisma validation, and safety rules before approving a launch.
- **No-Go Criteria**: If \`npm run build\` fails, or critical data integrity/safety issues exist, the launch must be aborted.
- **Pilot Scope**: This is a controlled internal pilot, not full production.
- **Launch Checklist**: Must verify Legal Q&A warning, DOCX restrictions, security, business logic, and actual code build success.
`;

fs.appendFileSync('SKILL.md', skillUpdate);
