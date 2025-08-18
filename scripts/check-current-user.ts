import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkCurrentUserAccess() {
  console.log("🔍 Checking all user access levels...");

  try {
    const users = await prisma.user.findMany({
      include: {
        primaryRole: true,
        userRoles: {
          where: { isActive: true },
          include: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (users.length === 0) {
      console.log("📭 No users found in database");
      return;
    }

    console.log(`\n👥 Found ${users.length} user(s):\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Primary Role: ${user.primaryRole?.displayName || "No role"}`);

      if (user.primaryRole?.permissions) {
        const permissions = user.primaryRole.permissions as string[];
        console.log(`   Permissions: ${permissions.length > 0 ? permissions.join(", ") : "None"}`);
      }

      // Check if user can manage users
      let canManageUsers = false;
      if (user.primaryRole?.name === "ADMIN") {
        canManageUsers = true;
      } else if (user.primaryRole?.permissions) {
        const permissions = user.primaryRole.permissions as string[];
        canManageUsers = permissions.includes("users.manage") || permissions.includes("*");
      }

      console.log(`   Can Access User Management: ${canManageUsers ? "✅ YES" : "❌ NO"}`);
      console.log(`   Kinde ID: ${user.kindeId}`);
      console.log("");
    });

    // Check roles
    console.log("📋 Available Roles:");
    const roles = await prisma.role.findMany({
      orderBy: { priority: "desc" },
    });

    roles.forEach((role) => {
      const permissions = role.permissions as string[];
      console.log(`   • ${role.displayName} (${role.name})`);
      console.log(`     Priority: ${role.priority}, System: ${role.isSystem}`);
      console.log(`     Permissions: ${permissions.join(", ")}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error checking users:", error);
  }
}

async function main() {
  try {
    await checkCurrentUserAccess();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
