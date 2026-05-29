import "dotenv/config";
import pg from "pg";
const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Confirm the user's email directly in auth.users
  const result = await client.query(
    `UPDATE auth.users SET email_confirmed_at = now() WHERE email = $1 AND email_confirmed_at IS NULL`,
    ["testuser@gmail.com"],
  );

  if (result.rowCount > 0) {
    console.log("Email confirmed successfully!");
  } else {
    console.log("User not found or already confirmed");
  }

  // Verify
  const verify = await client.query(
    "SELECT id, email, email_confirmed_at FROM auth.users WHERE email = $1",
    ["testuser@gmail.com"],
  );
  const u = verify.rows[0];
  console.log(`ID: ${u.id}`);
  console.log(`Email: ${u.email}`);
  console.log(`Confirmed: ${u.email_confirmed_at ? "YES" : "NO"}`);

  await client.end();
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
