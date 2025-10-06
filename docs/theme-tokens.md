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

Additional Surfaces
- Muted highlight: bg-muted (use for subtle highlights and secondary content backgrounds such as FAQ answers, chart wrappers, and non-interactive highlights)

Explicit Brand Utilities
- Use these instead of raw Tailwind colors for clarity.
- text-brand-purple → var(--brand-purple) [alias of --brand-secondary]
- bg-brand-purple → var(--brand-purple)
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
- Subtle highlight surfaces (non-interactive): bg-muted (maps to --surface-super)
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

Status/Alerts/Badges
- Alerts: use tag-* design tokens for info/success/warning/error (bg/text), and let icons inherit currentColor. Descriptions inherit container color for readability.
- Badges: use semantic variants success/warning/error/info/brand (tokens provided). Prefer Badge component variants over ad-hoc colors.
- Error displays: severity drives background/icon tone (warning/info/error) consistently across ErrorDisplay and ErrorStep.
- Destructive actions: use the destructive/destructive-foreground tokens (e.g., disconnect buttons).

Do / Don’t
- Do: use bg-card/text-foreground/border-border for panels by default
- Do: use bg-accent for hover/elevation; avoid color-mix for base surfaces
- Do: use bg-muted for subtle, non-interactive highlights (not hover)
- Don’t: hardcode hex colors in components
- Don’t: use Tailwind default purple/violet tokens directly; use brand utilities
- Don’t: add hover states to non-interactive cards (e.g., StatCard)

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
- Chart controls: confirm selected state styling where brand background (bg-brand-purple) is used for emphasis.

Decision Log (implemented)
- Panels use bg-card; hover uses bg-accent; removed color-mix from panels for consistent contrast.
- Sidebar nav uses only designer tokens via Tailwind utilities; removed ad‑hoc nav variables in components.
- Active brand usage is explicit: text-brand-purple, border-brand-purple (token-based utilities added).
- Modal overlay uses --overlay-backdrop; RainbowKit modal colors are theme-aware and token-based.
- Tailwind palette remap retained, but we prefer explicit brand utilities to avoid confusion.
- Alerts migrated to tag-* tokens with icons inheriting currentColor; descriptions inherit container color.
- Added semantic Badge variants (success/warning/error/info/brand) and applied across components.
- Error surfaces/icons use severity tokens consistently (warning/info/error) across ErrorDisplay and ErrorStep.
- bg-brand-purple utility available and used for selected states in chart timeframe controls.
- Secondary tiles/cards use bg-accent; subtle highlights use bg-muted on token pages and FAQs.
- Non-interactive StatCards no longer have hover states.

Tracking
- Keep this list updated as we get answers; reflect decisions directly as tokens/utilities in src/index.css and component classes.
