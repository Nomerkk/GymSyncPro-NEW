import { db } from "./server/database";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "./server/storage";

async function run() {
    console.log("Testing QR Code Integrity...");

    // Get 2 random users
    const allUsers = await db.select().from(users).limit(2);
    if (allUsers.length < 2) {
        console.log("Not enough users to test.");
        process.exit(0);
    }

    const userA = allUsers[0];
    const userB = allUsers[1];

    console.log(`User A: ${userA.username} (${userA.id})`);
    console.log(`User B: ${userB.username} (${userB.id})`);

    // Ensure they have QR codes
    const qrA = await storage.ensureUserPermanentQrCode(userA.id);
    const qrB = await storage.ensureUserPermanentQrCode(userB.id);

    console.log(`QR A: ${qrA}`);
    console.log(`QR B: ${qrB}`);

    if (qrA === qrB) {
        console.error("CRITICAL: QR Codes are identical!");
        process.exit(1);
    }

    // Validate QR A
    const foundA = await storage.getUserByPermanentQrCode(qrA);
    console.log(`Lookup QR A -> Found: ${foundA?.username} (${foundA?.id})`);

    if (foundA?.id !== userA.id) {
        console.error("CRITICAL: Lookup for QR A returned wrong user!");
    } else {
        console.log("✓ QR A lookup correct");
    }

    // Validate QR B
    const foundB = await storage.getUserByPermanentQrCode(qrB);
    console.log(`Lookup QR B -> Found: ${foundB?.username} (${foundB?.id})`);

    if (foundB?.id !== userB.id) {
        console.error("CRITICAL: Lookup for QR B returned wrong user!");
    } else {
        console.log("✓ QR B lookup correct");
    }

    process.exit(0);
}

run().catch(console.error);
