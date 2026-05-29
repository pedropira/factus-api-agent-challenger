import "dotenv/config";
import pg from "pg";
const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  for (const table of ["customers", "products"]) {
    const cols = await client.query(
      "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position",
      [table]
    );
    console.log(`\n=== ${table} ===`);
    cols.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type}) nullable=${c.is_nullable}`));
  }

  await client.end();
}
main().catch(e => console.error(e.message));
