import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedRoles() {
  console.log("🌱 Seeding roles...");

  // Create default roles
  const defaultRoles = [
    {
      name: "ADMIN",
      displayName: "Administrator",
      description: "Full system access with all permissions",
      color: "#DC2626",
      priority: 100,
      isSystem: true,
      isDefault: false,
      permissions: ["*"], // All permissions
    },
    {
      name: "EVENT_MANAGER",
      displayName: "Event Manager",
      description: "Can create and manage events",
      color: "#2563EB",
      priority: 80,
      isSystem: false,
      isDefault: false,
      permissions: [
        "events.view",
        "events.create",
        "events.update",
        "events.delete",
        "bank-accounts.view",
        "bank-accounts.create",
        "bank-accounts.update",
        "bank-accounts.delete",
      ],
    },
    {
      name: "USER",
      displayName: "User",
      description: "Standard user with basic permissions",
      color: "#059669",
      priority: 10,
      isSystem: false,
      isDefault: true,
      permissions: ["events.view", "events.register"],
    },
    {
      name: "MODERATOR",
      displayName: "Moderator",
      description: "Can moderate events and users",
      color: "#7C3AED",
      priority: 60,
      isSystem: false,
      isDefault: false,
      permissions: [
        "events.view",
        "events.moderate",
        "users.view",
        "registrations.view",
        "registrations.manage",
      ],
    },
  ];

  for (const roleData of defaultRoles) {
    try {
      await prisma.role.upsert({
        where: { name: roleData.name },
        update: {
          displayName: roleData.displayName,
          description: roleData.description,
          color: roleData.color,
          priority: roleData.priority,
          permissions: roleData.permissions,
        },
        create: roleData,
      });
      console.log(`✅ Created/updated role: ${roleData.displayName}`);
    } catch (error) {
      console.error(`❌ Failed to create role ${roleData.name}:`, error);
    }
  }

  console.log("🎉 Role seeding completed!");
}

async function main() {
  try {
    await seedRoles();
  } catch (error) {
    console.error("❌ Error seeding roles:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
