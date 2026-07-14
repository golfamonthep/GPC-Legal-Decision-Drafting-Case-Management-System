# MVP Simple Internal Access Mode

## 1. Purpose
This document explains the Simple Internal Access Mode, designed specifically for the controlled MVP (Minimum Viable Product) real-use phase. It provides a lightweight authentication mechanism that bypasses Microsoft Entra ID (Azure AD) requirements, allowing early testers and internal operators to access the system easily without complex account setups.

## 2. When to use simple mode
- During the internal MVP testing phase.
- When Microsoft Entra ID accounts are not yet provisioned for all participants.
- In controlled environments where access is limited to known internal staff.
- When rapid feedback from non-technical stakeholders is required without login friction.

## 3. When not to use it
- **Never use in a full public production environment.**
- Do not use if the application is exposed to the public internet without IP whitelisting or VPN protection.
- Do not use when handling highly sensitive, classified, or real un-anonymized legal data outside of the controlled MVP group.

## 4. Required environment variables
To enable Simple Access Mode, configure the following environment variables in your deployment platform (e.g., Vercel):
- `AUTH_MODE=simple`
- `MVP_ACCESS_CODE=your-secure-passphrase`
- `MVP_DEFAULT_ROLE=operator` (or `admin`, depending on what access level the testers need)

## 5. Security limitations
- **Single Shared Secret**: All users logging in via simple mode share the same access code. There is no granular user identity.
- **No Individual Auditing**: Because identity is shared, action logs will show operations performed by a generic "MVP Internal User", making accountability difficult.
- **Session Lifespan**: Sessions are managed via simple HTTP-only cookies which last for 1 week. Revoking access requires changing the `MVP_ACCESS_CODE`, which invalidates future logins but does not immediately kill active sessions unless the server clears cookies.

## 6. How to change access code
1. Go to your deployment platform (Vercel) dashboard.
2. Navigate to Settings > Environment Variables.
3. Update the value of `MVP_ACCESS_CODE` to a new secure phrase.
4. Redeploy the application to ensure the new environment variable takes effect.
5. Distribute the new code securely to authorized MVP participants.

## 7. How to return to Microsoft Auth
To switch back to the secure, production-ready Microsoft Authentication:
1. Update your deployment environment variables:
   - Change `AUTH_MODE` to `microsoft`.
2. Redeploy the application.
3. The login page will automatically revert to showing the "Login with Microsoft" button.

## 8. MVP user instructions
1. Navigate to the application URL.
2. The login page will display "กรอกรหัสเข้าใช้งานภายใน" (Enter Internal Access Code).
3. Enter the shared `MVP_ACCESS_CODE` provided by the admin.
4. Click "เข้าสู่ระบบ" (Login).
5. You will be redirected to the dashboard with the assigned MVP role.
6. Click "ออกจากระบบ" (Logout) when finished to secure your session.

## 9. Admin/operator checklist
- [ ] Confirm `AUTH_MODE=simple` is set in Vercel.
- [ ] Ensure `MVP_ACCESS_CODE` is a strong, unpredictable phrase.
- [ ] **NEVER** commit `MVP_ACCESS_CODE` to the Git repository.
- [ ] Set `MVP_DEFAULT_ROLE` appropriately (e.g., `operator`).
- [ ] Verify that sensitive APIs are still protected and reject unauthorized access.
- [ ] Document who has been given the access code.
- [ ] Plan the timeline for switching back to `AUTH_MODE=microsoft` before full production launch.
