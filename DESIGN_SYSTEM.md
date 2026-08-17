# Design System

A cohesive, professional design system for Yucha. Built from design tokens and reusable component patterns — no magic numbers, no duplication, everything traceable.

## Overview

The design system is organized into three CSS files:

1. **`design-tokens.css`** — All design values (colors, typography, spacing, shadows, transitions). Single source of truth.
2. **`components.css`** — Reusable component patterns (buttons, cards, inputs, alerts). Built from tokens.
3. **`utilities.css`** — Utility classes for common layout/spacing patterns. Optional but useful.

All three are imported in `index.css` in order.

## Design Philosophy

**Bright & Forward-Looking.** The app celebrates awareness and habit formation, not guilt. Colors are energetic and positive. Spacing is generous. Typography is clear and confident.

**Professional & Maintainable.** Every style is derived from a token. Components follow consistent patterns. When something changes (a color, a spacing value), there's one place to update it.

## Color Palette

### Primary Actions
- **Primary (`--color-primary`)**: `#00D4FF` — Vibrant teal. Used for CTAs, highlights, focus states.
- **Primary Dark**: `#0099CC` — Hover state for primary buttons.
- **Primary Light**: `#33E0FF` — Alternative, softer variant.
- **Primary Wash**: `rgba(0, 212, 255, 0.08)` — Background tint for alert/info boxes.

### Growth & Success
- **Success (`--color-success`)**: `#39FF14` — Bright lime. Used for wins, savings, redirected spending.
- **Success Dark**: `#2CC60F` — Hover state.
- **Success Wash**: `rgba(57, 255, 20, 0.08)` — Background tint.

### Learning & Insights
- **Accent (`--color-accent`)**: `#FF6B35` — Warm coral. Used for insights, learning moments, warnings.
- **Accent Dark**: `#DD5A28` — Hover state.
- **Accent Wash**: `rgba(255, 107, 53, 0.08)` — Background tint.

### Neutrals
- **Text Primary (`--color-text-primary`)**: `#1A1A2E` — Deep charcoal. Main text.
- **Text Secondary (`--color-text-secondary`)**: `#52514E` — Muted. Supporting text.
- **Text Muted (`--color-text-muted`)**: `#898781` — Very muted. Labels, hints.

- **Surface 1 (`--color-surface-1`)**: `#FCFCFB` — Light gray. Cards, panels.
- **Surface 2 (`--color-surface-2`)**: `#F8F9FA` — Slightly darker. Hover states, table headers.
- **Surface 3 (`--color-surface-3`)**: `#F1F2F4` — Even darker. Disabled states.
- **Page (`--color-page`)**: `#FFFFFF` — Pure white. Main background.

- **Border (`--color-border`)**: `#E5E7EB` — Light gray. Standard borders.
- **Border Subtle (`--color-border-subtle`)**: `#EAEAEB` — Very light. Soft dividers.

### Status
- **Critical (`--color-critical`)**: `#D03B3B` — Red. Errors, deletions, warnings.
- **Warning (`--color-warning`)**: `#FF9500` — Orange. Cautions, alerts.

### Categorical Series (CVD-validated)
Eight colors for data visualization, in order: `--series-1` through `--series-8`. Used in allocation charts and category breakdowns.

## Typography

### Font Family
- **Sans (`--font-family-sans`)**: `system-ui, 'Segoe UI', Roboto, sans-serif` — Body text, UI labels.
- **Mono (`--font-family-mono`)**: `'Monaco', 'Courier New', monospace` — Code, fixed-width data.

### Font Sizes
- **xs**: `12px` — Labels, captions, hints.
- **sm**: `14px` — Body text, secondary labels.
- **base**: `16px` — Default body text.
- **lg**: `18px` — Section introductions.
- **xl**: `20px` — Subheadings.
- **2xl**: `24px` — Headings.
- **3xl**: `32px` — Page titles.

