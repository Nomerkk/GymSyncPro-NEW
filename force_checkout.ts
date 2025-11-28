
import { db } from "./server/database";
import { checkIns, users } from "./shared/schema";
import { eq, and } from "drizzle-orm";

async function run() {
    const username = "rayyanz"; // Change this if needed
    console.log(`Checking out user: ${username}...`);

    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) {
        console.log("User not found");
        process.exit(1);
    }

    const result = await db
        .update(checkIns)
        .set({
            checkOutTime: new Date(),
            status: "completed"
        })
        .where(and(eq(checkIns.userId, user.id), eq(checkIns.status, "active")))
        .returning();

    console.log(`Checked out ${result.length} sessions.`);
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
