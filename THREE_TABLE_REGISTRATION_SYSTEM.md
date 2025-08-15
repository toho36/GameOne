# Three-Table Registration System Design for GameOne

## Overview

This document outlines the complete three-table registration system schema
design for the GameOne event management platform. The system supports individual
and group registrations, friend registration workflows, guest registrations, and
comprehensive payment processing with QR code generation.

## System Architecture

The three-table registration system consists of:

1. **PendingPayment** - Temporary payment requests with friend data storage
2. **Registration** - Confirmed registrations (enhanced from original)
3. **WaitingList** - Group-aware waiting list management (enhanced from
   original)

## Table Definitions

### 1. PendingPayment Model

The `PendingPayment` table serves as the initial entry point for all
registration requests that require payment or involve friends. It temporarily
stores all registration data while awaiting payment confirmation or admin
approval.

#### Key Features:

- **Friend Data Storage**: JSON field for storing friend registration
  information
- **Guest Registration Support**: Allows non-authenticated users to register
- **QR Code Generation**: Built-in support for Slovak/Czech banking QR codes
- **Expiration Management**: Automatic cleanup of expired payment requests
- **Group Capacity Tracking**: Tracks total participants including friends

#### Field Specifications:

```prisma
model PendingPayment {
  id      String               @id @default(cuid())
  eventId String
  status  PendingPaymentStatus @default(AWAITING_PAYMENT)

  // Primary registrant (can be null for guest registrations)
  userId String?

  // Guest registration data (for non-authenticated users)
  guestEmail     String?
  guestName      String?
  guestPhone     String?
  isGuestRequest Boolean @default(false)

  // Registration type and capacity tracking
  registrationType RegistrationType @default(INDIVIDUAL)
  totalParticipants Int             @default(1) // Including primary + friends

  // Friend registration data (JSON array of friend objects)
  friendsData Json? @default("[]")

  // Primary registrant additional data
  primaryDietaryRequirements String?
  primarySpecialRequests     String?
  primaryNotes               String?

  // Payment information
  amount           Decimal       @db.Decimal(10, 2)
  currency         String        @default("EUR")
  paymentMethod    PaymentMethod @default(QR_CODE)

  // Bank transfer details for QR code generation
  bankAccountId  String?
  variableSymbol String? @unique
  constantSymbol String?
  specificSymbol String?

  // QR code data
  qrCodeData String?
  qrCodeUrl  String?

  // Expiration and lifecycle management
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  expiresAt DateTime

  // Payment tracking
  paidAt      DateTime?
  verifiedAt  DateTime?
  processedAt DateTime?
  cancelledAt DateTime?

  // Promotion tracking (for waiting list scenarios)
  promotedFromWaitingList Boolean @default(false)
  waitingListPosition     Int?
}
```

#### Friend Data JSON Schema:

```json
[
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+420123456789",
    "dietaryRequirements": "vegetarian",
    "specialRequests": "wheelchair access"
  }
]
```

### 2. Enhanced Registration Model

The enhanced `Registration` table stores confirmed registrations that have
completed the payment process or been approved by admins. It includes
comprehensive group registration support and links back to the original pending
payment.

#### Key Features:

- **Group Registration Support**: Hierarchical structure for group leaders and
  members
- **Guest Registration**: Support for non-authenticated users
- **Payment Linking**: References to both Payment and PendingPayment records
- **Waiting List Promotion**: Tracks registrations promoted from waiting list
- **Friend Data Storage**: JSON storage for group leader's friend information

#### Group Registration Structure:

- **Group Leader**: `isGroupLeader = true`, contains `friendsData` JSON
- **Group Members**: `isGroupLeader = false`, linked to leader via
  `groupLeaderId`

### 3. Enhanced WaitingList Model

The enhanced `WaitingList` table supports group waiting list entries where
multiple people can be added to the waiting list as a single unit and promoted
together when sufficient capacity becomes available.

#### Key Features:

- **Group Waiting List**: Support for groups requiring multiple spots
- **Guest Waiting List**: Non-authenticated users can join waiting list
- **Friend Data Storage**: JSON storage for group waiting list entries
- **Promotion Tracking**: Links to created PendingPayment when promoted

