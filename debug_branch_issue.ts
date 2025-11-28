import { db } from "./server/database";
import { checkIns, users } from "./shared/schema";
import { desc, eq } from "drizzle-orm";

async function run() {
    console.log("=== DEBUGGING CHECK-IN BRANCH ISSUE ===\n");

    // Check latest check-ins
    console.log("Latest 3 Check-ins:");
    const latestCheckIns = await db
        .select({
            id: checkIns.id,
            userId: checkIns.userId,
            username: users.username,
            checkInTime: checkIns.checkInTime,
            branch: checkIns.branch,
            status: checkIns.status
        })
        .from(checkIns)
        .leftJoin(users, eq(checkIns.userId, users.id))
        .orderBy(desc(checkIns.checkInTime))
        .limit(3);

    latestCheckIns.forEach((c: any) => {
        console.log(`  User: ${c.username}, Branch: ${c.branch || 'NULL'}, Status: ${c.status}, Time: ${c.checkInTime}`);
    });

    // Check admin users
    console.log("\nAdmin Users:");
    const admins = await db.select().from(users).where(eq(users.role, 'admin'));
    admins.forEach((a: any) => {
        console.log(`  Admin: ${a.username}, Home Branch: ${a.homeBranch || 'NULL'}`);
    });

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
