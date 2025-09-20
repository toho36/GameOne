## Mobile-first Wireframes (ASCII)

Legend: [ ] tap target ≥44px; (…) truncated; ⌄ sheet; ⓘ info

1. Event Discovery / Home

+--------------------------------------------------+ | GameOne | | [Search…]
[Filter] | | | | ┌ Card: Event | | | Title [Date • City] | | | Short desc… | | |
[Details] [Register] | | └───────────────────────────────────────────────| |
(repeat list; infinite scroll) | | | | ⎯⎯⎯⎯ Bottom Tabs ⎯⎯⎯⎯ | | [Home] [My
Events] [Scan] [Payments] [Profile] |
+--------------------------------------------------+

2. Event Detail (Bottom Sheet preferred on mobile)

+--------------------------------------------------+ | Map/hero image | | [↑]
Event Title | | Date • Venue • Price | | Host | | Description… | | [Register
Now] [Share] | +--------------------------------------------------+

or as Bottom Sheet: ┌────────────── Sheet (drag handle) ──────────────┐ │ Title
• Date • Venue │ │ Description… │ │ [Register Now] [Add to Calendar] │
└─────────────────────────────────────────────────┘

3. Registration Flow (3 steps max)

Step 1: Details +--------------------------------------------------+ | Name
[__________] | | Email [__________] | | Guests [ - 1 + ] | | [Continue] |
+--------------------------------------------------+

Step 2: Review & Payment Method
+--------------------------------------------------+ | Summary (items, total) |
| Method: [ Apple Pay ] [ Card ] [ Bank ] | | [Pay & Register] |
+--------------------------------------------------+

Step 3: Confirmation +--------------------------------------------------+ | ✅
Registered | | QR Code [ ███ ] | | Details sent to email | | [Done] [Add to
Wallet] | +--------------------------------------------------+

4. Organizer Dashboard (My Events)

+--------------------------------------------------+ | [Create Event] | | Tabs:
[Upcoming] [Past] | | Card: Title • Date • Reg: 42/100 | | [Manage] [Export] |
+--------------------------------------------------+

5. Payment Status / History

+--------------------------------------------------+ | Current: Pending
Verification | | Last payments: | | • Event A — Paid — 2025-06-01 | | • Event B
— Refunded — 2025-05-10 | +--------------------------------------------------+

6. Profile / Settings

+--------------------------------------------------+ | Avatar Name | | Email | |
Language [ English ⌄ ] | | Notifications [ On/Off ] | | Sign out |
+--------------------------------------------------+

7. Admin Approval Interface

+--------------------------------------------------+ | Tabs: [Pending]
[Approved] [Rejected] | | Row: Name • Event • Payment • Submitted | | [Approve]
[Deny] [View] | | Filters: Event ⌄ Status ⌄ Date ⌄ |
+--------------------------------------------------+
