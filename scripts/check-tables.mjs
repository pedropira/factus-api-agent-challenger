import "dotenv/config";
import pg from "pg";
const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Check all public tables
  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
  );
  console.log("=== PUBLIC TABLES ===");
  console.log(tables.rows.map(r => r.table_name).join("\n"));

  // Check customers and products
  for (const table of ["customers", "products"]) {
    const count = await client.query(`SELECT COUNT(*)::int as cnt FROM "${table}"`);
    console.log(`\n${table}: ${count.rows[0].cnt} rows`);
    if (count.rows[0].cnt > 0) {
      const sample = await client.query(`SELECT * FROM "${table}" LIMIT 3`);
      console.log("  Sample:", JSON.stringify(sample.rows));
    }
  }

  await client.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
