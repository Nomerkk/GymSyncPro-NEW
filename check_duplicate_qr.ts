import { db } from "./server/database";
import { users } from "./shared/schema";
import { eq, count, groupBy } from "drizzle-orm";

async function run() {
    console.log("Checking for duplicate QR codes...");

    const allUsers = await db.select().from(users);
    const qrMap = new Map<string, string[]>();

    for (const user of allUsers) {
        if (user.permanentQrCode) {
            if (!qrMap.has(user.permanentQrCode)) {
                qrMap.set(user.permanentQrCode, []);
            }
            qrMap.get(user.permanentQrCode)?.push(`${user.username} (${user.id})`);
        }
    }

    let foundDuplicates = false;
    for (const [qr, usersList] of qrMap.entries()) {
        if (usersList.length > 1) {
            console.log(`Duplicate QR Code found: ${qr}`);
            console.log(`  Users: ${usersList.join(', ')}`);
            foundDuplicates = true;
        }
    }

    if (!foundDuplicates) {
        console.log("No duplicate QR codes found.");
    }

    process.exit(0);
}

run().catch(console.error);
