# Implementation Guide: Three-Table Registration System

## Overview

This guide provides practical implementation steps for the three-table registration system in the GameOne platform. The system consists of `PendingPayment`, `Registration`, and `WaitingList` tables designed to handle complex friend registration workflows.

## Quick Start

### 1. Database Migration

Run the following commands to apply the new schema:

```bash
# Generate the Prisma client with new schema
bunx prisma generate

# Create and apply migration
bunx prisma migrate dev --name "add-three-table-registration-system"

# If using production database
bunx prisma migrate deploy
```

### 2. Type Definitions

The new schema introduces several TypeScript types that your application can use:

```typescript
// Auto-generated types from Prisma
import type { 
  PendingPayment, 
  Registration, 
  WaitingList,
  PendingPaymentStatus,
  RegistrationType,
  RegistrationSource 
} from '@prisma/client'

// Friend data schema
interface FriendData {
  name: string
  email: string
  phone?: string
  dietaryRequirements?: string
  specialRequests?: string
}

// Complete pending payment with relations
type PendingPaymentWithRelations = PendingPayment & {
  user?: User | null
  event: Event
  bankAccount?: BankAccount | null
}
```

## Key Implementation Patterns

### 1. Friend Registration Workflow

```typescript
// Example: Creating a group registration with friends
async function createGroupRegistration(
  eventId: string,
  userId: string | null, // null for guest registrations
  friendsData: FriendData[],
  guestData?: { email: string; name: string; phone?: string }
) {
  const totalParticipants = 1 + friendsData.length
  
  // Check capacity
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { 
      registrations: { where: { status: 'CONFIRMED' } },
      pendingPayments: { where: { status: 'AWAITING_PAYMENT' } }
    }
  })
  
  const currentCapacity = event.registrations.length + 
    event.pendingPayments.reduce((sum, pp) => sum + pp.totalParticipants, 0)
  
  if (currentCapacity + totalParticipants > event.capacity) {
    // Add to waiting list
    return createGroupWaitingListEntry(eventId, userId, friendsData, guestData)
  }
  
  // Create pending payment
  const pendingPayment = await prisma.pendingPayment.create({
    data: {
      eventId,
      userId,
      registrationType: 'GROUP',
      totalParticipants,
      friendsData: JSON.stringify(friendsData),
      amount: event.price * totalParticipants,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      guestEmail: guestData?.email,
      guestName: guestData?.name,
      guestPhone: guestData?.phone,
      isGuestRequest: !!guestData,
      variableSymbol: generateVariableSymbol(),
      bankAccountId: event.bankAccountId
    }
  })
  
  // Generate QR code
  await generateQRCode(pendingPayment)
  
  return pendingPayment
}
```

### 2. Payment Confirmation and Registration Creation

```typescript
async function confirmPaymentAndCreateRegistrations(pendingPaymentId: string) {
  return await prisma.$transaction(async (tx) => {
    // Update pending payment
    const pendingPayment = await tx.pendingPayment.update({
      where: { id: pendingPaymentId },
      data: { 
        status: 'PAYMENT_RECEIVED',
        paidAt: new Date(),
        verifiedAt: new Date()
      },
      include: { event: true, user: true }
    })
    
    const friendsData = JSON.parse(pendingPayment.friendsData as string) as FriendData[]
    
    // Create group leader registration
    const leaderRegistration = await tx.registration.create({
      data: {
        userId: pendingPayment.userId,
        eventId: pendingPayment.eventId,
        status: 'CONFIRMED',
        registrationType: 'GROUP',
        registrationSource: 'PENDING_PAYMENT_CONFIRMED',
        isGroupLeader: true,
        groupSize: pendingPayment.totalParticipants,
        friendsData: pendingPayment.friendsData,
        guestEmail: pendingPayment.guestEmail,
        guestName: pendingPayment.guestName,
        guestPhone: pendingPayment.guestPhone,
        isGuestRequest: pendingPayment.isGuestRequest,
        pendingPaymentId: pendingPayment.id,
        confirmedAt: new Date()
      }
    })
    
    // Create friend registrations
    const friendRegistrations = await Promise.all(
      friendsData.map((friend, index) => 
        tx.registration.create({
          data: {
            userId: null, // Friends are always guest registrations
            eventId: pendingPayment.eventId,
            status: 'CONFIRMED',
            registrationType: 'GROUP',
            registrationSource: 'PENDING_PAYMENT_CONFIRMED',
            isGroupLeader: false,
            groupLeaderId: leaderRegistration.id,
            groupSize: pendingPayment.totalParticipants,
            friendPosition: index + 1,
            guestEmail: friend.email,
            guestName: friend.name,
            guestPhone: friend.phone,
            isGuestRequest: true,
            dietaryRequirements: friend.dietaryRequirements,
            specialRequests: friend.specialRequests,
            pendingPaymentId: pendingPayment.id,
            confirmedAt: new Date()
          }
        })
      )
    )
    
    // Mark pending payment as processed
    await tx.pendingPayment.update({
      where: { id: pendingPaymentId },
      data: { 
        status: 'PROCESSED',
        processedAt: new Date()
      }
    })
    
    return { leaderRegistration, friendRegistrations }
  })
}
```

