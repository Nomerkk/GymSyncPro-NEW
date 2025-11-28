import { db } from "./server/database/index";
import { auditLogs, users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function testAuditLog() {
    try {
        console.log("Testing audit log creation...");

        // Get a test user (admin)
        const [admin] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);

        if (!admin) {
            console.log("No admin user found. Creating test admin...");
            return;
        }

        console.log("Found admin:", { id: admin.id, username: admin.username, homeBranch: admin.homeBranch });

        // Try to create an audit log
        const testLog = {
            userId: admin.id,
            action: 'TEST_ACTION',
            entityId: 'test-entity-id',
            entityType: 'test',
            details: { test: 'data' },
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
            branch: admin.homeBranch || 'test-branch',
        };

        console.log("Creating audit log with data:", testLog);

        const [created] = await db.insert(auditLogs).values(testLog).returning();

        console.log("✅ Audit log created successfully:", created);

        // Verify it was saved
        const [saved] = await db.select().from(auditLogs).where(eq(auditLogs.id, created.id));
        console.log("✅ Verified audit log in database:", saved);

        // Clean up
        await db.delete(auditLogs).where(eq(auditLogs.id, created.id));
        console.log("✅ Test audit log deleted");

    } catch (error) {
        console.error("❌ Error testing audit log:", error);
    } finally {
        process.exit(0);
    }
}

testAuditLog();
