import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function promoteUserToAdmin() {
  console.log("🔧 Promoting user to admin...");

  // You can change this to the email of the user you're currently logged in as
  const userEmail = "toho0036@gmail.com"; // Update this to your current email

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { primaryRole: true },
    });

    if (!user) {
      console.error(`❌ User with email ${userEmail} not found`);
      console.log("Available users:");
      const allUsers = await prisma.user.findMany();
      allUsers.forEach((u) => console.log(`   - ${u.email}`));
      return;
    }

    console.log(`📧 Found user: ${user.email}`);
    console.log(`📛 Current role: ${user.primaryRole?.displayName || "No role"}`);

    // Find the ADMIN role
    const adminRole = await prisma.role.findUnique({
      where: { name: "ADMIN" },
    });

    if (!adminRole) {
      console.error("❌ ADMIN role not found. Please run seed-roles.ts first");
      return;
    }

    if (user.primaryRoleId === adminRole.id) {
      console.log("✅ User is already an admin!");
      return;
    }

    // Update user to have ADMIN role
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        primaryRoleId: adminRole.id,
      },
      include: { primaryRole: true },
    });

    console.log(`✅ Successfully promoted ${userEmail} to admin!`);
    console.log(`🔥 New role: ${updatedUser.primaryRole?.displayName}`);
    console.log(`🎉 You can now access /dashboard/users`);
  } catch (error) {
    console.error("❌ Error promoting user to admin:", error);
  }
}

async function main() {
  try {
    await promoteUserToAdmin();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
