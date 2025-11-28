import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function renameBranch() {
    try {
        console.log("Starting branch rename migration: Jakarta -> Jakarta Barat");

        // Update users
        const usersResult = await db.execute(
            sql`UPDATE users SET home_branch = 'Jakarta Barat' WHERE home_branch = 'Jakarta'`
        );
        console.log(`Updated users: ${usersResult.rowCount}`);

        // Update gym_classes
        const classesResult = await db.execute(
            sql`UPDATE gym_classes SET branch = 'Jakarta Barat' WHERE branch = 'Jakarta'`
        );
        console.log(`Updated gym_classes: ${classesResult.rowCount}`);

        // Update check_ins
        const checkInsResult = await db.execute(
            sql`UPDATE check_ins SET branch = 'Jakarta Barat' WHERE branch = 'Jakarta'`
        );
        console.log(`Updated check_ins: ${checkInsResult.rowCount}`);

        // Update personal_trainers
        const trainersResult = await db.execute(
            sql`UPDATE personal_trainers SET branch = 'Jakarta Barat' WHERE branch = 'Jakarta'`
        );
        console.log(`Updated personal_trainers: ${trainersResult.rowCount}`);

        console.log("Migration completed successfully");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

renameBranch();
