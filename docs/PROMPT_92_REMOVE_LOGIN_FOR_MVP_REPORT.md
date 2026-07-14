# Prompt 92: Remove Login Completely for Immediate MVP Access

## 1. Executive Summary
This update introduces a new global `AUTH_MODE=none` environment configuration specifically designed for immediate MVP usability testing. In this mode, the system bypasses all authentication screens, Microsoft login requirements, and internal passcode checks. The system automatically provisions a default `MVP User` session behind the scenes to allow unhindered access to all core application workflows while retaining business logic and input validation. The Microsoft Authentication implementation has been safely preserved and can be re-enabled at any time by reverting the environment variable.

## 2. Auth Behavior Before
- `AUTH_MODE=microsoft`: Forced all users to log in via Azure AD / Microsoft Graph. Unauthenticated traffic to protected pages (`/dashboard`, `/cases`, etc.) and APIs was redirected to `/login` or blocked with HTTP 401.
- `AUTH_MODE=simple`: Required an internal MVP passcode mapped to an HTTP-only cookie.

## 3. Auth Behavior After
- The system now recognizes `AUTH_MODE=none`.
- When set, all redirection and NextAuth enforcement logic within the middleware is completely bypassed.
- The root layout alerts users that they are in an open MVP Testing mode to prevent unintentional misclassification of the environment.

## 4. AUTH_MODE=none Behavior
- **Middleware**: Instantly yields `NextResponse.next()` for all protected routes, eliminating the `/login` redirection. If users attempt to hit `/login` directly, they are seamlessly forwarded to `/dashboard`.
- **Session Provisioning**: The `getCurrentUser` module safely constructs and returns a synthetic `{ id: "mvp-user", name: "MVP User", role: "ADMIN" }` identity rather than invoking `getServerSession`. This bypasses NextAuth safely and fulfills all database relational requirements globally.

## 5. Microsoft Auth Preservation Status
- **Preserved**: `next-auth` pipelines, `authOptions.ts`, provider configurations, and the Microsoft UI button are untouched and fully preserved. They are simply disabled dynamically when `AUTH_MODE` is not `microsoft`.

## 6. Pages Now Accessible Without Login
- `/` (redirects to `/dashboard`)
- `/dashboard`
- `/cases`
- `/cases/[id]`
- `/registry/import`
- `/library`
- `/legal-qa` (if exposed)
- `/documents` / `/templates`

## 7. APIs Now Accessible Without Login
All internal API operations are fully functional for the synthetic MVP user, including:
- `/api/health/db`
- `/api/cases/*`
- `/api/registry/import`
- `/api/rag/*`

*Crucially: Removal of auth blocks does not mean removal of business rules. Form validations, duplicate checks, schema verification, and database integrities remain 100% active.*

## 8. Default MVP User / Role
- **ID**: `mvp-user`
- **Name**: `MVP User`
- **Email**: `mvp@local`
- **Role**: `ADMIN` (Fallback) or whatever `process.env.MVP_DEFAULT_ROLE` evaluates to.
- **Status**: `ACTIVE`

## 9. Files Changed
1. `src/lib/auth/mvp-auth.ts`: Added `isNoneAuthEnabled` and immediate return of mock user on `none` mode.
2. `src/proxy.ts`: Added route bypass for `authMode === "none"` and `/login` redirection handler.
3. `src/lib/auth/currentUser.ts`: Included `"none"` mode in the MVP fallback trap.
4. `src/app/layout.tsx`: Inserted a conditional yellow "MVP Testing Mode" warning banner across the system header.
5. `src/components/UserMenu.tsx`: Altered the profile icon to a non-clickable "MVP Mode" text for the `mvp@local` user to prevent manual sign-out errors.
6. `.env.example`: Updated reference documentation.

## 10. Verification Results
- Manual inspection reveals `getCurrentUser()` evaluates predictably.
- `hasPermission` naturally permits the `ADMIN` assigned default.
- UI does not scatter auth warnings when loaded in MVP internal configuration.

## 11. Build / Lint / Typecheck / Prisma Results
- `npm run typecheck`: Passed
- `npx prisma validate`: Passed
- `npx prisma generate`: Passed
- `npm run build`: Passed cleanly in approx 16.6s.

## 12. Known Security Limitation
- **Zero Accountability**: Since every tester masquerades as `MVP User`, no single action in the database or audit logs can be definitively tied to a specific human.
- **Open Internet Vulnerability**: If deployed directly to the public web with `AUTH_MODE=none` without an intervening VPN, IP restriction, or basic-auth firewall, *anyone* on the planet can read and modify the database. This is designed strictly for local or protected network review.

## 13. How to Re-enable Microsoft Login Later
1. Navigate to the hosting provider (e.g., Vercel) dashboard.
2. Open Settings > Environment Variables.
3. Edit `AUTH_MODE` and change the value to `microsoft`.
4. Trigger a new deployment to forcefully clear static cache.
5. Users will be instantly prompted to use NextAuth Entra ID upon the next visit.
