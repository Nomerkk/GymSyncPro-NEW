
import { storage } from "./server/storage";

async function run() {
    console.log("Checking memberships...");

    // Get all memberships
    const allUsers = await storage.getUsersWithMemberships(100, 0);

    console.log(`Total users: ${allUsers.data.length}`);

    allUsers.data.forEach(user => {
        if (user.membership) {
            console.log(`User: ${user.username}, Plan: ${user.membership.plan?.name}, Status: ${user.membership.status}, EndDate: ${user.membership.endDate}`);
        } else {
            console.log(`User: ${user.username}, No membership`);
        }
    });

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
