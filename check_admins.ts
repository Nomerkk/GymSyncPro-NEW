
import { storage } from "./server/storage";
import { db } from "./server/database";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function run() {
    console.log("Checking admin users...");

    const admins = await db.select().from(users).where(eq(users.role, 'admin'));

    console.log(`Total admins: ${admins.length}`);

    admins.forEach((admin: any) => {
        console.log(`Admin: ${admin.username}, Home Branch: ${admin.homeBranch || 'NULL'}`);
    });

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