### 3. Waiting List Promotion

```typescript
async function promoteFromWaitingList(eventId: string) {
  return await prisma.$transaction(async (tx) => {
    // Find next waiting list entry
    const nextWaiting = await tx.waitingList.findFirst({
      where: { eventId, promotedAt: null },
      orderBy: { position: 'asc' },
      include: { user: true, event: true }
    })
    
    if (!nextWaiting) return null
    
    // Check available capacity
    const event = await tx.event.findUnique({
      where: { id: eventId },
      include: { 
        registrations: { where: { status: 'CONFIRMED' } },
        pendingPayments: { where: { status: 'AWAITING_PAYMENT' } }
      }
    })
    
    const currentCapacity = event.registrations.length + 
      event.pendingPayments.reduce((sum, pp) => sum + pp.totalParticipants, 0)
    
    if (currentCapacity + nextWaiting.groupSize > event.capacity) {
      return null // Not enough space
    }
    
    // Create pending payment from waiting list data
    const pendingPayment = await tx.pendingPayment.create({
      data: {
        eventId,
        userId: nextWaiting.userId,
        registrationType: nextWaiting.registrationType,
        totalParticipants: nextWaiting.groupSize,
        friendsData: nextWaiting.friendsData,
        amount: event.price * nextWaiting.groupSize,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        guestEmail: nextWaiting.guestEmail,
        guestName: nextWaiting.guestName,
        guestPhone: nextWaiting.guestPhone,
        isGuestRequest: nextWaiting.isGuestRequest,
        promotedFromWaitingList: true,
        waitingListPosition: nextWaiting.position,
        variableSymbol: generateVariableSymbol(),
        bankAccountId: event.bankAccountId
      }
    })
    
    // Update waiting list entry
    await tx.waitingList.update({
      where: { id: nextWaiting.id },
      data: { 
        promotedAt: new Date(),
        pendingPaymentId: pendingPayment.id
      }
    })
    
    // Generate QR code for promoted payment
    await generateQRCode(pendingPayment)
    
    return pendingPayment
  })
}
```

### 4. Cleanup Job for Expired Payments

```typescript
// Recommended to run as a cron job every hour
async function cleanupExpiredPayments() {
  const expiredPayments = await prisma.pendingPayment.findMany({
    where: {
      status: 'AWAITING_PAYMENT',
      expiresAt: { lt: new Date() }
    }
  })
  
  for (const payment of expiredPayments) {
    await prisma.$transaction(async (tx) => {
      // Mark as expired
      await tx.pendingPayment.update({
        where: { id: payment.id },
        data: { status: 'EXPIRED' }
      })
      
      // If this was promoted from waiting list, we may want to promote next
      if (payment.promotedFromWaitingList) {
        await promoteFromWaitingList(payment.eventId)
      }
    })
  }
  
  console.log(\`Cleaned up \${expiredPayments.length} expired payments\`)
}
```

## Database Queries Examples

### Complex Queries for Analytics