### Font Weights
- **Regular** (`400`): Body text, defaults.
- **Medium** (`500`): Labels, UI text, lighter emphasis.
- **Semibold** (`600`): Strong emphasis, stat values.
- **Bold** (`700`): Headings, hero numbers.

### Line Height
- **Tight** (`130%`): Headings, compact labels.
- **Normal** (`145%`): Default body text.
- **Relaxed** (`160%`): Long-form content, accessibility.

## Spacing

All values on a 4px base:
- **xs** (`4px`), **sm** (`8px`), **md** (`12px`), **lg** (`16px`), **xl** (`20px`), **2xl** (`24px`), **3xl** (`32px`), **4xl** (`40px`)

Use these exclusively. No magic numbers.

## Sizing

Button/icon sizes:
- **xs** (`24px`), **sm** (`32px`), **md** (`40px`), **lg** (`48px`)

## Radius (Border Radius)

- **sm** (`4px`): Subtle, buttons with small padding.
- **md** (`8px`): Default for inputs, small cards.
- **lg** (`12px`): Standard for cards, modals.
- **xl** (`16px`): Large panels, hero elements.
- **full** (`9999px`): Pills, badges.

## Shadows

From subtle to bold:
- **sm**: `0 1px 2px rgba(0, 0, 0, 0.05)` — Minimal, almost imperceptible.
- **md**: `0 4px 6px rgba(0, 0, 0, 0.1)` — Default for lifted elements.
- **lg**: `0 10px 15px rgba(0, 0, 0, 0.1)` — Modals, overlays.
- **xl**: `0 20px 25px rgba(0, 0, 0, 0.1)` — Prominent, rare.

## Transitions

- **Fast** (`150ms`): Micro-interactions (hover, focus).
- **Base** (`200ms`): Standard transitions (fade, slide).
- **Slow** (`300ms`): Intentional, prominent changes.

