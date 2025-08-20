import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listUsers() {
  console.log("👥 Listing all users...");

  try {
    const users = await prisma.user.findMany({
      include: {
        primaryRole: true,
      },
    });

    if (users.length === 0) {
      console.log("📭 No users found in database");
      console.log("💡 Make sure to log in to the application first to create your user account");
      return;
    }

    console.log(`\n📊 Found ${users.length} user(s):\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.name || "No name"}`);
      console.log(`   Kinde ID: ${user.kindeId || "No Kinde ID"}`);
      console.log(`   Role: ${user.primaryRole?.displayName || "No role"}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error listing users:", error);
  }
}

async function main() {
  try {
    await listUsers();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
