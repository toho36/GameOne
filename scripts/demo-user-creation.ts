import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createDemoUser() {
  console.log("👤 Creating demo user with new defaults...");

  // Simulate what happens when a new user logs in via Kinde
  const mockKindeUser = {
    id: "kp_demo123456789", // Mock Kinde ID
    email: "demo.user@example.com",
    given_name: "Demo",
    family_name: "User",
  };

  try {
    // Check if user already exists
    let dbUser = await prisma.user.findUnique({
      where: { kindeId: mockKindeUser.id },
      include: { primaryRole: true },
    });

    if (dbUser) {
      console.log("👤 User already exists:");
      console.log(`   Email: ${dbUser.email}`);
      console.log(`   Status: ${dbUser.status}`);
      console.log(`   Role: ${dbUser.primaryRole?.displayName || "No role"}`);
      return;
    }

    // Get default USER role
    const defaultRole = await prisma.role.findUnique({
      where: { name: "USER" },
    });

    if (!defaultRole) {
      console.error("❌ Default USER role not found. Please run seed-roles.ts first");
      return;
    }

    // Create user with defaults (same logic as API)
    dbUser = await prisma.user.create({
      data: {
        kindeId: mockKindeUser.id,
        email: mockKindeUser.email || "",
        name:
          mockKindeUser.given_name || mockKindeUser.family_name || mockKindeUser.email || "User",
        firstName: mockKindeUser.given_name || "",
        lastName: mockKindeUser.family_name || "",
        status: "ACTIVE", // Set to ACTIVE by default
        primaryRoleId: defaultRole.id, // Assign default USER role
      },
      include: { primaryRole: true },
    });

    console.log("✅ Demo user created successfully:");
    console.log(`   Email: ${dbUser.email}`);
    console.log(`   Name: ${dbUser.name}`);
    console.log(`   Status: ${dbUser.status} ✅`);
    console.log(`   Role: ${dbUser.primaryRole?.displayName} ✅`);
    console.log(`   Kinde ID: ${dbUser.kindeId}`);
    console.log(`   Created: ${dbUser.createdAt.toISOString()}`);

    console.log("\n🎉 New users will now automatically get:");
    console.log("   • ACTIVE status (no verification needed)");
    console.log("   • USER role with basic permissions");
    console.log("   • Ready to use the application immediately");
  } catch (error) {
    console.error("❌ Error creating demo user:", error);
  }
}

async function main() {
  try {
    await createDemoUser();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