All use `cubic-bezier(0.4, 0, 0.2, 1)` (Material's easing).

## Component Patterns

### Buttons

**Classes**: `.btn`, `.btn--primary`, `.btn--secondary`, `.btn--success`, `.btn--danger`

**Sizes**: `.btn--sm`, `.btn--lg`

**States**: `:hover`, `:disabled`, `:focus`

```html
<button class="btn btn--primary">Primary action</button>
<button class="btn btn--secondary">Secondary action</button>
<button class="btn btn--success btn--sm">Small success</button>
```

### Cards

**Classes**: `.card`, `.card--compact`, `.card--accent`

```html
<div class="card">
  <h2>Card Title</h2>
  <p>Card content...</p>
</div>

<div class="card card--accent">
  <p>Highlighted information</p>
</div>
```

### Input Groups

**Classes**: `.input-group`, `.input-group__label`, `.input-group__input`, `.input-group__textarea`

```html
<div class="input-group">
  <label class="input-group__label" for="name">Name</label>
  <input class="input-group__input" id="name" type="text" />
</div>
```

### Stat Tiles

**Classes**: `.stat`, `.stat--horizontal`, `.stat__label`, `.stat__value`, `.stat__value--success`, `.stat__change`

```html
<div class="stat">
  <span class="stat__label">Monthly spending</span>
  <strong class="stat__value">$1,245.50</strong>
</div>

<div class="stat stat--horizontal">
  <div>
    <span class="stat__label">Growth</span>
    <strong class="stat__value stat__value--success">+$5,234</strong>
  </div>
</div>
```

### Alerts / Banners

**Classes**: `.alert`, `.alert--info`, `.alert--success`, `.alert--warning`, `.alert--critical`

```html
<div class="alert alert--info">
  <p>Here's something useful to know.</p>
  <button class="alert__close" type="button">&times;</button>
</div>
```

### Tables

**Classes**: `.table`

```html
<table class="table">
  <thead>
    <tr>
      <th>Category</th>
      <th>Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Food</td>
      <td>$245</td>
    </tr>
  </tbody>
</table>
```

### Badges

**Classes**: `.badge`, `.badge--primary`, `.badge--success`, `.badge--critical`

```html
<span class="badge badge--success">Saved $50</span>
```

## Utility Classes

Common patterns without writing CSS:

### Flexbox
- `.flex`, `.flex-col`, `.flex-row`, `.flex-wrap`
- `.gap-sm`, `.gap-md`, `.gap-lg`
- `.items-center`, `.items-start`, `.justify-between`

### Spacing
- `.p-md`, `.px-lg`, `.py-sm` (padding)
- `.m-lg`, `.mt-md`, `.mb-lg` (margin)

### Typography
- `.text-sm`, `.text-xl`, `.text-2xl`
- `.font-bold`, `.font-medium`
- `.text-primary`, `.text-secondary`, `.text-muted`
- `.text-success`, `.text-critical`

### Background & Border
- `.bg-surface`, `.bg-primary-wash`
- `.border`, `.border-top`, `.border-bottom`
- `.rounded-md`, `.rounded-lg`

### Sizing
- `.w-full`, `.max-w-container`

See `utilities.css` for the full list.

## Dark Mode

All tokens automatically switch for `prefers-color-scheme: dark`. No changes needed in component CSS — tokens handle it.

To test: open DevTools → Rendering → Emulate CSS media feature `prefers-color-scheme` → dark.

## Adding a New Component

1. Write the component structure in React (or HTML).
2. Create a `.css` file for it (e.g., `NewComponent.css`).
3. Import the file in the component.
4. **Use tokens and utility classes first**. Only write custom CSS if the pattern isn't available.
5. If creating a new reusable pattern, add it to `components.css` so others can reuse it.

Example:

```tsx
import './MyComponent.css'

export function MyComponent() {
  return (
    <div className="my-component">
      <button className="btn btn--primary">Click me</button>
    </div>
  )
}
```

```css
/* MyComponent.css */
.my-component {
  padding: var(--space-2xl);
  background: var(--color-surface-1);
  border-radius: var(--radius-lg);
}
```

## Responsive Design

Mobile-first approach:
- Default styles are mobile.
- Breakpoints via media queries.
- Common breakpoints: `768px` (tablet), `1024px` (desktop).

Grid utilities auto-collapse on mobile:
- `.grid-cols-2` → 1 column on mobile, 2 on desktop.
- `.grid-cols-3` → 2 columns on mobile, 3 on desktop.

## Accessibility

- **Color contrast**: All text meets AA standard (4.5:1 for normal, 3:1 for large).
- **Focus states**: All interactive elements have visible `:focus` styles.
- **Touch targets**: Buttons and inputs are at least 44×44px.
- **Keyboard navigation**: All controls are keyboard-accessible.
- **Semantic HTML**: Use proper heading levels, labels, alt text.

## When to Extend

**Tokens**: Add if it's a value that repeats 2+ times or is part of the system (new color, new spacing size).

**Components**: Add if it's a UI pattern that will be reused across multiple component files.

**Utilities**: Add if it's a common layout or spacing pattern that's applied frequently.

**Never**: Hardcode colors, spacing, or font sizes. Everything should reference a token.

## Checklist for New Features

- [ ] All colors from `design-tokens.css`
- [ ] All spacing from `--space-*` tokens
- [ ] All typography from `--font-*` tokens
- [ ] Reusable components extracted to `components.css`
- [ ] Focus states and hover states defined
- [ ] Dark mode tested
- [ ] Responsive behavior (mobile/tablet/desktop)
- [ ] Accessibility (color contrast, focus, keyboard)

## Files

- `src/design-tokens.css` — Design tokens
- `src/components.css` — Component patterns
- `src/utilities.css` — Utility classes
- `src/index.css` — Root styles (imports the above)
- `src/App.css` — App layout (top-level structure)
- `src/components/*.css` — Individual component styles (use tokens + patterns)