```typescript
// Get event capacity analytics
async function getEventAnalytics(eventId: string) {
  const [event, registrations, pendingPayments, waitingList] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.registration.count({ 
      where: { eventId, status: 'CONFIRMED' } 
    }),
    prisma.pendingPayment.aggregate({
      where: { eventId, status: 'AWAITING_PAYMENT' },
      _sum: { totalParticipants: true }
    }),
    prisma.waitingList.aggregate({
      where: { eventId, promotedAt: null },
      _sum: { groupSize: true },
      _count: true
    })
  ])
  
  return {
    capacity: event.capacity,
    confirmed: registrations,
    pending: pendingPayments._sum.totalParticipants || 0,
    waitingList: waitingList._sum.groupSize || 0,
    waitingListEntries: waitingList._count,
    available: event.capacity - registrations - (pendingPayments._sum.totalParticipants || 0)
  }
}

// Get user's registration status
async function getUserRegistrationStatus(userId: string, eventId: string) {
  const [registration, pendingPayment, waitingList] = await Promise.all([
    prisma.registration.findFirst({
      where: { userId, eventId },
      include: { groupMembers: true }
    }),
    prisma.pendingPayment.findFirst({
      where: { userId, eventId, status: { in: ['AWAITING_PAYMENT', 'PAYMENT_RECEIVED'] } }
    }),
    prisma.waitingList.findFirst({
      where: { userId, eventId, promotedAt: null }
    })
  ])
  
  if (registration) {
    return { 
      status: 'registered', 
      registration,
      groupSize: registration.isGroupLeader ? registration.groupSize : 1
    }
  }
  
  if (pendingPayment) {
    return { 
      status: 'pending_payment', 
      pendingPayment,
      expiresAt: pendingPayment.expiresAt
    }
  }
  
  if (waitingList) {
    return { 
      status: 'waiting_list', 
      position: waitingList.position,
      groupSize: waitingList.groupSize
    }
  }
  
  return { status: 'not_registered' }
}
```

## Testing Considerations

### Unit Test Examples

```typescript
describe('Friend Registration System', () => {
  it('should create group registration with friends', async () => {
    const friendsData = [
      { name: 'John Doe', email: 'john@example.com', phone: '+420123456789' },
      { name: 'Jane Smith', email: 'jane@example.com' }
    ]
    
    const pendingPayment = await createGroupRegistration(
      'event-id',
      'user-id',
      friendsData
    )
    
    expect(pendingPayment.totalParticipants).toBe(3) // user + 2 friends
    expect(pendingPayment.registrationType).toBe('GROUP')
    expect(JSON.parse(pendingPayment.friendsData as string)).toHaveLength(2)
  })
  
  it('should handle capacity overflow by creating waiting list entry', async () => {
    // Set up event at capacity
    // Attempt registration
    // Verify waiting list creation
  })
  
  it('should promote from waiting list when space becomes available', async () => {
    // Create waiting list entry
    // Cancel a registration to free space
    // Verify promotion
  })
})
```

## Performance Considerations

### Indexing Strategy

The schema includes comprehensive indexes for optimal performance:

```sql
-- Most important indexes for query performance
CREATE INDEX CONCURRENTLY idx_pending_payments_event_status_created 
ON pending_payments(event_id, status, created_at);

CREATE INDEX CONCURRENTLY idx_registrations_event_status 
ON registrations(event_id, status);

CREATE INDEX CONCURRENTLY idx_waiting_list_event_position 
ON waiting_list(event_id, position);
```

### Caching Recommendations

```typescript
// Cache event capacity data for frequently accessed events
const getEventCapacityCache = new Map<string, { data: any, expires: number }>()

async function getCachedEventCapacity(eventId: string) {
  const cached = getEventCapacityCache.get(eventId)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }
  
  const data = await getEventAnalytics(eventId)
  getEventCapacityCache.set(eventId, {
    data,
    expires: Date.now() + 30000 // Cache for 30 seconds
  })
  
  return data
}
```

## Security Considerations

1. **Input Validation**: Always validate friend data before storing
2. **Capacity Limits**: Enforce maximum group sizes
3. **Payment Verification**: Verify payment amounts match calculated totals
4. **Guest Data Protection**: Implement proper data handling for guest registrations

## Monitoring and Observability

Add these metrics to your monitoring system:

```typescript
// Metrics to track
const metrics = {
  pendingPaymentsCreated: counter('pending_payments_created_total'),
  pendingPaymentsExpired: counter('pending_payments_expired_total'),
  groupRegistrationsCreated: counter('group_registrations_created_total'),
  waitingListPromotions: counter('waiting_list_promotions_total'),
  capacityUtilization: gauge('event_capacity_utilization_percent')
}
```

This implementation guide provides the foundation for building a robust friend registration system that handles complex scenarios while maintaining data integrity and performance.