import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to create user with default role and active status (same as in API)
async function createUserWithDefaults(kindeUser: any) {
  // Get default USER role
  const defaultRole = await prisma.role.findUnique({
    where: { name: "USER" },
  });

  return await prisma.user.create({
    data: {
      kindeId: kindeUser.id,
      email: kindeUser.email || "",
      name: kindeUser.given_name || kindeUser.family_name || kindeUser.email || "User",
      firstName: kindeUser.given_name || "",
      lastName: kindeUser.family_name || "",
      status: "ACTIVE", // Set to ACTIVE by default
      primaryRoleId: defaultRole?.id, // Assign default USER role
    },
  });
}

async function testUserCreation() {
  console.log("🧪 Testing user creation with defaults...");

  // Mock Kinde user data
  const mockKindeUser = {
    id: "test_user_" + Date.now(),
    email: "test@example.com",
    given_name: "Test",
    family_name: "User",
  };

  try {
    // Check if default role exists
    const defaultRole = await prisma.role.findUnique({
      where: { name: "USER" },
    });

    if (!defaultRole) {
      console.error("❌ Default USER role not found. Please run seed-roles.ts first");
      return;
    }

    console.log(`✅ Found default USER role: ${defaultRole.displayName}`);

    // Create test user
    const user = await createUserWithDefaults(mockKindeUser);

    console.log(`✅ Created user successfully:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Role ID: ${user.primaryRoleId}`);

    // Verify the user has the correct defaults
    const userWithRole = await prisma.user.findUnique({
      where: { id: user.id },
      include: { primaryRole: true },
    });

    if (userWithRole) {
      console.log(`✅ Verification successful:`);
      console.log(`   Status is ACTIVE: ${userWithRole.status === "ACTIVE"}`);
      console.log(`   Has USER role: ${userWithRole.primaryRole?.name === "USER"}`);
      console.log(`   Role display name: ${userWithRole.primaryRole?.displayName}`);
    }

    // Clean up test user
    await prisma.user.delete({
      where: { id: user.id },
    });
    console.log(`🗑️  Cleaned up test user`);
  } catch (error) {
    console.error("❌ Error testing user creation:", error);
  }
}

async function main() {
  try {
    await testUserCreation();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
