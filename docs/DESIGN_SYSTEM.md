# Design System

Yucha's visual language is defined in `src/design-tokens.css` and organized in three layers: tokens (the values), component patterns (reusable styles), and utilities (layout helpers).

## Design Tokens (`src/design-tokens.css`)

All design values are centralized as CSS custom properties. When the user says "make the primary color brighter," there's one place to change it.

### Color Palette

**Primary (Warm Yellow/Gold)**: `#f4a600`
- `--color-primary`: Base warm gold for CTAs, focus states, primary navigation
- `--color-primary-dark`: `#d68f00` for hover/pressed states
- `--color-primary-light`: `#ffc233` for lighter backgrounds
- `--color-primary-wash`: `rgba(244, 166, 0, 0.08)` for focus rings and subtle highlights

**Success (Lime Green)**: `#39ff14`
- `--color-success`: Positive action, redirected spending, growth
- `--color-success-dark`: Hover state
- `--color-success-light`: Lighter variant
- `--color-success-wash`: Subtle background

**Accent (Complementary Gold)**: Same as primary (used interchangeably for visual hierarchy)

**Supporting Colors** (used sparingly in charts and illustrations):
- Purple, Pink, Blue, Orange, Green, Yellow (see `src/lib/colors.ts` for the full palette)

**Categorical Series** (CVD-validated):
Eight hues for chart data series, validated for color-blindness safety using the dataviz skill's palette validator. When a chart has more than 8 series, extras fold into `--series-other` (muted gray) rather than cycling colors.

**Neutrals**:
- `--color-text-primary`: `#1a1a2e` (dark charcoal, primary text)
- `--color-text-secondary`: `#52514e` (secondary text)
- `--color-text-muted`: `#898781` (labels, hints, disabled text)
- `--color-text-inverse`: `#ffffff` (white text on dark backgrounds)
- `--color-surface-1`: `#fcfcfb` (light surface for cards, modals)
- `--color-surface-2`, `--color-surface-3`: Progressively darker for layering
- `--color-page`: `#ffffff` (page background)
- `--color-border`: `#e5e7eb` (standard border)
- `--color-border-subtle`: `#eaeaeb` (softer border)

**Status Colors**:
- `--color-critical`: `#d03b3b` (red, errors, serious warnings)
- `--color-warning`: `#ff9500` (orange, cautions)

### Typography

**Fonts**:
- `--font-family-sans`: System UI stack (system-ui, Segoe UI, Roboto, sans-serif) — no external font files needed
- `--font-family-mono`: Monaco, Courier New for code snippets

**Sizes** (12px to 64px):
- `--font-size-xs`: 12px (labels, small text)
- `--font-size-sm`: 14px (body text, UI labels)
- `--font-size-base`: 16px (standard body)
- `--font-size-lg`: 18px (slightly larger body)
- `--font-size-xl`: 20px (section headers)
- `--font-size-2xl`: 24px (subsection headers)
- `--font-size-3xl`: 32px (page title)
- `--font-size-4xl`: 48px (hero titles)
- `--font-size-5xl`: 64px (very large titles)

**Weights**:
- `--font-weight-regular`: 400 (body text)
- `--font-weight-medium`: 500 (labels, semibold UI)
- `--font-weight-semibold`: 600 (headings, buttons)
- `--font-weight-bold`: 700 (emphasis)

**Line Height**:
- `--line-height-tight`: 1.2 (headings)
- `--line-height-normal`: 1.5 (body text)
- `--line-height-relaxed`: 1.75 (long-form text)

### Spacing

**Scale** (4px base unit, multiples of 4):
- `--space-xs`: 4px (tight spacing)
- `--space-sm`: 8px (small gap)
- `--space-md`: 12px (default gap)
- `--space-lg`: 16px (comfortable gap)
- `--space-xl`: 24px (large gap)
- `--space-2xl`: 32px (very large gap)
- `--space-3xl`: 48px (massive gap)

Use these in flexbox gaps, padding, and margin for consistency.

### Shadows

- `--shadow-sm`: `0 1px 2px rgba(26, 26, 46, 0.05)` (subtle shadow)
- `--shadow-md`: `0 4px 12px rgba(26, 26, 46, 0.1)` (card hover)
- `--shadow-lg`: `0 12px 32px rgba(26, 26, 46, 0.15)` (modal, popup)

### Borders & Radius

- `--radius-sm`: 4px (small corners)
- `--radius-md`: 8px (standard corners)
- `--radius-lg`: 12px (large corners, cards)

### Transitions

- `--transition-fast`: `150ms ease-out` (quick feedback)
- `--transition-base`: `200ms ease-out` (standard hover/state)
- `--transition-slow`: `300ms ease-out` (longer animations)

## Dark Mode

All tokens automatically swap for `prefers-color-scheme: dark` via a second `:root` block. No component-level CSS needed:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-text-primary: #e5e5e5;
    --color-page: #1a1a2e;
    /* ... rest of dark palette ... */
  }
}
```

Components simply use the token names; they adapt automatically.

## Component Patterns

Reusable component styles are organized in `src/components.css` by component type. Examples:

- `.btn`, `.btn--primary`, `.btn--secondary` — button variants
- `.card` — card container
- `.input-group` — form field wrapper
- `.stat` — metric display (label + value)
- `.alert` — alert box with status color
- `.badge` — small label

Each pattern is built from tokens, never hardcoding colors or spacing.

## Utilities

Layout helpers in `src/utilities.css`:

- `.flex`, `.flex-column` — flexbox shortcuts
- `.gap-sm`, `.gap-md`, `.gap-lg` — flexbox gaps
- `.p-md`, `.px-lg`, `.m-sm` — padding and margin
- `.text-center`, `.text-right` — text alignment
- `.text-muted`, `.text-primary` — text color shortcuts
- `.bg-surface-1`, `.bg-page` — background colors

Use sparingly for one-off layouts; prefer component-level CSS for reusable patterns.

## Implementation Notes

### When Adding a New Component

1. **Check if a pattern exists** in `components.css`. If yes, use it.
2. **If creating a new visual pattern**, define a `.component-name` class in `components.css`, built from tokens.
3. **Never hardcode colors or spacing**. Always reference a token.
4. **Dark mode is automatic**. Don't add a `@media` block in component CSS — the token swap handles it.
5. **Test in both light and dark**. The browser's dev tools can emulate `prefers-color-scheme`.

### Changing the Primary Color

Edit `--color-primary`, `--color-primary-dark`, `--color-primary-light`, and `--color-primary-wash` in one place (`src/design-tokens.css`). Every component that uses `var(--color-primary)` updates automatically.

### Adding a New Color to the Categorical Palette

1. Validate the new color against existing series using the dataviz skill's `validate_palette.js` script.
2. Add it as `--series-N` to the tokens.
3. Update `src/lib/colors.ts` to include it in the exported palette.
4. Assign it in order-dependent fashion (don't cycle or repeat).

### Backwards Compatibility

Old component CSS used root aliases like `--surface-1` and `--page`. These still work because the tokens define them. New components should use the full token names (e.g., `--color-surface-1`), but mixing is fine.
