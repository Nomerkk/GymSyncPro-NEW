import { db } from "./server/database";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function verifySetup() {
    console.log("🔍 Verifying Super Admin Setup...\n");

    // 1. Check if bigmo exists and is super_admin
    const [bigmo] = await db.select().from(users).where(eq(users.username, "bigmo"));

    if (!bigmo) {
        console.log("❌ User 'bigmo' not found!");
        process.exit(1);
    }

    console.log("✓ User 'bigmo' found");
    console.log("  - Role:", bigmo.role);
    console.log("  - Email Verified:", bigmo.emailVerified);
    console.log("  - Active:", bigmo.active);
    console.log("  - Home Branch:", bigmo.homeBranch);

    // Verify role
    if (bigmo.role !== 'super_admin') {
        console.log("\n❌ User 'bigmo' is not a super_admin!");
        console.log("   Current role:", bigmo.role);
        process.exit(1);
    }

    // Verify email verified
    if (!bigmo.emailVerified) {
        console.log("\n❌ Email not verified for 'bigmo'!");
        process.exit(1);
    }

    // Verify active
    if (!bigmo.active) {
        console.log("\n❌ User 'bigmo' is not active!");
        process.exit(1);
    }

    console.log("\n✅ All checks passed!");
    console.log("\n📋 Summary:");
    console.log("   - Super Admin user 'bigmo' is properly configured");
    console.log("   - Email verification is set to true");
    console.log("   - User is active");
    console.log("\n🎉 You can now login as Super Admin with username 'bigmo'");

    process.exit(0);
}

verifySetup().catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
});
