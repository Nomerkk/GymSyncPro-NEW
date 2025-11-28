import { db } from "./server/database/index";
import { users } from "./shared/schema";
import { eq, sql } from "drizzle-orm";

async function checkMembersRole() {
    try {
        console.log("Checking all users and their roles...\n");

        const allUsers = await db.select({
            id: users.id,
            username: users.username,
            role: users.role,
            firstName: users.firstName,
            lastName: users.lastName,
        }).from(users);

        console.log(`Total users in database: ${allUsers.length}\n`);

        const roleCount = {
            member: 0,
            admin: 0,
            super_admin: 0,
            other: 0
        };

        allUsers.forEach(user => {
            console.log(`- ${user.username} (${user.firstName} ${user.lastName}): ${user.role}`);

            if (user.role === 'member') roleCount.member++;
            else if (user.role === 'admin') roleCount.admin++;
            else if (user.role === 'super_admin') roleCount.super_admin++;
            else roleCount.other++;
        });

        console.log(`\nRole breakdown:`);
        console.log(`- Members: ${roleCount.member}`);
        console.log(`- Admins: ${roleCount.admin}`);
        console.log(`- Super Admins: ${roleCount.super_admin}`);
        console.log(`- Other: ${roleCount.other}`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit(0);
    }
}

checkMembersRole();
