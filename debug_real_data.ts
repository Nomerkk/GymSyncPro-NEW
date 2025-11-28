
import { storage } from "./server/storage";
import { db } from "./server/database";
import { sql } from "drizzle-orm";

async function run() {
    console.log("Debugging real data...");

    // 1. Get DB time
    const resultTime = await db.execute(sql`SELECT NOW() as db_time`);
    // Handle different driver return types
    const dbTime = Array.isArray(resultTime) ? resultTime[0]?.db_time : resultTime.rows?.[0]?.db_time;
    console.log("DB Time:", dbTime);

    // 2. Get users with memberships using the function
    const result = await storage.getUsersWithMemberships(100, 0); // Get first 100

    console.log(`Found ${result.data.length} users.`);

    // 3. Filter for users who have a membership
    const usersWithMembership = result.data.filter(u => u.membership);
    console.log(`Users with active membership in API result: ${usersWithMembership.length}`);

    usersWithMembership.forEach(u => {
        const m = u.membership!;
        console.log(`User: ${u.username}, EndDate: ${m.endDate}, Status: ${m.status}`);

        const endDate = new Date(m.endDate);
        const now = new Date();

        if (endDate <= now) {
            console.log("  WARNING: This membership is expired by JS time but was returned by SQL query!");
            console.log("  Diff (ms):", endDate.getTime() - now.getTime());
        } else {
            console.log("  Valid (future date).");
        }
    });

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
