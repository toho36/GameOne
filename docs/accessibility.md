## Accessibility Implementation Guide (WCAG 2.1 AA)

### Core

- Semantic HTML first; roles only when necessary
- Color contrast ≥ 4.5:1 for text; ≥ 3:1 for UI components
- Keyboard: All interactive controls reachable via Tab/Shift+Tab
- Visible focus ring: use `.focus-ring` utility

### Patterns

- Navigation
  - Bottom tabs: <nav role="navigation" aria-label="Primary">
  - Active tab has `aria-current="page"`
- Dialog
  - role="dialog" aria-modal="true"; focus trapped; Esc closes
  - Initial focus on primary action; return focus to trigger on close
- Sheet (Bottom Sheet)
  - role="dialog"; provide drag handle name (aria-label)
  - Prevent background scroll; support swipe-to-close with keyboard alternative
- Toasts
  - aria-live="polite" region; avoid stealing focus
  - Provide text labels (no icon-only)
- Forms
  - <label for=...> bound inputs; use aria-describedby for help/error text
  - Inline validation announced via aria-live regions
  - Error summary at top for multi-step forms
- Tables (admin)
  - <table> with <thead>, <th scope="col">; row actions have descriptive labels

### Media

- Images require alt text; decorative images `alt=""`
- Icons must have aria-hidden or labeled controls

### Motion

- Respect prefers-reduced-motion; avoid parallax; keep animations ≤150ms

### Internationalization

- lang attribute on html via Next.js i18n routing; use next-intl for text
- Avoid concatenating translated strings; use ICU messages

### Testing

- Use @testing-library with user flows; add aXe/Storybook a11y checks if
  available
- Keyboard testing and screen reader smoke tests for critical flows
