
import { db } from "./server/database";
import { users } from "./shared/schema";
import { sql } from "drizzle-orm";

async function run() {
    console.log("Checking for duplicate QR codes...");

    const duplicates = await db.execute(sql`
    SELECT permanent_qr_code, COUNT(*)
    FROM users
    WHERE permanent_qr_code IS NOT NULL
    GROUP BY permanent_qr_code
    HAVING COUNT(*) > 1
  `);

    console.log(`Duplicate QR codes found: ${duplicates.length}`);

    if (duplicates.length > 0) {
        console.log(duplicates);
    }

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
