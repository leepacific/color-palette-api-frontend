# Constraints — color-palette-api frontend

## Hard constraints (non-negotiable)

### From Anti-AI Doctrine (hard-block)
- 1.1 No centered "Title + Subtitle + CTA button" hero
- 1.2 No equal 3-col card grids (≥1 variation required)
- 1.3 No identical padding on consecutive sections (≥1 full-bleed)
- 1.5 English + Korean vocabulary blacklist grep clean
- 1.6 No Lorem Ipsum / placeholder text
- 1.7 No gray placeholder images
- 1.11 No 4-col equal footer + social icons + copyright
- 1.12 No fake "as featured in" social proof
- 2.1 Every page has ≥1 grid-breaking element
- 2.3 All data-dependent components implement 4 states (default/empty/loading/error)
- 2.4 All interactive elements implement 4 states (default/hover/active/focus-visible)
- 2.6 Color system: min secondary + accent + neutral + semantic (success/warning/error/info)

### From Self-ness Doctrine (design_philosophy_mode: on)
- 10-step narrative flow must complete with 공명 확인 1 + 2 passing
- No "borrowed charm" (tool must stand without relying on stock photography, influencer testimonials, or trendy buzzwords)
- Observer restoration: never make the developer feel deficient

### From Board Chairman frontend brief (load-bearing)
- Monospace everywhere (JetBrains Mono / IBM Plex Mono for numerals, hex, labels)
- Terminal/IDE visual language
- Dark mode default
- Keyboard-first (vim-style shortcuts)
- JSON-like live sidebar
- Hex + oklch + hsl simultaneously (no toggling)
- Hex/code values are copy-clickable with feedback
- NOT a designer tool — developer/student focus

### From backend contract (frozen Sprint 5)
- Stripe-style envelope `{object, id, createdAt, ...flattened}`
- camelCase everywhere EXCEPT `error.type` (snake_case — intentional Stripe convention)
- Request-Id header sent + echoed
- Idempotency-Key header on user-initiated POSTs (`/palette/generate`, `/palette/lock`)
- 8 error types with type-specific UX actions (see frontend-handoff.md §6)

## Soft constraints (document if violated)

- 1.4 Avoid purple-blue gradient unless design-language-report justifies
- 1.9 Avoid Inter-alone (brutalist direction satisfies this with monospace primary)
- 1.10 No bounce easing > cubic-bezier(.68,-.55,.27,1.55)
- 2.2 ≥1 micro-detail per page
- 2.7 Typography: ≥2 fonts OR 1 variable font with ≥2 weights

## Out of scope (Sprint 1)

- Firebase auth / user accounts UI
- Pro tier payment
- Mobile-native app
- Palette history database (localStorage only)
- Admin panel
- i18n (English only)

## Blocking unknowns

See `ignorance-map.md` §U1 (API key auth failure) and §U2 (Sprint 6 endpoints not deployed).
