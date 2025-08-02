import { PrismaClient, NotificationType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default roles
  const defaultRoles = [
    {
      name: 'USER',
      displayName: 'User',
      description: 'Basic user - can register for events',
      color: '#6B7280',
      priority: 1,
      isSystem: true,
      isDefault: true,
      permissions: [
        'events.view',
        'events.register',
        'profile.update',
        'profile.view',
        'videos.view',
        'videos.create',
        'videos.react'
      ]
    },
    {
      name: 'REGULAR',
      displayName: 'Regular Attendee',
      description: 'Regular attendee - priority in registration',
      color: '#10B981',
      priority: 2,
      isSystem: true,
      isDefault: false,
      permissions: [
        'events.view',
        'events.register',
        'events.early_access',
        'profile.update',
        'profile.view',
        'videos.view',
        'videos.create',
        'videos.react'
      ]
    },
    {
      name: 'EVENT_MANAGER',
      displayName: 'Event Manager',
      description: 'Can create and manage events',
      color: '#3B82F6',
      priority: 5,
      isSystem: true,
      isDefault: false,
      permissions: [
        'events.view',
        'events.create',
        'events.update',
        'events.manage_registrations',
        'events.export_data',
        'users.view_registrations',
        'profile.update',
        'profile.view',
        'videos.view',
        'videos.create',
        'videos.react',
      ]
    },
    {
      name: 'MODERATOR',
      displayName: 'Moderator',
      description: 'Can manage events and moderate users',
      color: '#F59E0B',
      priority: 7,
      isSystem: true,
      isDefault: false,
      permissions: [
        'events.view',
        'events.create',
        'events.update',
        'events.delete',
        'events.manage_registrations',
        'events.export_data',
        'users.view',
        'users.moderate',
        'users.view_registrations',
        'users.export_data',
        'payments.view',
        'payments.manage_accounts',
        'payments.refund',
        'payments.verify',
        'bankaccounts.create',
        'bankaccounts.update',
        'bankaccounts.view',
        'bankaccounts.delete',
        'reports.view',
        'reports.financial',
        'reports.analytics',
        'reports.export',
        'documents.view',
        'documents.upload',
        'documents.delete',
        'categories.create',
        'categories.update',
        'categories.delete',
        'audit.view',
        'audit.export',
        'profile.update',
        'profile.view',
        'videos.view',
        'videos.create',
        'videos.react',
        'video_categories.create',
        'video_categories.update',
        'video_categories.delete'
      ]
    },
    {
      name: 'ADMIN',
      displayName: 'Administrator',
      description: 'Full system access',
      color: '#EF4444',
      priority: 10,
      isSystem: true,
      isDefault: false,
      permissions: [
        'events.*',
        'users.*',
        'payments.*',
        'reports.*',
        'admin.*',
        'system.*',
        'videos.*',
        'video_categories.*'
      ]
    }
  ]

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
    })
    console.log(`✅ Created/updated role: ${role.displayName}`)
  }

  // Create default bank accounts for Slovak banking
  const defaultBankAccounts = [
    {
      name: 'Primary Account - Tatra Banka',
      bankName: 'Tatra Banka',
      accountNumber: '1234567890',
      bankCode: '1100',
      iban: 'SK89 1100 0000 0012 3456 7890',
      swift: 'TATRSKBX',
      isDefault: true,
      isActive: true,
      qrCodeEnabled: true,
    },
    {
      name: 'Secondary Account - Slovenska Sporitelna',
      bankName: 'Slovenská sporiteľňa',
      accountNumber: '0987654321',
      bankCode: '0900',
      iban: 'SK31 0900 0000 0000 9876 5432',
      swift: 'GIBASKBX',
      isDefault: false,
      isActive: true,
      qrCodeEnabled: true,
    }
  ]

  for (const bankData of defaultBankAccounts) {
    const account = await prisma.bankAccount.upsert({
      where: { iban: bankData.iban },
      update: bankData,
      create: bankData,
    })
    console.log(`✅ Created/updated bank account: ${account.name}`)
  }

  // Create default system configuration
  const defaultConfigs = [
    {
      key: 'app.name',
      value: 'GameOne',
      description: 'Application name',
      category: 'general',
      isPublic: true,
    },
    {
      key: 'events.max_capacity',
      value: '500',
      description: 'Maximum event capacity',
      type: 'number',
      category: 'events',
      isPublic: false,
    },
    {
      key: 'registration.auto_confirm',
      value: 'false',
      description: 'Auto-confirm registrations without approval',
      type: 'boolean',
      category: 'registration',
      isPublic: false,
    },
    {
      key: 'payments.qr_code_enabled',
      value: 'true',
      description: 'Enable QR code generation for payments',
      type: 'boolean',
      category: 'payments',
      isPublic: false,
    },
    {
      key: 'email.notifications_enabled',
      value: 'true',
      description: 'Enable email notifications',
      type: 'boolean',
      category: 'email',
      isPublic: false,
    }
  ]

  for (const config of defaultConfigs) {
    const systemConfig = await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: config,
      create: config,
    })
    console.log(`✅ Created/updated config: ${systemConfig.key}`)
  }

  // Create default notification templates
  const defaultTemplates = [
    {
      name: 'registration_confirmation',
      type: NotificationType.EMAIL,
      subject: 'Registration Confirmed - {{eventTitle}}',
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
        `
      },
      variables: ['userName', 'eventTitle', 'eventDate', 'eventTime', 'eventVenue'],
      isActive: true,
      isSystem: true,
    },
    {
      name: 'waiting_list_promotion',
      type: NotificationType.EMAIL,
      subject: 'Spot Available - {{eventTitle}}',
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
        `
      },
      variables: ['userName', 'eventTitle', 'confirmationUrl'],
      isActive: true,
      isSystem: true,
    }
  ]

  for (const template of defaultTemplates) {
    const notificationTemplate = await prisma.notificationTemplate.upsert({
      where: { name: template.name },
      update: template,
      create: template,
    })
    console.log(`✅ Created/updated template: ${notificationTemplate.name}`)
  }

  // Create default event categories
  const defaultCategories = [
    {
      name: 'Workshop',
      slug: 'workshop',
      description: 'Hands-on learning sessions and practical workshops',
      color: '#3B82F6',
      icon: 'workshop',
      isActive: true,
      sortOrder: 1,
      translations: {
        en: {
          name: 'Workshop',
          description: 'Hands-on learning sessions and practical workshops'
        },
        cs: {
          name: 'Workshop',
          description: 'Praktické učební lekce a workshopy'
        }
      }
    },
    {
      name: 'Conference',
      slug: 'conference',
      description: 'Professional conferences and industry events',
      color: '#10B981',
      icon: 'conference',
      isActive: true,
      sortOrder: 2,
      translations: {
        en: {
          name: 'Conference',
          description: 'Professional conferences and industry events'
        },
        cs: {
          name: 'Konference',
          description: 'Profesionální konference a oborové akce'
        }
      }
    },
    {
      name: 'Meetup',
      slug: 'meetup',
      description: 'Casual networking and community meetups',
      color: '#F59E0B',
      icon: 'meetup',
      isActive: true,
      sortOrder: 3,
      translations: {
        en: {
          name: 'Meetup',
          description: 'Casual networking and community meetups'
        },
        cs: {
          name: 'Setkání',
          description: 'Neformální setkávání a komunitní akce'
        }
      }
    },
    {
      name: 'Training',
      slug: 'training',
      description: 'Professional training and certification courses',
      color: '#8B5CF6',
      icon: 'training',
      isActive: true,
      sortOrder: 4,
      translations: {
        en: {
          name: 'Training',
          description: 'Professional training and certification courses'
        },
        cs: {
          name: 'Školení',
          description: 'Profesionální školení a certifikační kurzy'
        }
      }
    },
    {
      name: 'Social Event',
      slug: 'social',
      description: 'Social gatherings and recreational activities',
      color: '#EF4444',
      icon: 'social',
      isActive: true,
      sortOrder: 5,
      translations: {
        en: {
          name: 'Social Event',
          description: 'Social gatherings and recreational activities'
        },
        cs: {
          name: 'Společenská akce',
          description: 'Společenská setkání a rekreační aktivity'
        }
      }
    }
  ]

  for (const categoryData of defaultCategories) {
    const category = await prisma.eventCategory.upsert({
      where: { slug: categoryData.slug },
      update: categoryData,
      create: categoryData,
    })
    console.log(`✅ Created/updated event category: ${category.name}`)
  }

  // Create default video categories
  const defaultVideoCategories = [
    {
      name: 'Gaming',
      slug: 'gaming',
      description: 'Gaming highlights, tutorials, and gameplay clips',
      color: '#8B5CF6',
      icon: 'gamepad',
      isActive: true,
      sortOrder: 1,
      translations: {
        en: {
          name: 'Gaming',
          description: 'Gaming highlights, tutorials, and gameplay clips'
        },
        cs: {
          name: 'Gaming',
          description: 'Herní momenty, tutoriály a záznamy z her'
        }
      }
    },
    {
      name: 'Tutorials',
      slug: 'tutorials',
      description: 'Educational content and how-to videos',
      color: '#3B82F6',
      icon: 'book',
      isActive: true,
      sortOrder: 2,
      translations: {
        en: {
          name: 'Tutorials',
          description: 'Educational content and how-to videos'
        },
        cs: {
          name: 'Tutoriály',
          description: 'Vzdělávací obsah a návodová videa'
        }
      }
    },
    {
      name: 'Highlights',
      slug: 'highlights',
      description: 'Best moments and memorable clips from events',
      color: '#F59E0B',
      icon: 'star',
      isActive: true,
      sortOrder: 3,
      translations: {
        en: {
          name: 'Highlights',
          description: 'Best moments and memorable clips from events'
        },
        cs: {
          name: 'Nejlepší momenty',
          description: 'Nejlepší okamžiky a nezapomenutelné záběry z akcí'
        }
      }
    },
    {
      name: 'Community',
      slug: 'community',
      description: 'Community-generated content and discussions',
      color: '#10B981',
      icon: 'users',
      isActive: true,
      sortOrder: 4,
      translations: {
        en: {
          name: 'Community',
          description: 'Community-generated content and discussions'
        },
        cs: {
          name: 'Komunita',
          description: 'Obsah vytvořený komunitou a diskuze'
        }
      }
    },
    {
      name: 'Event Recaps',
      slug: 'event-recaps',
      description: 'Event summaries and retrospectives',
      color: '#EF4444',
      icon: 'calendar',
      isActive: true,
      sortOrder: 5,
      translations: {
        en: {
          name: 'Event Recaps',
          description: 'Event summaries and retrospectives'
        },
        cs: {
          name: 'Shrnutí akcí',
          description: 'Souhrny akcí a retrospektivy'
        }
      }
    },
    {
      name: 'Interviews',
      slug: 'interviews',
      description: 'Interviews with speakers, organizers, and community members',
      color: '#06B6D4',
      icon: 'microphone',
      isActive: true,
      sortOrder: 6,
      translations: {
        en: {
          name: 'Interviews',
          description: 'Interviews with speakers, organizers, and community members'
        },
        cs: {
          name: 'Rozhovory',
          description: 'Rozhovory s řečníky, organizátory a členy komunity'
        }
      }
    }
  ]

  for (const categoryData of defaultVideoCategories) {
    const videoCategory = await prisma.videoCategory.upsert({
      where: { slug: categoryData.slug },
      update: categoryData,
      create: categoryData,
    })
    console.log(`✅ Created/updated video category: ${videoCategory.name}`)
  }

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })