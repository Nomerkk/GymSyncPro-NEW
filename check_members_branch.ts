import { db } from "./server/database/index";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function checkMembersBranch() {
    try {
        console.log("Checking members and their branches...\n");

        const members = await db.select({
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role,
            homeBranch: users.homeBranch,
        }).from(users).where(eq(users.role, 'member'));

        console.log(`Total members: ${members.length}\n`);

        const branchCount: Record<string, number> = {};

        members.forEach(member => {
            const branch = member.homeBranch || 'NULL';
            branchCount[branch] = (branchCount[branch] || 0) + 1;
            console.log(`- ${member.username} (${member.firstName} ${member.lastName}): ${member.homeBranch || 'NO BRANCH'}`);
        });

        console.log(`\nBranch breakdown:`);
        Object.entries(branchCount).forEach(([branch, count]) => {
            console.log(`- ${branch}: ${count} members`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit(0);
    }
}

checkMembersBranch();
