import { db } from "./server/database";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function run() {
    const username = process.argv[2];

    if (!username) {
        console.error("Usage: npx tsx create_super_admin.ts <username>");
        console.error("Example: npx tsx create_super_admin.ts bigmo");
        process.exit(1);
    }

    console.log(`Promoting user "${username}" to Super Admin...`);

    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

    if (!user) {
        console.error(`User "${username}" not found.`);
        process.exit(1);
    }

    await db
        .update(users)
        .set({ role: 'super_admin' })
        .where(eq(users.id, user.id));

    console.log(`✓ User "${username}" is now a Super Admin!`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);

    process.exit(0);
}

run().catch(console.error);
