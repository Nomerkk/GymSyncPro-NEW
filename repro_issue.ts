
import { storage } from "./server/storage";
import { db } from "./server/database";
import { users, memberships, membershipPlans } from "./shared/schema";
import { eq } from "drizzle-orm";

async function run() {
    console.log("Starting reproduction script...");

    // 1. Create a test user
    const username = `test_user_${Date.now()}`;
    const user = await storage.createUser({
        username,
        password: "password",
        email: `${username}@example.com`,
        firstName: "Test",
        lastName: "User",
        role: "member",
    });
    console.log(`Created user: ${user.id}`);

    // 2. Create a plan
    const [plan] = await db.insert(membershipPlans).values({
        name: "Test Plan",
        price: "100000",
        durationMonths: 1,
        description: "Test",
    }).returning();
    console.log(`Created plan: ${plan.id}`);

    // 3. Create an EXPIRED membership (status active, but date in past)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10); // 10 days ago

    await db.insert(memberships).values({
        userId: user.id,
        planId: plan.id,
        startDate: new Date(pastDate.getTime() - 30 * 24 * 60 * 60 * 1000), // Started 40 days ago
        endDate: pastDate, // Ended 10 days ago
        status: "active", // Still marked active in DB
    });
    console.log("Created expired membership with status 'active'");

    // 4. Query getUsersWithMemberships
    console.log("Querying getUsersWithMemberships...");
    const result = await storage.getUsersWithMemberships(10, 0, username);

    const member = result.data.find(u => u.id === user.id);

    if (member) {
        console.log("Member found.");
        if (member.membership) {
            console.log("FAIL: Membership is present (should be undefined/null because it is expired).");
            console.log("Membership details:", member.membership);
        } else {
            console.log("SUCCESS: Membership is undefined (correctly filtered out).");
        }
    } else {
        console.log("Error: Member not found in result.");
    }

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
