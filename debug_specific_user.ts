
import { storage } from "./server/storage";

async function run() {
    console.log("Debugging specific user 'nomerk'...");

    const result = await storage.getUsersWithMemberships(10, 0, "nomerk");

    const user = result.data.find(u => u.username === "nomerk");

    if (user) {
        console.log(`User found: ${user.username}`);
        if (user.membership) {
            console.log("FAIL: Membership is present (should be undefined).");
            console.log("Membership details:", user.membership);
        } else {
            console.log("SUCCESS: Membership is undefined.");
        }
    } else {
        console.log("User 'nomerk' not found.");
    }

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
