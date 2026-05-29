import "dotenv/config";
import pg from "pg";
const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const result = await client.query(
    "SELECT id, email, email_confirmed_at, created_at FROM auth.users WHERE email LIKE $1",
    ["%test%"],
  );
  for (const u of result.rows) {
    console.log(`ID: ${u.id}`);
    console.log(`Email: ${u.email}`);
    console.log(`Confirmed: ${u.email_confirmed_at ? "YES" : "NO"}`);
    console.log(`Created: ${u.created_at}`);
  }
  console.log(`Total users found: ${result.rows.length}`);
  await client.end();
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
