import { db } from "./server/database";
import { sql } from "drizzle-orm";

async function run() {
    console.log("Running migration to add branch columns...");

    try {
        // Add branch column to gym_classes
        console.log("Adding branch column to gym_classes...");
        await db.execute(sql`ALTER TABLE gym_classes ADD COLUMN IF NOT EXISTS branch VARCHAR`);

        // Add branch column to personal_trainers
        console.log("Adding branch column to personal_trainers...");
        await db.execute(sql`ALTER TABLE personal_trainers ADD COLUMN IF NOT EXISTS branch VARCHAR`);

        // Update existing gym_classes
        console.log("Updating existing gym_classes...");
        await db.execute(sql`UPDATE gym_classes SET branch = 'Jakarta Pusat' WHERE branch IS NULL`);

        // Update existing personal_trainers
        console.log("Updating existing personal_trainers...");
        await db.execute(sql`UPDATE personal_trainers SET branch = 'Jakarta Pusat' WHERE branch IS NULL`);

        // Create indexes
        console.log("Creating indexes...");
        await db.execute(sql`CREATE INDEX IF NOT EXISTS IDX_gym_classes_branch ON gym_classes(branch)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS IDX_personal_trainers_branch ON personal_trainers(branch)`);

        console.log("Migration completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
