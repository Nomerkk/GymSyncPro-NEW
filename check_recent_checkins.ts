
import { storage } from "./server/storage";

async function run() {
    console.log("Checking recent check-ins...");

    // Get recent check-ins
    const checkIns = await storage.getRecentCheckIns(10);

    console.log(`Total recent check-ins: ${checkIns.length}`);

    checkIns.forEach(ci => {
        console.log(`User: ${ci.user?.username}, Time: ${ci.checkInTime}, Branch: ${ci.branch || 'N/A'}`);
    });

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