## State Flow Design

### Registration Flow for Individual Users

1. **User Submits Registration**
   - Create `PendingPayment` record with user data
   - Generate QR code for payment
   - Send confirmation email with QR code

2. **Payment Processing**
   - User pays via QR code
   - Admin marks payment as received
   - Status changes to `PAYMENT_RECEIVED`

3. **Registration Confirmation**
   - Create `Registration` record from `PendingPayment`
   - Link records via `pendingPaymentId`
   - Mark `PendingPayment` as `PROCESSED`
   - Send confirmation email

### Registration Flow for Groups (with Friends)

1. **Primary User Submits Group Registration**
   - Create `PendingPayment` record with `registrationType = GROUP`
   - Store friend data in `friendsData` JSON field
   - Set `totalParticipants` to count of primary + friends
   - Check total capacity against event limits

2. **Capacity Handling**
   - **If sufficient capacity**: Proceed with payment flow
   - **If insufficient capacity**: Create group entry in `WaitingList`

3. **Payment and Confirmation**
   - Calculate total amount (price × totalParticipants)
   - Generate QR code for full amount
   - Upon payment confirmation, create multiple `Registration` records:
     - One for primary user (group leader)
     - One for each friend (group member)

4. **Group Structure Creation**
   - Group leader: `isGroupLeader = true`, contains all `friendsData`
   - Group members: `isGroupLeader = false`, linked to leader

### Waiting List Promotion Flow

1. **Waiting List Entry**
   - Create `WaitingList` record when event at capacity
   - For groups: `isGroupEntry = true`, `groupSize = totalParticipants`

2. **Space Becomes Available**
   - Check if sufficient spots for next waiting list entry
   - For groups: Verify `groupSize` can fit in available capacity

3. **Promotion Process**
   - Create `PendingPayment` from waiting list data
   - Link via `pendingPaymentId` in WaitingList
   - Set `promotedFromWaitingList = true`
   - Remove from waiting list
   - Send promotion notification email

## Supporting Enums and Types

### Enhanced RegistrationStatus Enum

```prisma
enum RegistrationStatus {
  PENDING     // Awaiting approval/payment
  CONFIRMED   // Confirmed attendance
  CANCELLED   // User cancelled
  REJECTED    // Admin rejected
  ATTENDED    // Actually attended event
  NO_SHOW     // Didn't show up
}
```

### New RegistrationType Enum

```prisma
enum RegistrationType {
  INDIVIDUAL    // Single person registration
  GROUP         // Group registration with friends
  ADMIN_CREATED // Created by admin/moderator
}
```

### New RegistrationSource Enum

```prisma
enum RegistrationSource {
  WEB_FORM                  // Standard web registration
  ADMIN_PANEL              // Created by admin
  PROMOTED_FROM_WAITING    // Promoted from waiting list
  PENDING_PAYMENT_CONFIRMED // Confirmed from pending payment
}
```

### PendingPaymentStatus Enum

```prisma
enum PendingPaymentStatus {
  AWAITING_PAYMENT   // QR code generated, waiting for payment
  PAYMENT_RECEIVED   // Payment confirmed, ready to promote
  EXPIRED            // Payment deadline passed
  CANCELLED          // User cancelled before payment
  PROCESSED          // Successfully converted to registration
}
```

## Relationship Design

### Foreign Key Relationships

1. **PendingPayment Relations**:
   - `userId` → `User.id` (nullable for guest registrations)
   - `eventId` → `Event.id` (cascade delete)
   - `bankAccountId` → `BankAccount.id` (for QR code generation)

2. **Registration Relations**:
   - `userId` → `User.id` (nullable for guest registrations)
   - `eventId` → `Event.id` (cascade delete)
   - `paymentId` → `Payment.id` (payment tracking)
   - `pendingPaymentId` → `PendingPayment.id` (audit trail)
   - `groupLeaderId` → `Registration.id` (group hierarchy)

