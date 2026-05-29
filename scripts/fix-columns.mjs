import "dotenv/config";
import pg from "pg";
const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Add missing created_at columns
  for (const table of ["customers", "products"]) {
    const hasCol = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'created_at'",
      [table]
    );

    if (hasCol.rows.length === 0) {
      await client.query(`ALTER TABLE "${table}" ADD COLUMN created_at timestamptz DEFAULT now()`);
      console.log(`Added created_at to ${table}`);
    } else {
      console.log(`${table} already has created_at`);
    }
  }

  // Verify
  for (const table of ["customers", "products"]) {
    const cols = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position",
      [table]
    );
    console.log(`\n${table}: ${cols.rows.map(c => c.column_name).join(", ")}`);
  }

  await client.end();
}
main().catch(e => console.error(e.message));
