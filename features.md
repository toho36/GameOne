# GameOne - Complete Features Documentation

This document provides a comprehensive overview of all features implemented in
the GameOne event management platform for Slovak/Czech markets.

## **Table of Contents**

1. [Authentication & User Management](#authentication--user-management)
2. [Event Management](#event-management)
3. [Registration System](#registration-system)
4. [Waiting List Management](#waiting-list-management)
5. [Payment & Banking Integration](#payment--banking-integration)
6. [Analytics Dashboard](#analytics-dashboard)
7. [Admin & Moderation Panel](#admin--moderation-panel)
8. [Email & Communication](#email--communication)
9. [Registration History & Audit](#registration-history--audit)
10. [User Interface & Experience](#user-interface--experience)
11. [Technical Features](#technical-features)

---

## **Authentication & User Management**

### **Authentication System**

- **Kinde OAuth Integration** - Modern authentication using Kinde service
- **Multiple Auth Methods** - Support for social login and email authentication
- **Session Management** - Persistent user sessions with validation
- **Role-Based Access Control** - Four user roles with different permissions

### **Dynamic Roles System**

- **Flexible Role Creation** - Custom roles with granular permissions
- **Multiple Role Assignment** - Users can have multiple roles simultaneously
- **Permission-Based Access** - Granular permissions like 'events.create',
  'users.manage'
- **Role Hierarchy** - Priority-based role system with inheritance
- **Temporary Roles** - Time-limited role assignments with expiration dates
- **Role Templates** - Pre-configured roles for common use cases:
  - **USER** - Basic registration privileges
  - **REGULAR** - Enhanced user with priority access
  - **EVENT_MANAGER** - Can create and manage events
  - **MODERATOR** - Can moderate users and manage events
  - **ADMIN** - Full system access including user management

### **User Profile Management**

- **Profile Editing** - Users can update name and phone number inline
- **Payment Preferences** - Choose between QR code payment or cash on site
- **Account Information** - View role, member since date, and account status
- **Profile Validation** - Phone number validation for Czech format

### **How It Works**

1. **First-time Login** - New users automatically become USER role
2. **First User Promotion** - First user in system automatically becomes ADMIN
3. **Role Management** - Admins can promote/demote users through admin panel
4. **Profile Setup** - Users complete profile with phone number and payment
   preference

---

## **Event Management**

### **Event Creation & Administration**

- **Event Creation** - Create events with title, description, date/time,
  location, capacity
- **Event Editing** - Modify existing events (admins/moderators only)
- **Event Duplication** - Clone existing events with new dates
- **Visibility Control** - Hide/show events from public view
- **Bank Account Assignment** - Assign specific bank accounts to events

### **Event Display Features**

- **Event Listing** - Homepage shows upcoming events with registration counts
- **Event Archive** - Past events accessible through archive page
- **Event Details** - Individual event pages with full information
- **Capacity Indicators** - Visual progress bars showing registration status
- **Czech Localization** - Dates and times displayed in Czech format

### **Special Event Features**

- **Hidden Events** - Events visible only to moderators/admins
- **Capacity Management** - Automatic waiting list when capacity reached
- **Real-time Updates** - Participant counts update every 10 seconds
- **Event Status** - Past events show as "completed" with disabled registration

### **How It Works**

1. **Admin Creates Event** - Set all event details including capacity and bank
   account
2. **Public Display** - Event appears on homepage for user registration
3. **Registration Management** - System tracks capacity and moves overflow to
   waiting list
4. **Event Completion** - Past events automatically disable registration

---

## **Registration System**

### **Registration Types**

- **Authenticated Registration** - Logged-in users register with profile data
- **Guest Registration** - Non-users can register with manual form entry
- **Admin Registration** - Admins can manually add participants

### **Registration Features**

- **Duplicate Prevention** - Prevents multiple registrations with same
  email/name combination
- **Form Validation** - Zod schema validation for all registration data
- **Payment Method Selection** - Choose QR code payment or cash on arrival
- **Phone Number Validation** - Czech phone number format validation
- **Registration Confirmation** - Email confirmation with event details and QR
  code

### **Registration Status Management**

- **Registration Status Check** - Users can check if they're registered
- **Unregistration** - Users can cancel their registration
- **Registration History** - Complete audit trail of all registration actions
- **Reactivation** - Deleted registrations can be reactivated

### **How It Works**

1. **User Selects Event** - Browse events and click to register
2. **Registration Form** - Fill out form or use profile data
3. **Payment Method** - Choose QR code or cash payment
4. **Confirmation** - Receive email with QR code and event details
5. **Capacity Check** - If full, automatically added to waiting list

---

## **Waiting List Management**

### **Automatic Waiting List**

- **Overflow Handling** - Users automatically added when event reaches capacity
- **Queue Management** - First-come-first-served basis for waiting list
- **Automatic Promotion** - First person promoted when someone unregisters
- **Status Tracking** - Users can check waiting list position

### **Waiting List Features**

- **Email Notifications** - Automated emails when promoted from waiting list
- **Guest Waiting List** - Non-authenticated users can join waiting list
- **Admin Management** - Admins can view and manage waiting lists
- **Leave Waiting List** - Users can remove themselves from waiting list

### **How It Works**

1. **Event Reaches Capacity** - New registrations automatically go to waiting
   list
2. **Waiting List Success** - Users receive confirmation of waiting list
   placement
3. **Promotion Process** - When someone unregisters, first waiting list person
   is promoted
4. **Promotion Email** - Promoted users receive automated notification email

---

## **Payment & Banking Integration**

### **QR Code Payment System**

- **Slovak Banking QR Codes** - Generate SPD format QR codes for instant bank
  transfers
- **Czech Banking Support** - Full compatibility with Czech banking system
- **Variable Symbols** - Unique payment tracking numbers for each registration
- **Multiple Bank Accounts** - Support for different bank accounts per event
- **Payment Amount Integration** - QR codes include exact event price
- **Multi-Bank Support** - Slovenska sporitelna, VUB, Tatrabanka, CSOB, mBank
  compatibility

### **Bank Account Management**

- **Multiple Accounts** - Support for Main Account, Vitek Account, etc.
- **Admin Selection** - Admins can assign specific accounts to events
- **Default Account** - Fallback to default account if no specific assignment
- **Account Details** - Full bank details embedded in QR codes

### **Payment Tracking**

- **Payment Status** - Track paid/unpaid status for each registration
- **Payment Method** - Track whether user chose QR, card, or cash payment
- **Admin Payment Management** - Admins can mark payments as received
- **Payment History** - Complete payment audit trail

### **How It Works**

1. **User Registers** - Selects QR code payment method
2. **QR Generation** - System generates QR code with bank details and variable
   symbol
3. **Email Delivery** - QR code sent in confirmation email
4. **Payment Processing** - User scans QR code to make bank transfer
5. **Payment Tracking** - Admin marks payment as received when bank transfer
   confirmed

---

## **Analytics Dashboard**

### **Revenue Analytics & Ticket Sales Tracking**

- **Real-time Sales Monitoring** - Live tracking of ticket sales with
  hourly/daily breakdowns
- **Revenue Forecasting** - Predictive analytics based on historical
  registration patterns
- **Payment Method Analysis** - Track QR code vs cash payment preferences and
  success rates
- **Event Profitability** - Calculate net revenue per event including costs and
  fees
- **Financial Reporting** - Export detailed financial reports for accounting
  purposes

### **Event Performance Metrics**

- **Registration Velocity** - Track registration patterns (early bird vs
  last-minute signups)
- **Capacity Utilization** - Historical capacity achievement rates across events
- **Waiting List Conversion** - Success rates from waiting list to confirmed
  registration
- **Geographic Distribution** - Participant location analysis for targeted
  marketing
- **Event Type Analytics** - Performance comparison across different event
  categories

### **User Behavior Insights**

- **Registration Funnel Analysis** - Identify drop-off points in registration
  process
- **Return User Rate** - Track loyalty metrics and repeat attendance patterns
- **User Engagement Scoring** - Platform activity and interaction measurements
- **Demographic Analysis** - Age groups, locations, and user preferences
  breakdown
- **Event Discovery Patterns** - How users find and select events

### **Administrative Efficiency**

- **Processing Time Metrics** - Track admin task completion times
- **Payment Reconciliation** - Automated matching of payments with registrations
- **Communication Effectiveness** - Email open rates and response metrics
- **System Performance** - Platform usage statistics and performance monitoring
- **Role Usage Analytics** - Track utilization of different permission levels

### **How It Works**

1. **Data Collection** - Automatic capture of all user interactions and
   transactions
2. **Real-time Processing** - Live dashboard updates with current metrics
3. **Historical Analysis** - Compare current performance with previous periods
4. **Export Capabilities** - Generate reports for external analysis and
   accounting
5. **Predictive Insights** - AI-powered recommendations for optimization

---

## **Admin & Moderation Panel**

### **User Management (Admin Only)**

- **User Search** - Search all users by name or email
- **Role Management** - Promote/demote users between USER, REGULAR, MODERATOR,
  ADMIN
- **User Information** - View all user details and registration history
- **Protected Admin** - Cannot demote the original admin account

### **Event Management (Admin/Moderator)**

- **Event Creation** - Create new events with all details
- **Event Editing** - Modify existing events
- **Event Duplication** - Clone events for recurring activities
- **Visibility Control** - Show/hide events from public view
- **Registration Management** - View all registrations with participant details

### **Registration Management (Admin/Moderator)**

- **Participant Lists** - View all registered participants with contact info
- **Manual Registration** - Add participants directly
- **Registration Editing** - Modify existing registrations
- **Registration Duplication** - Copy registrations to new events
- **Attendance Tracking** - Mark participants as attended/not attended
- **Payment Management** - Toggle payment status

### **Registration History (Admin Only)**

- **Complete Audit Trail** - View all registration actions across all events
- **Action Tracking** - Track registrations, unregistrations, waiting list
  movements
- **User Attribution** - See which admin performed which actions
- **Event Filtering** - Filter history by specific events
- **Timestamp Tracking** - Complete date/time stamps for all actions

### **How It Works**

1. **Admin Access** - Admin/moderator login redirects to admin dashboard
2. **Permission Checks** - System validates admin/moderator status for each
   action
3. **Management Operations** - Admins perform user and event management tasks
4. **Audit Trail** - All admin actions are logged in registration history

---

## **Email & Communication**

### **Automated Email System**

- **Registration Confirmation** - Sent immediately after successful registration
- **QR Code Inclusion** - Payment QR codes embedded in emails
- **Waiting List Promotion** - Automated emails when promoted from waiting list
- **Event Details** - Complete event information in all emails

### **Email Features**

- **Czech Localization** - All emails in Czech language
- **Professional Branding** - GameOn Baby branding and styling
- **Contact Information** - Instagram and Facebook links included
- **Responsive Design** - Mobile-friendly email templates
- **Error Handling** - Fallback systems for email delivery issues

### **Email Templates**

- **Registration Confirmation** - Welcome message with event details and QR code
- **Waiting List Promotion** - Notification of promotion with new QR code
- **Branded Design** - Consistent branding across all communications

### **How It Works**

1. **Registration Trigger** - Email automatically sent after successful
   registration
2. **QR Code Generation** - Payment QR code generated and embedded
3. **Template Processing** - Event details populated in email template
4. **Email Delivery** - Sent via Resend service to user's email address

---

## **Registration History & Audit**

### **Complete Audit Trail**

- **Action Logging** - Every registration action is logged with timestamp
- **User Attribution** - Track which user (or admin) performed each action
- **Event Association** - Link all actions to specific events
- **Action Types** - Detailed categorization of all possible actions

### **Tracked Actions**

- **REGISTERED** - New registration created
- **UNREGISTERED** - User cancelled registration
- **MOVED_TO_WAITLIST** - Registration moved to waiting list
- **MOVED_FROM_WAITLIST** - Promoted from waiting list to registered
- **DELETED_BY_MODERATOR** - Admin/moderator deleted registration
- **REACTIVATED** - Deleted registration restored
- **EVENT_CREATED** - New event created
- **EVENT_UPDATED** - Event details modified
- **EVENT_DELETED** - Event removed

### **History Features**

- **Pagination** - Handle large history datasets efficiently
- **Event Filtering** - Filter history by specific events
- **Admin Dashboard** - Complete history view for administrators
- **Data Retention** - Permanent storage of all historical data

### **How It Works**

1. **Action Occurs** - Any registration-related action triggers history logging
2. **Data Collection** - System captures user, event, action type, and timestamp
3. **Storage** - Information stored in dedicated RegistrationHistory table
4. **Admin Access** - Administrators can view complete history through admin
   panel

---

## **User Interface & Experience**

### **Responsive Design**

- **Mobile-First** - Optimized for mobile devices
- **Desktop Support** - Full desktop functionality
- **Touch-Friendly** - Mobile-optimized buttons and interactions
- **Responsive Layouts** - Adaptive layouts for all screen sizes

### **Modern UI Components**

- **Gradient Backgrounds** - Purple gradient theme throughout
- **Card-Based Design** - Modern card layouts for events and forms
- **Progress Indicators** - Visual capacity indicators
- **Interactive Buttons** - Hover effects and processing states
- **Modal Dialogs** - Professional modal windows

### **Navigation & User Flow**

- **Intuitive Navigation** - Clear navigation with role-based menus
- **Breadcrumbs** - Easy navigation between pages
- **Success/Error Messages** - Clear feedback for all user actions
- **Loading States** - Visual feedback during processing

### **Accessibility**

- **Form Validation** - Clear error messages and validation
- **Keyboard Navigation** - Full keyboard accessibility
- **Screen Reader Support** - Semantic HTML structure
- **Color Contrast** - High contrast for readability

### **How It Works**

1. **User Visits Site** - Responsive design adapts to device
2. **Navigation** - Role-based menu shows appropriate options
3. **User Actions** - Clear feedback provided for all interactions
4. **Error Handling** - Graceful error messages and recovery options

---

## **Technical Features**

### **Technology Stack**

- **Next.js 15+** - Modern React framework with App Router and Server Components
- **React 19** - Latest React features and optimizations
- **Bun Runtime** - High-performance JavaScript runtime
- **TypeScript** - Type-safe development with strict mode
- **Prisma ORM** - Database management with PostgreSQL
- **Tailwind CSS** - Utility-first styling with CSS variables
- **Zustand** - State management
- **React Hook Form** - Form handling with Zod validation
- **Kinde Auth** - Authentication service
- **Resend** - Email delivery service
- **next-intl** - Internationalization for Slovak/Czech/English

### **Development Features**

- **ESLint & TypeScript** - Code quality and type safety
- **Prettier** - Code formatting
- **Database Migrations** - Version-controlled database changes
- **Environment Configuration** - Separate dev/production settings
- **Build Optimization** - Production-ready builds

### **Performance Features**

- **Server-Side Rendering** - Fast initial page loads
- **Database Optimization** - Efficient queries with proper indexing
- **Real-time Updates** - Automatic data refresh every 10 seconds
- **Caching** - Optimized data fetching and caching
- **Code Splitting** - Optimized bundle sizes

### **Security Features**

- **Role-Based Access Control** - Secure permission system
- **Input Validation** - Server and client-side validation
- **CSRF Protection** - Built-in security measures
- **Secure Authentication** - OAuth-based authentication
- **Data Sanitization** - Protection against injection attacks

### **Deployment & Operations**

- **Vercel Deployment** - Production deployment on Vercel
- **Environment Detection** - Automatic dev/production configuration
- **Database Management** - PostgreSQL with connection pooling
- **Error Monitoring** - Production error tracking
- **Performance Monitoring** - Application performance insights

---

## **Usage Examples**

### **For Regular Users**

1. **Register for Event**: Browse events → Click event → Fill registration form
   → Receive QR code
2. **Join Waiting List**: When event is full, automatically placed on waiting
   list
3. **Check Status**: Visit event page to see registration status
4. **Manage Profile**: Update name, phone, and payment preferences

### **For Moderators**

1. **View Participants**: Access participant lists with contact information
2. **Manage Events**: Create, edit, and duplicate events
3. **Manual Registration**: Add participants directly to events
4. **Payment Tracking**: Mark payments as received

### **For Admins**

1. **User Management**: Search users and manage roles
2. **Complete Event Control**: Full event management capabilities
3. **Registration History**: View complete audit trail
4. **System Administration**: Manage all aspects of the platform

This comprehensive event management platform is specifically designed for the
Slovak/Czech markets, providing a complete solution for workshops, seminars,
conferences, meetups, and various events with advanced QR code payment
integration, dynamic role management, and comprehensive analytics capabilities.
