
import { db } from "./server/database";
import { memberships, users } from "./shared/schema";
import { eq, and, lt, sql } from "drizzle-orm";

async function run() {
    console.log("Searching for expired but active memberships...");

    // Find memberships where status='active' AND endDate < NOW()
    const expiredActive = await db
        .select({
            id: memberships.id,
            userId: memberships.userId,
            username: users.username,
            endDate: memberships.endDate,
            status: memberships.status
        })
        .from(memberships)
        .leftJoin(users, eq(memberships.userId, users.id))
        .where(
            and(
                eq(memberships.status, "active"),
                sql`${memberships.endDate} <= NOW()`
            )
        );

    console.log(`Found ${expiredActive.length} expired but active memberships.`);

    expiredActive.forEach(m => {
        console.log(`User: ${m.username}, EndDate: ${m.endDate}, Status: ${m.status}`);
    });

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
