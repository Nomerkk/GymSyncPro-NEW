import { db } from "./server/database";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function run() {
    console.log("Running migration: make_email_optional.sql");

    const migrationPath = path.join(process.cwd(), "migrations", "make_email_optional.sql");
    const migrationSql = fs.readFileSync(migrationPath, "utf-8");

    try {
        await db.execute(sql.raw(migrationSql));
        console.log("Migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }

    process.exit(0);
}

run().catch(console.error);
