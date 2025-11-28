
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Adding branch column to audit_logs table...");

    try {
        await db.execute(sql`
      ALTER TABLE audit_logs 
      ADD COLUMN IF NOT EXISTS branch varchar(255);
    `);
        console.log("Successfully added branch column to audit_logs table");
    } catch (error) {
        console.error("Error adding branch column:", error);
    }

    process.exit(0);
}

main();
