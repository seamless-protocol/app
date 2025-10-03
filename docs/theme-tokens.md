Theme & Color Guidelines

Purpose
- Establish a single, explicit way to apply colors and theme semantics across the app, aligned with the designer’s token list.

Source of Truth
- Tokens live in light (:root) and dark (.dark) in src/index.css.
- Do not invent new tokens. If a use‑case is missing, request it from design.

Core Tokens (examples)
- Surfaces: --bg-hero, --surface-card, --surface-elevated, --surface-super, --divider, --overlay-backdrop
- Text: --text-primary, --text-secondary, --text-muted
- Brand: --brand-primary, --brand-secondary (purple), --brand-tertiary, --accent-1, --accent-2
- CTA: --cta-*
- Status: --state-*-bg, --state-*-text

Tailwind Utilities (preferred)
- Backgrounds: bg-background, bg-card, bg-accent, bg-secondary
- Text: text-foreground, text-secondary-foreground, text-muted-foreground
- Borders: border-border
- Inputs/Popovers: bg-input, bg-popover, text-popover-foreground
- Sidebar: bg-sidebar, text-sidebar-foreground

Explicit Brand Utilities
- Use these instead of raw Tailwind colors for clarity.
- text-brand-purple → var(--brand-purple) [alias of --brand-secondary]
- border-brand-purple → var(--brand-purple)
- hover:border-brand-purple (utility provided)
- group-hover:text-brand-purple (utility provided)

When To Use Bracketed var(...)
- Only when there’s no semantic Tailwind utility (e.g., overlay/backdrop, certain tag/status tokens, or one‑off component overrides).
- Examples: bg-[var(--overlay-backdrop)], text-[var(--tag-warning-text)].

Surfaces & Contrast
- Page background: bg-background (maps to --bg-hero)
- Panels/cards: bg-card (maps to --surface-card)
- Secondary/elevated rows or hover states: bg-accent (maps to --surface-elevated)
- Borders: border-border (maps to --divider)

Text
- Primary body or headings: text-foreground
- Secondary labels (helper text, metadata): text-secondary-foreground
- Muted (least prominent): text-muted-foreground

Navbar Semantics (current)
- Container: bg-card border-border
- Item default: bg-card border-border, title text-foreground, description text-foreground/85, icon text-secondary-foreground
- Item hover: bg-accent, hover:border-brand-purple, group-hover:text-brand-purple allowed for icon
- Item active: bg-accent, border-brand-purple, title/description text-foreground, icon text-brand-purple
- Focus: use default focus ring utilities

Modals & Overlays
- Dialog overlay: bg-[var(--overlay-backdrop)]
- RainbowKit modal: token-based per theme (see [data-rk] block in src/index.css)

Do / Don’t
- Do: use bg-card/text-foreground/border-border for panels by default
- Do: use bg-accent for hover/elevation; avoid color-mix for base surfaces
- Don’t: hardcode hex colors in components
- Don’t: use Tailwind default purple/violet tokens directly; use brand utilities

Requests to Design (open items)
- Confirm navbar hover vs active behaviors (background and border intensities)
- Confirm icon accent on active (brand vs foreground)


Design Questions To Confirm (for sign-off)
- Leverage card hover: none vs elevation (bg-accent) vs border vs both; if border, brand-purple or divider-strong?
- Leverage card active/pressed: change background/border or focus ring only?
- Use of drop-shadows on cards: allowed or avoid entirely?
- Sidebar nav: confirm default icon tone (secondary vs muted), active icon brand accent, and whether titles should ever be non-foreground.
- Top bar surface: bg-card vs elevated; keep subtle blur?
- Selected list rows (non-card pills): background token and border behavior.
- Brand usage: where brand-purple must not be used (e.g., titles), and where it is preferred (icons, borders, active indicators).
- Light mode checks: verify hero/card contrast values and hover states equivalent to dark theme.

Decision Log (implemented)
- Panels use bg-card; hover uses bg-accent; removed color-mix from panels for consistent contrast.
- Sidebar nav uses only designer tokens via Tailwind utilities; removed ad‑hoc nav variables in components.
- Active brand usage is explicit: text-brand-purple, border-brand-purple (token-based utilities added).
- Modal overlay uses --overlay-backdrop; RainbowKit modal colors are theme-aware and token-based.
- Tailwind palette remap retained, but we prefer explicit brand utilities to avoid confusion.

Tracking
- Keep this list updated as we get answers; reflect decisions directly as tokens/utilities in src/index.css and component classes.
