# Database Schema Relations

## Core Models Overview

### User Management
```
User
├── Profile (1:1)
├── UserRole (1:many) → Role
├── Registration (1:many) → Event
├── WaitingList (1:many) → Event
├── Payment (1:many)
├── RegistrationHistory (1:many as user)
├── RegistrationHistory (1:many as performedBy)
├── AuditLog (1:many)
└── NotificationLog (1:many)

Role
├── User (1:many via primary role)
└── UserRole (1:many)
```

### Event Management
```
Event
├── Registration (1:many)
├── WaitingList (1:many)
├── Payment (1:many)
├── RegistrationHistory (1:many)
├── User (many:1 as creator)
├── User (many:1 as manager)
└── BankAccount (many:1)
```

### Registration System
```
Registration
├── User (many:1)
├── Event (many:1)
└── Payment (1:1)

WaitingList
├── User (many:1)
└── Event (many:1)
```

### Payment System
```
Payment
├── User (many:1)
├── Event (many:1 optional)
├── Registration (1:1 optional)
└── BankAccount (many:1 optional)

BankAccount
├── Event (1:many)
└── Payment (1:many)
```

### Audit & History
```
RegistrationHistory
├── User (many:1 as user)
├── User (many:1 as performedBy)
└── Event (many:1)

AuditLog
└── User (many:1 optional)
```

### Notifications
```
NotificationTemplate
└── NotificationLog (1:many)

NotificationLog
├── NotificationTemplate (many:1 optional)
└── User (many:1 optional)
```

## Key Relationships

1. **User-centric**: Users are central to most operations (registrations, payments, audit trails)
2. **Event-centric**: Events connect to registrations, waiting lists, payments, and history
3. **Payment Flow**: Registration → Payment (optional 1:1 relationship)
4. **Audit Trail**: All major actions tracked in RegistrationHistory and AuditLog
5. **Role-based Access**: Users have roles with permissions for authorization
6. **Internationalization**: Ready for multi-language support in events and notifications

## Database Constraints

- **Unique Constraints**: 
  - User email, Registration (user+event), WaitingList (user+event)
  - Payment variableSymbol, Role name
- **Cascading Deletes**: 
  - User deletion cascades to Profile, UserRole, Registration, WaitingList
  - Event deletion cascades to Registration, WaitingList
- **Indexes**: Optimized for common queries (user lookups, event searches, payment tracking)