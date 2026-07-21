console.log("DATABASE_URL:", process.env.DATABASE_URL ? "YES" : "NO");
if (process.env.DATABASE_URL) {
  try {
    const u = new URL(process.env.DATABASE_URL);
    console.log("DB Host:", u.host);
    console.log("DB Port:", u.port);
    console.log("DB User includes pooler?", u.username.includes('pooler'));
    console.log("DB Query includes pgbouncer?", u.searchParams.has('pgbouncer'));
  } catch (e) {
    console.log("Invalid URL");
  }
}

console.log("DIRECT_URL:", process.env.DIRECT_URL ? "YES" : "NO");
if (process.env.DIRECT_URL) {
  try {
    const u = new URL(process.env.DIRECT_URL);
    console.log("DIR Host:", u.host);
    console.log("DIR Port:", u.port);
  } catch (e) {
    console.log("Invalid URL");
  }
}
