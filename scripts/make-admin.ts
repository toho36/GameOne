import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function makeUserAdmin() {
  console.log("🔧 Making user an admin...");

  // Get your user email or Kinde ID (you'll need to update this)
  const userEmail = "tohoangviet1998@gmail.com"; // Update this to your email

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      console.error(`❌ User with email ${userEmail} not found`);
      console.log("💡 Make sure to log in first so your user account is created");
      return;
    }

    // Find the ADMIN role
    const adminRole = await prisma.role.findUnique({
      where: { name: "ADMIN" },
    });

    if (!adminRole) {
      console.error("❌ ADMIN role not found. Please run seed-roles.ts first");
      return;
    }

    // Update user to have ADMIN role
    await prisma.user.update({
      where: { id: user.id },
      data: {
        primaryRoleId: adminRole.id,
      },
    });

    console.log(`✅ Successfully made ${userEmail} an admin!`);
    console.log(`🎉 You can now access /dashboard/users`);
  } catch (error) {
    console.error("❌ Error making user admin:", error);
  }
}

async function main() {
  try {
    await makeUserAdmin();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
