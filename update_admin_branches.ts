
import { db } from "./server/database";
import { users } from "./shared/schema";
import { eq, isNull } from "drizzle-orm";

async function run() {
    console.log("Updating admin branches...");

    const result = await db
        .update(users)
        .set({ homeBranch: 'Jakarta Pusat' })
        .where(
            // Update admins with null homeBranch
            // Note: In Drizzle, checking for null might need specific syntax depending on driver, 
            // but let's try standard where clause first or fetch and update.
            eq(users.role, 'admin')
        )
        .returning();

    // Filter for those who had null branch if needed, but setting all to a default if null is safer done by iterating or specific query.
    // Since we only have a few admins, let's just update 'bambang' specifically or all nulls.

    // Let's do a more targeted update for safety
    const admins = await db.select().from(users).where(eq(users.role, 'admin'));

    for (const admin of admins) {
        if (!admin.homeBranch) {
            console.log(`Updating admin ${admin.username} to Jakarta Pusat`);
            await db.update(users)
                .set({ homeBranch: 'Jakarta Pusat' })
                .where(eq(users.id, admin.id));
        }
    }

    console.log("Admin branches updated.");
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
