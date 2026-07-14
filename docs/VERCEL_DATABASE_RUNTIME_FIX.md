# Vercel Database Runtime Connection Fix

The application may return a database connection error during runtime (or build SSG phases) with the message:
`tenant/user postgres.<PROJECT_REF> not found`

This indicates that the Supabase transaction pooler `DATABASE_URL` provided to Vercel is malformed, uses an outdated project reference, or contains the wrong username.

To fix this issue on Vercel, follow these exact steps:

## 1. Retrieve the Correct DATABASE_URL

1. Log into the **Supabase Dashboard**.
2. Select the correct active project.
3. Go to **Project Settings** -> **Database** (or click the **Connect** button at the top).
4. Select the **Transaction Pooler** (IPv4) connection string.
5. Choose **Prisma** from the connection string format options.
6. The connection string should look similar to this:
   `postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`

## 2. Verify Connection String Components

Before saving the environment variable, explicitly verify the following components:

- **Username**: Ensure the username is `postgres.[PROJECT_REF]`. It must perfectly match the project reference ID of the active Supabase project. (The error `tenant/user not found` occurs when this is mismatched).
- **Host / Region**: Ensure the host (`aws-0-[REGION].pooler.supabase.com`) is copied exactly from the Supabase dashboard and not typed manually or guessed.
- **Port**: Ensure the port is `6543` for the transaction pooler.
- **Parameters**: Ensure `?pgbouncer=true` is appended to the end of the URL.

## 3. Update Vercel Environment Variables

1. Go to your **Vercel Project Dashboard**.
2. Navigate to **Settings** -> **Environment Variables**.
3. Update the `DATABASE_URL` variable with the verified connection string.
4. **Use DIRECT_URL for migrations:** If you are running Prisma migrations from Vercel during the build phase or CI/CD, ensure you also define the `DIRECT_URL` variable. This should point to the Session connection string (port `5432`).
5. Ensure `AUTH_MODE=none` is set if you are operating the MVP bypass mode.
6. Redeploy the application.

## Warning
Never commit `DATABASE_URL` or `DIRECT_URL` to source control. They should only be configured directly in Vercel or your local `.env` file.
