# Architecture Overview

Yucha is a single-page, local-first financial planning app. This document explains how it's built, why each choice was made, and what to know for explaining it.

## Core Principles

**Local-First**: No backend, no network calls. All data lives in IndexedDB; the app works fully offline.

**No Financial Advice**: The app performs arithmetic on user-supplied assumptions (income, spending, return rates). It never recommends or guarantees.

**Credibility Over Complexity**: Budget planning and opportunity-cost math are the focus. Visual polish and extra features serve the core purpose, not vice versa.

## Technology Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend** | React 18 + TypeScript | Type safety for math-heavy modules; React for UI composition; Vite for fast build/dev |
| **Storage** | IndexedDB via Dexie.js | Persistent local storage without the size/async limits of localStorage; simple schema migration support |
| **Testing** | Vitest | Shares Vite's tooling; fast enough for TDD on calculation modules |
| **Styling** | CSS custom properties + BEM | Centralized design tokens; no CSS-in-JS overhead; dark mode via media queries |
| **Icons** | Feather Icons | Lightweight; works without a bundler; clean aesthetic |
| **Formatting** | Intl.NumberFormat | No i18n library needed; handles multi-currency natively |

**Key Non-Negotiable**: All dependencies are either **essential** (React, TypeScript) or **minimal** (Dexie, Feather). No charting libraries, no UI component suites, no frameworks on top of React. This keeps the bundle small and the codebase understandable.

## Project Structure

```
src/
├── components/          # React components (one file per feature)
├── lib/                 # Business logic (budget math, compounding, etc.)
├── design-tokens.css    # Centralized design system
├── App.tsx              # Main app component; tab routing
└── main.tsx             # Entry point
docs/
├── decisions.md         # Technical decisions & rationale (THIS IS KEY)
├── DESIGN_SYSTEM.md     # Design tokens, patterns, utilities
└── ARCHITECTURE.md      # This file
```

### Component Organization

Each major feature is a top-level component:
- **BudgetPlanner** — Set income, view allocation from actual spending
- **SpendingHub** — Add everyday spending & recurring costs, with calendar view
- **IncomeManager** — Add income sources (fixed/variable), set payday
- **Insights** — Retrospective insight (what did I spend?) + opportunity cost
- **Goals, Accounts, Emergency Fund, Burn Rate** — Financial health tracking

Each component is responsible for:
1. Fetching its own data from Dexie on mount
2. Rendering UI with current state
3. Handling form submission and updates
4. Calling `refresh()` to re-fetch after writes

No prop drilling; each component is self-contained. `CurrencySelector` and `ReviewReminder` are global via React Context.

### Business Logic (`src/lib/`)

All calculation logic is separated from UI. Key modules:

| Module | Exports | Why Separate |
|--------|---------|--------------|
| `budget.ts` | `calculateBudget()` | Income + categories → allocated per category |
| `compounding.ts` | `projectCompoundGrowth()` | Principal + years + rate → future value |
| `spending.ts` | `sumByCategory()`, `filterByDateRange()` | Aggregate and filter spending entries |
| `income.ts` | `calculateTotalMonthlyIncome()`, `calculateIncomeRange()` | Normalize income across frequencies |
| `retrospective.ts` | `buildRetrospective()` | Spending over period → opportunity cost |
| `money.ts` | `roundCents()` | Accurate decimal rounding (not Math.round) |
| `dates.ts` | `parseLocalDate()` | Parse ISO date strings w/o timezone issues |
| `colors.ts` | CVD-validated palette | Chart data series colors |
| `db.ts` | Dexie database schema | Table definitions & versions |

**Why separate**: Tests run without touching React. Logic is reusable and provably correct.

## Key Design Decisions (Interview Talking Points)

### 1. Budget Allocation from Spending Data, Not User Input

**Question**: "Why not let users input budget percentages?"

**Answer**: Because they change the moment income changes. We compute percentages from actual spending in the current month. This makes allocation self-updating and data-driven — it shows what the user is *actually* doing, not what they *intended* to do.

**How it works**: Load income from the Income tab. Load spending for this month. Group by category. Calculate percent as `spent / income`. Show it with a reminder that unspent categories show 0%.

**Trade-off**: The allocation is historical ("here's where you spent last month"), not prescriptive. Users have to check it and decide if it matches their goals. This is intentional — no financial advice.

### 2. IndexedDB, Not a Backend

**Question**: "Why not sync data to a server?"

**Answer**: No backend to build, no credentials to manage, no data privacy concerns. The user owns their financial data, period. Works offline. Simpler to code and deploy.

**Trade-off**: No sync across devices. If they use the app on phone and desktop, each has its own database. This is acceptable for Phase 1-8 (personal budgeting, not shared households). If household budgets become a feature, sync becomes necessary.

### 3. Hand-Rolled Calendar, Not a Library

**Question**: "Why write the calendar component yourself?"

**Answer**: A library like React-Calendar would be overkill for a month grid. The component is 100 lines and handles everything we need: month navigation, grouping subscriptions by day, showing totals. Adding a dependency for it costs more than building it.

**Trade-off**: We don't get "add recurring event" for free. But subscriptions are already in Dexie with a startDate, so no complex event logic is needed.

### 4. CSS Custom Properties + BEM, Not Tailwind or Styled-Components

**Question**: "Why not use Tailwind?"

