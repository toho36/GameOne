## GameOne Design System (Mobile-first)

### 1) Principles

- Mobile-first for 360–420px; thumb-friendly targets (≥44px), 8px spacing
- Progressive disclosure; clear hierarchy and primary CTAs
- Performance: <3s FCP on 3G, <1s subsequent navigation; CSS-only animations
  ≤150ms
- WCAG 2.1 AA compliance across colors, focus, semantics, keyboard

### 2) Color System

- Primary (brand): #155EEF (HSL 221 88% 53%)
- Accent: #00C2A8 (HSL 172 100% 38%)
- Neutrals: custom 50–900 scale via CSS vars (see tokens)
- Semantic: Success, Warning, Error, Info with foreground companions
- Shadcn variables are consumed via `var(--*)` in Tailwind (see Tailwind config)

Example tokens (light theme) — see src/styles/globals.css:

- --primary: hsl(221 88% 53%); --primary-foreground: hsl(0 0% 100%)
- --accent: hsl(172 100% 38%); --accent-foreground: hsl(210 20% 12%)
- --success: oklch(0.72 0.14 143); --success-foreground: oklch(1 0 0)
- --warning: oklch(0.87 0.14 78); --warning-foreground: oklch(0.24 0.02 260)
- --info: oklch(0.77 0.12 236); --info-foreground: oklch(0.2 0.02 260)
- --error: oklch(0.62 0.22 25); --error-foreground: oklch(1 0 0)
- --neutral-50 … --neutral-900 defined for grayscale

Usage

- Backgrounds: bg-primary, bg-accent, bg-success, bg-warning, bg-info,
  bg-destructive|bg-error
- Text: text-primary-foreground etc.
- Border/focus: ring, border use the new tokens automatically

Contrast

- All text-on-bg combinations above meet or exceed 4.5:1 in light/dark themes

### 3) Typography

- System stack, 16px base:
  `ui-sans-serif, -apple-system, Segoe UI, Roboto, Inter, sans-serif`
- Heading scale (approx): H1 30–32, H2 24, H3 20, H4 18, Body 16, Small 14,
  Caption 12
- Line-height: 1.3–1.5; letter-spacing as in globals.css

### 4) Spacing, Radius, Shadow

- 8px baseline grid; spacing 4/8/12/16/24/32/48/64
- Radius: 8px (var(--radius) = 0.5rem); cards/buttons follow Tailwind radii
- Shadows subtle; use tokens in globals.css; avoid heavy drop shadows

### 5) Iconography

- 24px outline icons (Lucide); consistent stroke width; semantic, accessible
  labels

### 6) Components (shadcn/ui compatible)

- Button: sizes sm/md/lg (min height ≥44px), variants
  default/outline/ghost/destructive
- Input/Textarea: single-column mobile forms; inline validation; clear labels
  and descriptions
- Card: padded, tappable sections; use bg-card and text tokens
- Sheet (Bottom Sheet on mobile): event details and secondary content
- Dialog: confirmations and critical steps
- Toast: transient feedback; status colors map to semantic tokens
- Navigation: Bottom tab bar on mobile; Sidebar on desktop

States & Feedback

- Loading: skeletons or spinner (≤150ms animations)
- Error: use error tokens, inline messages, retry affordances
- Empty: dedicated empty states with CTA

### 7) Motion

- Use tailwindcss-animate and custom classes in globals.css
- Durations ≤150ms; easing ease-out for entrance, ease-in for exit

### 8) Internationalization

- All user-visible strings via next-intl (en/cs catalogs)
- Locale-aware Link and date/number formatting

### 9) Performance Guidelines

- Defer heavy assets; compress images; prefer SVG for icons
- Reduce reflows; use CSS for micro-interactions; cache via React Query

### 10) Implementation Pointers

- Tailwind color mapping uses `var(--token)` (not hsl wrapper) for flexibility
- Added semantic colors + neutral scale in globals.css
- Added xs breakpoint (360px) for small phones
