
import { db } from "./server/database";
import { checkIns, users } from "./shared/schema";
import { desc, eq } from "drizzle-orm";

async function run() {
    console.log("Checking latest check-ins...");

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
        .limit(5);

    console.log("Latest 5 Check-ins:");
    latestCheckIns.forEach((c: any) => {
        console.log(`User: ${c.username}, Time: ${c.checkInTime}, Branch: ${c.branch}, Status: ${c.status}`);
    });

    console.log("\nChecking Admin Users:");
    const admins = await db.select().from(users).where(eq(users.role, 'admin'));
    admins.forEach((a: any) => {
        console.log(`Admin: ${a.username}, Home Branch: ${a.homeBranch}`);
    });

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
