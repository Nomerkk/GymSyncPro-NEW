import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function checkBranches() {
    try {
        const users = await db.execute(sql`SELECT DISTINCT home_branch FROM users`);
        console.log("User Branches:", users.rows);

        const classes = await db.execute(sql`SELECT DISTINCT branch FROM gym_classes`);
        console.log("Class Branches:", classes.rows);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkBranches();
