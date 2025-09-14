import { PrismaClient, NotificationType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default roles
  const defaultRoles = [
    {
      name: "USER",
      displayName: "User",
      description: "Basic user - can register for events",
      color: "#6B7280",
      priority: 1,
      isSystem: true,
      isDefault: true,
      permissions: ["events.view", "events.register"],
    },
    {
      name: "REGULAR",
      displayName: "Regular Attendee",
      description: "Regular attendee - priority in registration",
      color: "#10B981",
      priority: 2,
      isSystem: true,
      isDefault: false,
      permissions: ["events.view", "events.register", "events.early_access"],
    },
    {
      name: "EVENT_MANAGER",
      displayName: "Event Manager",
      description: "Can create and manage events",
      color: "#3B82F6",
      priority: 5,
      isSystem: true,
      isDefault: false,
      permissions: [
        "events.view",
        "events.create",
        "events.update",
        "events.export",
        "registrations.view",
        "registrations.manage",
      ],
    },
    {
      name: "MODERATOR",
      displayName: "Moderator",
      description: "Can manage events and moderate users",
      color: "#F59E0B",
      priority: 7,
      isSystem: true,
      isDefault: false,
      permissions: [
        "events.view",
        "events.create",
        "events.update",
        "events.delete",
        "events.export",
        "registrations.view",
        "registrations.manage",
        "users.view",
        "users.moderate",
        "users.export",
        "payments.view",
        "payments.verify",
        "payments.refund",
        "bank-accounts.create",
        "bank-accounts.update",
        "bank-accounts.view",
        "bank-accounts.delete",
        "reports.view",
        "reports.financial",
        "reports.analytics",
        "reports.export",
        "event-documents.view",
        "event-documents.upload",
        "event-documents.delete",
        "event-categories.create",
        "event-categories.update",
        "event-categories.delete",
        "audit.view",
        "audit.export",
      ],
    },
    {
      name: "ADMIN",
      displayName: "Administrator",
      description: "Full system access",
      color: "#EF4444",
      priority: 10,
      isSystem: true,
      isDefault: false,
      permissions: [
        "events.*",
        "users.*",
        "payments.*",
        "reports.*",
        "admin.*",
        "system.*",
        "bank-accounts.*",
        "event-categories.*",
        "event-documents.*",
      ],
    },
  ];

  for (const roleData of defaultRoles) {
    const role = await prisma.role.upsert({
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
    console.log(`✅ Created/updated role: ${role.displayName}`);
  }

  // Create default bank accounts for Slovak banking
  const defaultBankAccounts = [
    {
      name: "Primary Account - Tatra Banka",
      bankName: "Tatra Banka",
      accountNumber: "1234567890",
      bankCode: "1100",
      iban: "SK89 1100 0000 0012 3456 7890",
      swift: "TATRSKBX",
      isDefault: true,
      isActive: true,
      qrCodeEnabled: true,
    },
    {
      name: "Secondary Account - Slovenska Sporitelna",
      bankName: "Slovenská sporiteľňa",
      accountNumber: "0987654321",
      bankCode: "0900",
      iban: "SK31 0900 0000 0000 9876 5432",
      swift: "GIBASKBX",
      isDefault: false,
      isActive: true,
      qrCodeEnabled: true,
    },
  ];

  for (const bankData of defaultBankAccounts) {
    const account = await prisma.bankAccount.upsert({
      where: { iban: bankData.iban },
      update: bankData,
      create: bankData,
    });
    console.log(`✅ Created/updated bank account: ${account.name}`);
  }

  // Create default system configuration
  const defaultConfigs = [
    {
      key: "app.name",
      value: "GameOne",
      description: "Application name",
      category: "general",
      isPublic: true,
    },
    {
      key: "events.max_capacity",
      value: "500",
      description: "Maximum event capacity",
      type: "number",
      category: "events",
      isPublic: false,
    },
    {
      key: "registration.auto_confirm",
      value: "false",
      description: "Auto-confirm registrations without approval",
      type: "boolean",
      category: "registration",
      isPublic: false,
    },
    {
      key: "payments.qr_code_enabled",
      value: "true",
      description: "Enable QR code generation for payments",
      type: "boolean",
      category: "payments",
      isPublic: false,
    },
    {
      key: "email.notifications_enabled",
      value: "true",
      description: "Enable email notifications",
      type: "boolean",
      category: "email",
      isPublic: false,
    },
  ];

  for (const config of defaultConfigs) {
    const systemConfig = await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: config,
      create: config,
    });
    console.log(`✅ Created/updated config: ${systemConfig.key}`);
  }

  // Create default notification templates
  const defaultTemplates = [
    {
      name: "registration_confirmation",
      type: NotificationType.EMAIL,
      subject: "Registration Confirmed - {{eventTitle}}",
      content: {
        en: `
          <h1>Registration Confirmed!</h1>
          <p>Hello {{userName}},</p>
          <p>Your registration for <strong>{{eventTitle}}</strong> has been confirmed.</p>
          <p><strong>Event Details:</strong></p>
          <ul>
            <li>Date: {{eventDate}}</li>
            <li>Time: {{eventTime}}</li>
            <li>Venue: {{eventVenue}}</li>
          </ul>
          <p>We look forward to seeing you there!</p>
        `,
        cs: `
          <h1>Registrace potvrzena!</h1>
          <p>Ahoj {{userName}},</p>
          <p>Vaše registrace na akci <strong>{{eventTitle}}</strong> byla potvrzena.</p>
          <p><strong>Detaily akce:</strong></p>
          <ul>
            <li>Datum: {{eventDate}}</li>
            <li>Čas: {{eventTime}}</li>
            <li>Místo: {{eventVenue}}</li>
          </ul>
          <p>Těšíme se na Vás!</p>
        `,
      },
      variables: ["userName", "eventTitle", "eventDate", "eventTime", "eventVenue"],
      isActive: true,
      isSystem: true,
    },
    {
      name: "waiting_list_promotion",
      type: NotificationType.EMAIL,
      subject: "Spot Available - {{eventTitle}}",
      content: {
        en: `
          <h1>Great News!</h1>
          <p>Hello {{userName}},</p>
          <p>A spot has opened up for <strong>{{eventTitle}}</strong>!</p>
          <p>You have been moved from the waiting list to confirmed registration.</p>
          <p>Please confirm your attendance by clicking the link below:</p>
          <p><a href="{{confirmationUrl}}">Confirm Attendance</a></p>
        `,
        cs: `
          <h1>Skvělé zprávy!</h1>
          <p>Ahoj {{userName}},</p>
          <p>Uvolnilo se místo na akci <strong>{{eventTitle}}</strong>!</p>
          <p>Byli jste přesunuti z čekací listiny mezi potvrzené účastníky.</p>
          <p>Prosím potvrďte svou účast kliknutím na odkaz níže:</p>
          <p><a href="{{confirmationUrl}}">Potvrdit účast</a></p>
        `,
      },
      variables: ["userName", "eventTitle", "confirmationUrl"],
      isActive: true,
      isSystem: true,
    },
  ];

  for (const template of defaultTemplates) {
    const notificationTemplate = await prisma.notificationTemplate.upsert({
      where: { name: template.name },
      update: template,
      create: template,
    });
    console.log(`✅ Created/updated template: ${notificationTemplate.name}`);
  }

  // Create default event categories
  const defaultCategories = [
    {
      name: "Workshop",
      slug: "workshop",
      description: "Hands-on learning sessions and practical workshops",
      color: "#3B82F6",
      icon: "workshop",
      isActive: true,
      sortOrder: 1,
      translations: {
        en: {
          name: "Workshop",
          description: "Hands-on learning sessions and practical workshops",
        },
        cs: {
          name: "Workshop",
          description: "Praktické učební lekce a workshopy",
        },
      },
    },
    {
      name: "Conference",
      slug: "conference",
      description: "Professional conferences and industry events",
      color: "#10B981",
      icon: "conference",
      isActive: true,
      sortOrder: 2,
      translations: {
        en: {
          name: "Conference",
          description: "Professional conferences and industry events",
        },
        cs: {
          name: "Konference",
          description: "Profesionální konference a oborové akce",
        },
      },
    },
    {
      name: "Meetup",
      slug: "meetup",
      description: "Casual networking and community meetups",
      color: "#F59E0B",
      icon: "meetup",
      isActive: true,
      sortOrder: 3,
      translations: {
        en: {
          name: "Meetup",
          description: "Casual networking and community meetups",
        },
        cs: {
          name: "Setkání",
          description: "Neformální setkávání a komunitní akce",
        },
      },
    },
    {
      name: "Training",
      slug: "training",
      description: "Professional training and certification courses",
      color: "#8B5CF6",
      icon: "training",
      isActive: true,
      sortOrder: 4,
      translations: {
        en: {
          name: "Training",
          description: "Professional training and certification courses",
        },
        cs: {
          name: "Školení",
          description: "Profesionální školení a certifikační kurzy",
        },
      },
    },
    {
      name: "Social Event",
      slug: "social",
      description: "Social gatherings and recreational activities",
      color: "#EF4444",
      icon: "social",
      isActive: true,
      sortOrder: 5,
      translations: {
        en: {
          name: "Social Event",
          description: "Social gatherings and recreational activities",
        },
        cs: {
          name: "Společenská akce",
          description: "Společenská setkání a rekreační aktivity",
        },
      },
    },
  ];

  for (const categoryData of defaultCategories) {
    const category = await prisma.eventCategory.upsert({
      where: { slug: categoryData.slug },
      update: categoryData,
      create: categoryData,
    });
    console.log(`✅ Created/updated event category: ${category.name}`);
  }

  // Seed demo users, events, registrations, and payments for MVP flows
  // Users
  const [roleAdmin, roleManager, roleModerator, roleUser, roleRegular] = await Promise.all([
    prisma.role.findUnique({ where: { name: "ADMIN" } }),
    prisma.role.findUnique({ where: { name: "EVENT_MANAGER" } }),
    prisma.role.findUnique({ where: { name: "MODERATOR" } }),
    prisma.role.findUnique({ where: { name: "USER" } }),
    prisma.role.findUnique({ where: { name: "REGULAR" } }),
  ]);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { name: "Admin User", status: "ACTIVE", primaryRoleId: roleAdmin?.id },
    create: {
      email: "admin@example.com",
      name: "Admin User",
      status: "ACTIVE",
      primaryRoleId: roleAdmin?.id,
    },
  });
  // Admin user requested
  const adminViet = await prisma.user.upsert({
    where: { email: "tohoangviet1998@gmail.com" },
    update: { name: "Viet To Hoang", status: "ACTIVE", primaryRoleId: roleAdmin?.id },
    create: {
      email: "tohoangviet1998@gmail.com",
      name: "Viet To Hoang",
      status: "ACTIVE",
      primaryRoleId: roleAdmin?.id,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: { name: "Event Manager", status: "ACTIVE", primaryRoleId: roleManager?.id },
    create: {
      email: "manager@example.com",
      name: "Event Manager",
      status: "ACTIVE",
      primaryRoleId: roleManager?.id,
    },
  });
  const moderatorUser = await prisma.user.upsert({
    where: { email: "moderator@example.com" },
    update: { name: "Moderator", status: "ACTIVE", primaryRoleId: roleModerator?.id },
    create: {
      email: "moderator@example.com",
      name: "Moderator",
      status: "ACTIVE",
      primaryRoleId: roleModerator?.id,
    },
  });
  const attendeeOne = await prisma.user.upsert({
    where: { email: "attendee1@example.com" },
    update: {
      name: "Attendee One",
      status: "ACTIVE",
      primaryRoleId: roleRegular?.id ?? roleUser?.id,
    },
    create: {
      email: "attendee1@example.com",
      name: "Attendee One",
      status: "ACTIVE",
      primaryRoleId: roleRegular?.id ?? roleUser?.id,
    },
  });
  const attendeeTwo = await prisma.user.upsert({
    where: { email: "attendee2@example.com" },
    update: {
      name: "Attendee Two",
      status: "ACTIVE",
      primaryRoleId: roleRegular?.id ?? roleUser?.id,
    },
    create: {
      email: "attendee2@example.com",
      name: "Attendee Two",
      status: "ACTIVE",
      primaryRoleId: roleRegular?.id ?? roleUser?.id,
    },
  });
  const attendeeThree = await prisma.user.upsert({
    where: { email: "attendee3@example.com" },
    update: {
      name: "Attendee Three",
      status: "ACTIVE",
      primaryRoleId: roleRegular?.id ?? roleUser?.id,
    },
    create: {
      email: "attendee3@example.com",
      name: "Attendee Three",
      status: "ACTIVE",
      primaryRoleId: roleRegular?.id ?? roleUser?.id,
    },
  });

  console.log(
    `✅ Created/updated users:`,
    adminUser.email,
    adminViet.email,
    managerUser.email,
    moderatorUser.email
  );

  // Fetch references
  const defaultAccount = await prisma.bankAccount.findFirst({ where: { isDefault: true } });
  const workshopCategory = await prisma.eventCategory.findUnique({ where: { slug: "workshop" } });
  const meetupCategory = await prisma.eventCategory.findUnique({ where: { slug: "meetup" } });

  const now = new Date();
  const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

  // Paid event requiring bank transfer verification
  const paidEvent = await prisma.event.upsert({
    where: { slug: "spring-tennis-open" },
    update: {},
    create: {
      slug: "spring-tennis-open",
      title: "Spring Tennis Open",
      type: "MEETUP",
      status: "PUBLISHED",
      capacity: 30,
      price: 25,
      currency: "EUR",
      startDate: daysFromNow(14),
      endDate: daysFromNow(14),
      registrationStartDate: daysFromNow(-7),
      registrationEndDate: daysFromNow(13),
      requiresApproval: false,
      allowWaitingList: true,
      requiresPayment: true,
      bankAccountId: defaultAccount?.id || null,
      tags: ["tennis", "outdoor"],
      city: "Bratislava",
      country: "Slovakia",
      creatorId: managerUser.id,
      managerId: moderatorUser.id,
      categoryId: workshopCategory?.id || null,
    },
  });
  console.log(`✅ Created/updated event: ${paidEvent.title}`);

  // Free event (no payment required)
  const freeEvent = await prisma.event.upsert({
    where: { slug: "community-run" },
    update: {},
    create: {
      slug: "community-run",
      title: "Community Run",
      type: "MEETUP",
      status: "PUBLISHED",
      capacity: 100,
      price: null,
      currency: "EUR",
      startDate: daysFromNow(10),
      endDate: daysFromNow(10),
      registrationStartDate: daysFromNow(-5),
      registrationEndDate: daysFromNow(9),
      requiresApproval: false,
      allowWaitingList: true,
      requiresPayment: false,
      bankAccountId: null,
      tags: ["running", "community"],
      city: "Prague",
      country: "Czech Republic",
      creatorId: managerUser.id,
      managerId: moderatorUser.id,
      categoryId: meetupCategory?.id || null,
    },
  });
  console.log(`✅ Created/updated event: ${freeEvent.title}`);

  // Registrations and payments for paid event
  // 1) Attendee One - pending payment verification
  const pp1 = await prisma.pendingPayment.create({
    data: {
      userId: attendeeOne.id,
      eventId: paidEvent.id,
      amount: 25,
      currency: "EUR",
      type: "REGISTRATION",
      bankAccountId: defaultAccount?.id || null,
      description: "Registration fee pending verification",
    },
  });

  await prisma.registration.create({
    data: {
      userId: attendeeOne.id,
      eventId: paidEvent.id,
      status: "PENDING",
      groupSize: 1,
      requiresPayment: true,
      pendingPaymentId: pp1.id,
      paymentStatus: "PENDING_VERIFICATION",
      notes: "Awaiting bank transfer",
    },
  });

  // 2) Attendee Two - payment verified and confirmed
  const reg2 = await prisma.registration.create({
    data: {
      userId: attendeeTwo.id,
      eventId: paidEvent.id,
      status: "CONFIRMED",
      confirmedAt: now,
      groupSize: 1,
      requiresPayment: true,
      paymentStatus: "PAYMENT_VERIFIED",
    },
  });

  const pay2 = await prisma.payment.create({
    data: {
      userId: attendeeTwo.id,
      eventId: paidEvent.id,
      registrationId: reg2.id,
      amount: 25,
      currency: "EUR",
      method: "BANK_TRANSFER",
      status: "COMPLETED",
      bankAccountId: defaultAccount?.id || null,
      paidAt: now,
      verifiedAt: now,
      description: "Registration fee received and verified",
    },
  });

  await prisma.registration.update({
    where: { id: reg2.id },
    data: { paymentId: pay2.id },
  });

  // 3) Attendee Three - payment rejected
  const pp3 = await prisma.pendingPayment.create({
    data: {
      userId: attendeeThree.id,
      eventId: paidEvent.id,
      amount: 25,
      currency: "EUR",
      type: "REGISTRATION",
      bankAccountId: defaultAccount?.id || null,
      description: "Incorrect amount sent",
    },
  });

  await prisma.registration.create({
    data: {
      userId: attendeeThree.id,
      eventId: paidEvent.id,
      status: "REJECTED",
      groupSize: 1,
      requiresPayment: true,
      pendingPaymentId: pp3.id,
      paymentStatus: "REJECTED",
      paymentRejectedAt: now,
      paymentRejectionReason: "Amount mismatch",
    },
  });

  // Free event registration (no payment)
  await prisma.registration.create({
    data: {
      userId: attendeeOne.id,
      eventId: freeEvent.id,
      status: "CONFIRMED",
      confirmedAt: now,
      groupSize: 1,
      requiresPayment: false,
      paymentStatus: "WAITING_LIST_PROMOTED", // Not relevant, but keep a valid enum
    },
  });

  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
