import { db } from "./server/database";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function run() {
    console.log("Updating admin branches to correct values...");

    // Update specific admins to their correct branches
    const updates = [
        { username: 'bigmo', branch: 'Cikarang' },
        { username: 'admin_cik_1764143124339', branch: 'Cikarang' },
        // Add more if needed
    ];

    for (const update of updates) {
        const result = await db
            .update(users)
            .set({ homeBranch: update.branch })
            .where(eq(users.username, update.username))
            .returning();

        if (result.length > 0) {
            console.log(`✓ Updated ${update.username} to branch: ${update.branch}`);
        } else {
            console.log(`✗ User ${update.username} not found`);
        }
    }

    console.log("\nCurrent admin branches:");
    const admins = await db.select().from(users).where(eq(users.role, 'admin'));
    admins.forEach((a: any) => {
        console.log(`  ${a.username}: ${a.homeBranch}`);
    });

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