3. **WaitingList Relations**:
   - `userId` → `User.id` (nullable for guest waiting list)
   - `eventId` → `Event.id` (cascade delete)
   - `pendingPaymentId` → `PendingPayment.id` (promotion tracking)

### Cascade Behaviors

- **User Deletion**: Cascade to all related records (preserves guest
  registrations)
- **Event Deletion**: Cascade to all registration-related records
- **Payment Deletion**: Set null in Registration (preserves registration data)
- **Group Leader Deletion**: Cascade to group members (maintains group
  integrity)

## Index Strategy for Performance

### PendingPayment Indexes

```prisma
@@index([eventId, status, createdAt])           // Event management queries
@@index([userId, status])                       // User's pending payments
@@index([status, expiresAt])                   // Cleanup jobs
@@index([variableSymbol])                      // Payment verification
@@index([isGuestRequest, status])              // Guest registration tracking
@@index([promotedFromWaitingList, waitingListPosition]) // Waiting list management
@@index([registrationType, totalParticipants]) // Capacity planning
@@index([paidAt, verifiedAt, processedAt])     // Payment lifecycle tracking
```

### Registration Indexes

```prisma
@@index([eventId, status])                     // Event participant queries
@@index([userId, status])                      // User's registrations
@@index([isGroupLeader, groupSize])            // Group registration queries
@@index([groupLeaderId, friendPosition])       // Group member queries
@@index([registrationType, registrationSource]) // Analytics
@@index([promotedFromWaitingList, promotedAt]) // Waiting list analytics
@@index([isGuestRequest, guestEmail])          // Guest registration management
@@index([pendingPaymentId])                    // Linking to pending payments
```

### WaitingList Indexes

```prisma
@@index([eventId, position])                   // Waiting list order
@@index([isGroupEntry, groupSize])             // Group waiting list management
@@index([registrationType, position])          // Waiting list analytics
@@index([promotedAt, pendingPaymentId])        // Promotion tracking
```

## Race Condition Prevention

### Concurrent Registration Prevention

- Use database transactions for all multi-table operations
- Implement optimistic locking on capacity-critical operations
- Use unique constraints on user-event combinations

### Payment Processing Safety

- Unique constraint on `variableSymbol` prevents duplicate payments
- Status-based state machine prevents invalid transitions
- Transaction isolation ensures atomic payment confirmation

### Waiting List Position Management

- Use sequential position assignment with gap handling
- Implement position recalculation on deletions
- Use advisory locks for position modifications

## Cleanup and Expiration Workflows

### Automated Cleanup Jobs

1. **Expired Pending Payments**

   ```sql
   UPDATE pending_payments
   SET status = 'EXPIRED'
   WHERE status = 'AWAITING_PAYMENT'
   AND expiresAt < NOW()
   ```

2. **Old Processed Payments**
   - Archive processed pending payments older than 90 days
   - Maintain references for audit trail

3. **Orphaned Group Members**
   - Clean up group member registrations when leader is deleted
   - Automatically handled by cascade delete constraints

## Migration Strategy

### Phase 1: Schema Migration

1. Add new tables (`PendingPayment`)
2. Add new columns to existing tables
3. Add new enums and constraints
4. Create new indexes

### Phase 2: Data Migration

1. Migrate existing registrations to new structure
2. Update payment references
3. Recalculate group relationships if needed

### Phase 3: Application Updates

1. Update API endpoints to use new schema
2. Implement new business logic
3. Update UI components for friend registration
4. Deploy cleanup jobs

## Business Rules Implementation

### Capacity Management

- Check total capacity including pending payments and confirmed registrations
- Reserve spots for pending payments to prevent overbooking
- Handle group registrations atomically (all or none)

### Payment Validation

- Verify payment amounts match event pricing × participant count
- Validate bank account assignments
- Ensure QR code generation includes all required fields

### Friend Data Validation

- Validate friend email formats and phone numbers
- Check for duplicate friends within the same registration
- Ensure friend data completeness before QR code generation

This comprehensive three-table registration system provides a robust foundation
for managing complex registration workflows while maintaining data integrity and
supporting the full range of business requirements for the GameOne platform.
