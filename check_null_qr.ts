import { db } from "./server/database";
import { users } from "./shared/schema";
import { eq, isNull, or } from "drizzle-orm";

async function run() {
    console.log("Checking for NULL or EMPTY QR codes...");

    const usersWithNullQr = await db.select().from(users).where(isNull(users.permanentQrCode));
    const usersWithEmptyQr = await db.select().from(users).where(eq(users.permanentQrCode, ""));

    console.log(`Users with NULL QR: ${usersWithNullQr.length}`);
    if (usersWithNullQr.length > 0) {
        console.log(`  Sample: ${usersWithNullQr[0].username}`);
    }

    console.log(`Users with EMPTY QR: ${usersWithEmptyQr.length}`);
    if (usersWithEmptyQr.length > 0) {
        console.log(`  Sample: ${usersWithEmptyQr[0].username}`);
    }

    process.exit(0);
}

run().catch(console.error);
