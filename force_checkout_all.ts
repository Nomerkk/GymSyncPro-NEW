
import { db } from "./server/database";
import { checkIns } from "./shared/schema";
import { eq } from "drizzle-orm";

async function run() {
    console.log("Forcing checkout for all active sessions...");

    const result = await db
        .update(checkIns)
        .set({
            checkOutTime: new Date(),
            status: "completed"
        })
        .where(eq(checkIns.status, "active"))
        .returning();

    console.log(`Checked out ${result.length} active sessions.`);
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
