## Responsive Behavior Specifications

### Breakpoints

- xs: 360px (small phones)
- sm: 640px
- md: 768px (tablet)
- lg: 1024px (desktop)
- xl: 1280px+

### Navigation

- Mobile (≤md): Bottom tab bar (5 primary destinations)
- Tablet (md): Bottom tabs persist; filters can persist inline
- Desktop (≥lg): Left sidebar + top bar (search/actions)

### Layout per Screen

1. Discovery/Home

- Mobile: 1-column list, 16px horizontal padding
- Tablet: 2-column grid of event cards, persistent filter column on the left
- Desktop: 3-column grid; sidebar nav; filters docked left (280px)

2. Event Detail

- Mobile: Bottom sheet or full screen; sticky CTA
- Tablet: 2-column: content + sticky summary/CTA
- Desktop: Content center column (max-w-2xl); right column for related

3. Registration Flow

- Mobile: Single column, 3 steps max, progress indicator on top
- Tablet: Can show review alongside form on step 2
- Desktop: Form (left) + Order summary (right)

4. Organizer Dashboard

- Mobile: Cards list with quick stats
- Tablet: 2-column cards; persistent filters
- Desktop: Table layout, toolbar, bulk actions

5. Payments

- Mobile: List with status chips
- Tablet: 2-column list; filters top
- Desktop: Table with sortable columns

6. Profile

- Mobile: Stacked sections (Account, Preferences)
- Tablet/Desktop: Two-column form layout

7. Admin Approval

- Mobile: Compact rows with swipe-to-approve/deny (optional)
- Tablet: Table with Approve/Deny buttons per row
- Desktop: Full data table + bulk approve/deny + export

### Density & Targets

- Tap targets ≥44x44px
- Spacing: 8/16/24 rhythm; increase density on desktop where appropriate

### Performance

- Lazy-load non-critical sections on desktop; keep mobile payload minimal