**Answer**: Tailwind's utility classes work great for quick prototypes, but a design system needs a single source of truth. CSS custom properties (tokens) are that source. When the user says "make the primary color brighter," there's one place to edit it, and every component updates automatically.

**Trade-off**: More CSS to write upfront. But the system scales: new components reuse patterns, dark mode is automatic, onboarding can tweak the palette.

### 5. No Form Library, Inline Validation

**Question**: "Why not use react-hook-form or Formik?"

**Answer**: Forms in Yucha are simple: a few inputs, one submit. Inline `useState` is clearer and smaller than a library. Validation happens in `handleSubmit`; errors are shown via `return` (submit blocked) or inline hints.

**Trade-off**: Complex forms (multi-step, conditionally validated fields) would benefit from a library. Yucha's onboarding starts to push the boundary, but it's still manageable.

## How Data Flows

```
User Action (button click, form submit)
  ↓
Component Handler (handleSubmit, handleChange)
  ↓
Dexie Write (db.table.add, db.table.update)
  ↓
refresh() re-fetches from Dexie
  ↓
setState() with fresh data
  ↓
React re-renders
  ↓
User sees update
```

No middleware, no Redux, no event bus. Dexie operations are async; they're awaited before calling `refresh()` to ensure fresh data.

## Type Safety Practices

TypeScript is **strict mode** (tsconfig.json). Every public function has explicit parameter and return types:

```typescript
export function calculateBudget(
  income: number,
  categories: BudgetCategoryInput[],
): BudgetResult {
  // ...
}
```

Not just `categories: any[]` — each field matters. Discriminated unions are used where a type has variants:

```typescript
export type BudgetCategoryInput =
  | { name: string; type: 'fixed'; amount: number }
  | { name: string; type: 'percentage'; percent: number }
```

TypeScript catches the bug where you forget to handle the 'percentage' case.

## Testing Strategy

**What's tested**: Business logic modules (budget, compounding, spending, dates).

**What's not tested**: UI components (requires React Testing Library or Cypress; cost/benefit trade-off).

**Test file pattern**: `src/lib/module.test.ts` sits next to `src/lib/module.ts`.

**Key test example** (`money.test.ts`): Verifies that `roundCents(10.005)` returns `10.01`, not `10.00`. This is a real bug in naive rounding; the test ensures the fix (Number.EPSILON correction) is present.

**Run with**: `npm test` or `npm run test:watch`

## Performance Considerations

**IndexedDB is async**: Large queries (e.g., 10k spending entries) are awaited; components show a loading state.

**No memoization in low-motion UI**: React's default re-render is fast enough. `useMemo` is used only in BudgetPlanner (complex budget computation).

**Bundle size**: No charting libraries, no form libraries. Total deps: React, Dexie, Feather, Intl (built-in). Bundle is ~50KB gzipped.

**Dark mode is free**: Media queries handle it. No runtime overhead.

## Common Interview Questions & Answers

### "How do you handle income that varies month-to-month?"

We store `minAmount` and `maxAmount` for variable income. `calculateIncomeRange()` returns `{ min, max }` for the range. The Income tab shows both when variable income is present. BudgetPlanner uses the fixed total (non-variable sources) to compute allocation.

### "What if a user has 100 subscriptions with complex rules (e.g., double charge in December)?"

Current design assumes one charge per month on a fixed day. A subscription for "double in December" would need a separate "December charge" entry. For complex recurrence rules (every 2 weeks, once yearly, etc.), the design would need to evolve to store recurrence rules + next-due date instead of a static startDate.

### "How do you ensure financial calculations are correct?"

1. **Types** — TypeScript catches wrong arity (passing a string where number expected)
2. **Tests** — Boundary cases (empty arrays, zero income, negative spending)
3. **Rounding** — `roundCents` uses Number.EPSILON to handle floating-point bugs
4. **No optimization** — We do the straightforward calculation every time; no caching to go stale
5. **Transparency** — Results are always shown with the inputs that produced them (e.g., "7% annual return" is displayed next to the projection)

### "Why no authentication?"

No server to authenticate against. Data never leaves the browser. In a future update with sync, authentication would be necessary to ensure only the user can read/write their data.

### "What's the biggest limitation right now?"

No sync across devices. If you use Yucha on your laptop and phone, each has its own data. For personal budgeting this is acceptable; for household budgets it's a blocker.

## What's Well-Done

1. **Separation of concerns** — Components handle UI; lib/ handles math. Tests prove math, not UI.
2. **Type safety** — Every value is the type it claims to be. Catches arithmetic errors early.
3. **Design system** — Colors and spacing in one place. Dark mode automatic. Portfolio-ready.
4. **Error handling** — No unhandled promises; invalid data silently fails or shows user feedback.
5. **Documentation** — decisions.md explains the "why," not the "what." Code is minimal comments; names say what they do.
6. **No tech debt** — No console.logs left behind, no half-finished features, no "FIXME" comments.

## What Could Be Improved

1. **No UI tests** — Component behavior is manual-tested. A suite (Cypress, Playwright) would catch regressions.
2. **No error boundaries** — React errors crash the page. Error Boundary component would gracefully handle them.
3. **No service worker** — App doesn't work fully offline (assets must load). SW would cache them.
4. **No keyboard navigation tests** — Dropdowns, buttons, day-picker work with keyboard, but untested.
5. **No analytics** — No way to know if features are used. Could add local telemetry (no external tracking).

These are intentional trade-offs at this scale. If the project grows, they'd be the next priorities.
