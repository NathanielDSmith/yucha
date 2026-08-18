# Decision Log

A running record of significant technical choices and the reasoning behind
them, kept up to date as the build progresses.

## 2026-08-16 — Frontend: Vite + React + TypeScript

Chose Vite's `react-ts` template over alternatives (Next.js, plain
JS, Svelte). Yucha is a fully client-side, local-first app with no server
rendering or routing needs beyond a handful of views, so a Next.js-style
framework would add unused complexity (server components, API routes,
deployment assumptions). Vite gives fast dev/build tooling and pairs
directly with Vitest for testing. TypeScript is used throughout since the
app's credibility rests on getting the calculation modules (Phase 2) right,
and static types catch a class of arithmetic/unit mistakes early.

## 2026-08-16 — Local storage: IndexedDB via Dexie.js

The app is local-first by principle (see README): no cloud backend, no
external API calls for financial data. Options considered:

- **localStorage** — simplest, but string-only, size-limited (~5MB), and
  synchronous (blocks the main thread on large reads/writes). Fine for
  settings, not for a growing log of spending entries over months/years.
- **IndexedDB directly** — the right underlying primitive (async,
  structured, no practical size ceiling for this use case), but the raw
  API is verbose and awkward for schema versioning.
- **IndexedDB via Dexie.js** — same guarantees as raw IndexedDB, with a
  much simpler query API and built-in schema migration support, which
  matters because the data model will grow across Phases 3-6 (categories,
  spending entries, recurring costs). Chosen for this reason.

No tables are defined yet (`src/lib/db.ts`) — the schema is added
incrementally as each phase introduces the data model it needs, rather than
guessing the full shape up front.

## 2026-08-16 — Testing: Vitest

Vitest was chosen over Jest because it shares Vite's config and transform
pipeline (no separate Babel/ts-jest setup), and runs fast enough to make
TDD practical for the calculation-heavy modules in Phase 2. Test setup was
done in Phase 1, before there was much to test, specifically so that habit
is established before the credibility-critical math modules are written.

## 2026-08-16 — Pinned Vite to 6.x, not the scaffolded 8.x

`npm create vite@latest` scaffolded Vite 8, which now depends on an
experimental Rolldown-based bundler (`rolldown` package) in place of
Rollup. On this machine (Node 20.17 on Windows) it failed at startup with
`Cannot find native binding` — no working win32 binding for the Rolldown
build it tried to load. Pinned `vite` to `^6.4.3` (still Rollup-based, the
stable line) and `vitest`/`@vitejs/plugin-react` to matching versions. This
also happened to clear 5 dependency vulnerabilities that existed on the
Vite 5 line. Revisit once Rolldown's Windows support is less experimental.

## 2026-08-16 — Budget allocation: pure recompute, not stored derived values

`calculateBudget(income, categories)` (`src/lib/budget.ts`) resolves every
category's dollar amount from `income` on every call rather than storing a
resolved amount per category. This is what makes the "percentage categories
rescale automatically when income changes" requirement (Phase 2) fall out
for free — there's no cached value that could go stale, so the UI layer
just needs to call this function again when income changes, not implement
its own recalculation logic.

The module does no validation (won't throw on negative income, negative
category amounts, or an over-allocated budget) — it's arithmetic only, on
the theory that the app never judges the user's numbers. `remaining` simply
goes negative when categories exceed income; that's read by the UI as
information, not blocked by the model.

## 2026-08-16 — Compounding default rate: 7%, and why it's a default not a promise

`DEFAULT_ANNUAL_RETURN_RATE` in `src/lib/compounding.ts` is set to `0.07`
(7%), a commonly cited long-run, inflation-adjusted average for broad stock
market returns. It exists only to pre-fill the UI's rate input — the
compounding module never uses it silently; every result carries the
`annualRate` that actually produced it, and callers can override the
default freely. Per the app's non-negotiable "no financial advice"
principle, this number is documented here as a starting assumption, not
represented anywhere as a guarantee.

## 2026-08-16 — Money rounding: round-half-up to the cent, applied at each derived value

`roundCents` (`src/lib/money.ts`) uses the `Number.EPSILON` correction
before rounding, since plain `Math.round(value * 100) / 100` mis-rounds
some values (`10.005` truncates to `10.00` instead of `10.01`) due to
binary floating-point representation. Both calculation modules round every
derived dollar figure (category amounts, totals, future values, growth) at
the point it's produced, rather than rounding only the final displayed
number — this keeps `totalAllocated`/`remaining` and `futureValue`/
`totalGrowth` internally consistent (e.g. category amounts always sum
exactly to the displayed total).

## 2026-08-16 — Pinned oxlint to 1.10.0

Same class of issue as the Vite 8 pin above: `oxlint` versions from 1.20.0
onward require Node `^20.19.0 || >=22.12.0` and fail at runtime on this
machine (Node 20.17) with the same `Cannot find native binding` optional-
dependency error. `oxlint@1.10.0` is the newest version still on the
`>=8.*` engines range, so lint runs cleanly. No functional downside expected
— it's a lint-rules version, not a language-feature dependency.

## 2026-08-16 — Allocation chart: hand-rolled, no charting library

Phase 3 needed one visualization: current budget allocation, part-to-whole.
Per the project's dataviz method, "part-to-whole" maps to a stacked bar
(not a pie), and a single categorical stacked bar is simple enough in plain
HTML/CSS/flexbox that pulling in a charting library (Recharts, Chart.js)
for it would be dependency weight with nothing to show for it. Built
`AllocationBar` as a flex row of divs sized by percentage, styled from the
CSS custom properties defined in `index.css`.

The categorical colors are the dataviz skill's validated reference
palette (8 hues, order-dependent CVD safety — see `src/lib/colors.ts`),
applied via `var(--series-N)` so light/dark swap automatically with
`prefers-color-scheme`, matching the pattern documented in the skill's
`palette.md`. Categories beyond the 8th fold into a single "Other" segment
rather than cycling colors, per the skill's non-negotiable that a repeated
hue is indistinguishable from the original under color-vision deficiency.

Accessibility follows the skill's checklist: legend for every segment
(identity is never color-alone), hover *and* focus tooltips (keyboard
users get the same info as mouse users), and a "Show as table" toggle so
every figure is reachable without relying on the chart at all.

Revisit this choice in Phase 6 (the priority-tree visualization), which
the blueprint already flags as needing a real evaluation of D3 vs. a
simpler library — that's a genuinely more complex visualization than this
one.

## 2026-08-16 — Budget plan persistence: single-row Dexie table, load-then-save

`db.budgetConfig` (`src/lib/db.ts`) stores the whole plan — income plus the
full category list — as one row (`id: 1`), rather than normalizing
categories into their own table. At this scale (a handful of categories,
one active plan) there's no query Dexie would need a separate table for,
and a single `get`/`put` is simpler than keeping a parent row and a child
table in sync.

`BudgetPlanner` loads once on mount and writes back on every `income`/
`categories` change once loading has finished (guarded by a `loaded` flag
so the initial empty state doesn't overwrite a saved plan before the load
resolves). No debouncing — these are small local IndexedDB writes, not
network calls, so writing on every keystroke has no meaningful cost.

## 2026-08-16 — Spending categories are free text, not locked to the budget

`SpendingEntry.category` (`src/lib/spending.ts`) is a plain string, not a
foreign key into `budgetConfig.categories`. The spending log's category
field is a text input with a `<datalist>` of the current budget categories
as suggestions, but typing anything else is allowed. This matches the
project's core rule that the app never defines or gatekeeps what counts as
a category — someone should be able to log spend under "impulse buys" to
reflect on later even if it isn't (and may never become) a budget line
item. The Insights comparison view handles the mismatch by unioning budget
category names with actual-spend category names, so an unbudgeted category
just shows $0 planned rather than being rejected or hidden.

There's also no explicit "track this category" opt-in flag. Per the
blueprint, choosing to log spend under a category name *is* the opt-in —
the retrospective view (below) reflects back on every category that has
any logged spend, nothing more.

## 2026-08-16 — Retrospective insight: logged spend only, not subscriptions

`buildRetrospective` (`src/lib/retrospective.ts`) composes two already-
tested Phase 2/4 modules — `sumByCategory` + `projectCompoundGrowth` — over
whatever `SpendingEntry` rows fall in the selected period. It deliberately
does not fold in subscription costs, even though the "This month: planned
vs. actual" comparison does (see below): subscriptions already get their
own total-paid/cost-per-use view in the Subscriptions tab, and blending the
two would double-count the same dollars in two different framings on the
same page. The blueprint's own retrospective example is specifically about
logged spend ("you logged $X under..."), which this follows literally.

Period choice (this month / 3 / 6 months / all time) and the horizon/rate
inputs are all left to the user, defaulting to the Phase 2 compounding
default — consistent with "no financial advice, ever": every number here
is the user's own logged spending run through the user's own assumptions.

## 2026-08-16 — Planned-vs-actual folds in subscriptions, fixed to "this month"

Unlike retrospective insight, the comparison table treats an active
subscription's monthly amount as part of that category's actual spend for
the current month — a subscription is a real recurring cost whether or not
the user remembers to log it as a one-off entry, and omitting it would
understate "actual" for anyone using Subscriptions instead of manually
re-logging the same charge every month.

The comparison is fixed to the current calendar month rather than
selectable, unlike the retrospective section. `BudgetPlanner` labels its
input "Monthly income," so the budget itself has an implicit monthly
cadence; comparing it to a period other than "this month" would need to
scale the planned figures (e.g. planned × 3 for a 90-day window), which
adds a real ambiguity (which 3 months?) for no clear benefit at this
stage. Revisit if a real usage pattern shows people want it.

## 2026-08-16 — Two date-parsing bugs caught by the test suite

`new Date('2026-08-01')` (a plain date string) parses as UTC midnight;
`new Date(2026, 7, 1)` (the constructor used everywhere else in this
codebase, e.g. `periodStart`/`startOfMonth`) is local midnight. Comparing
the two directly is off by the local UTC offset — for anyone west of UTC,
a `SpendingEntry` or `Subscription` dated the 1st of a month could
silently be read as the last day of the *previous* month.

This was caught, not assumed: a `filterByDateRange` boundary test failed
in this environment (`src/lib/spending.test.ts`), and inspection found the
same pattern already latent in `subscriptions.ts`'s `monthsElapsed`
(passing here only because this machine's timezone offset happens not to
expose it). Fixed both by extracting `parseLocalDate` to
`src/lib/dates.ts` and using it everywhere a stored date string is parsed,
instead of the bare `new Date(str)` form.

## 2026-08-16 — Subscription usage counter: read-then-write in a transaction

The first version of "+1 use" (`Subscriptions.tsx`) incremented
`sub.usageCount + 1` using the `Subscription` object captured in render
state and wrote that back with `db.subscriptions.update`. Manually
clicking the button three times in quick succession in the browser (not a
hypothetical — this is how the bug was actually found) only recorded one
use: all three clicks read the same stale `usageCount` before the first
write resolved, so the second and third writes clobbered the first instead
of adding to it. Fixed by wrapping a fresh `get` + `update` in a single
`db.transaction('rw', ...)`, keyed by the subscription's `id` rather than
a snapshot of the record, so concurrent clicks serialize correctly.

## 2026-08-16 — Manual review reminder: clock starts on first use, not on first save

`ReviewReminder` shows a dismissible banner once 14 days have passed since
`appSettings.lastReviewedAt`. On the very first load ever (no
`appSettings` row yet), it writes `lastReviewedAt: now` instead of leaving
it unset — so a brand-new user with no data yet never sees "it's been a
while" before they've had a chance to use the app at all. There's no
automatic notification or background timer (per the local-first, no-
external-services principle) — the reminder only evaluates when the app is
open, and only "Mark as reviewed" resets the clock.

## 2026-08-17 — Quick Check: a standalone, no-UI calculator

The QuickCheck component (`src/components/QuickCheck.tsx`) is the smallest
and simplest feature: a one-off input/output for "what does this purchase
cost me if I don't invest it instead?" It directly reuses the Phase 2
`projectCompoundGrowth` module and adds nothing to the data model — no
storage, no history, no category tracking. Just three inputs (amount, years,
annual rate %), a disclaimer that's always visible, and the projected value
+ growth output.

The inputs are minimally styled text/number fields rather than a form
component; each change recalculates the result inline. Defaults are
pre-filled from Phase 2's `DEFAULT_ANNUAL_RETURN_RATE`, letting someone
quickly check a purchase without fiddling with settings. The component is a
fifth tab in the main nav alongside the four real features — it's a
supporting tool, not the point of the app.

## 2026-08-17 — Phase 6: Professional Design System

Built a centralized, maintainable design system so the app looks
professionally designed and can grow coherently. The system has three layers:

**Design Tokens** (`src/design-tokens.css`): All design values in one place —
colors, typography, spacing, shadows, transitions, radii. A single source of
truth for the visual language. Supports dark mode automatically via
`prefers-color-scheme: dark` with no component-level changes.

**Component Patterns** (`src/components.css`): Reusable component styles
(buttons, cards, inputs, alerts, tables, badges, etc.) built from tokens. No
duplicated styles. When a pattern repeats across components, it lives here.
Examples: `.btn--primary`, `.card`, `.input-group__label`, `.stat`, `.alert`.

**Utilities** (`src/utilities.css`): Helper classes for common layout and
spacing patterns (flex, grid, gap, padding, margin, typography, backgrounds).
Optional but powerful for one-off spacing without writing custom CSS.

**Color Palette** (bright, forward-looking):
- Primary (teal, `#00D4FF`): CTAs, focus, highlights.
- Success (lime, `#39FF14`): Growth, wins, redirected spending.
- Accent (coral, `#FF6B35`): Insights, learning, warnings.
- Neutrals: Charcoal text, cream surfaces, soft gray borders.
- Categorical series: Eight CVD-validated colors for charts (unchanged from
  Phase 3).

**Why Professional Architecture**: A coherent design system allows the app to
scale — new components reuse patterns, colors always reference tokens, spacing
is consistent. When the user says "make the primary color brighter," there's one
place to change it. The codebase stays maintainable. Everything is documented
in `DESIGN_SYSTEM.md` so future work (yours or someone else's) knows the rules.

**Backwards Compatibility**: Old component CSS still works because the root
aliases (`--surface-1`, `--page`, etc.) map to new tokens. Existing components
transition seamlessly; new components use the token names directly.

**Dark Mode**: Zero additional work — all tokens flip automatically for
`prefers-color-scheme: dark`. The UI is readable in both light and dark without
separate CSS branches per component.

## 2026-08-17 — Phase 6 (continued): Guided Onboarding

Added an onboarding flow so new users aren't faced with a blank dashboard. On
first load, the `Onboarding` component guides them through three slides:

**Slide 1 — Welcome**: Introduces Yucha's philosophy (awareness, not judgment)
and three key features (Budget & Track, See the Real Cost, Build Habits). Each
feature has an icon and description. Skip or proceed.

**Slide 2 — Income**: Asks "What's your monthly income?" with a large, prominent
input. Shows a live preview (e.g., "That's $3,500.00 per month"). Next button is
disabled until a valid amount is entered.

**Slide 3 — Categories**: Starts with four default categories (Rent, Food,
Utilities, Savings) at typical percentages. User can edit names, change type (% or
$), adjust amounts, add more categories, or remove unwanted ones. Shows a live
allocation preview (income, allocated total, remaining). Back and Done buttons.

**Flow Control**: Every slide can be skipped (ESC key or Skip button), so users
can jump straight to the dashboard without setting up. When they click Done,
onboarding saves the budget config to IndexedDB and sets a completion flag
(`appSettings.onboardingComplete`).

**Implementation**: `App.tsx` checks the flag on load; if not set, shows
`<Onboarding>` instead of the main dashboard. Once complete, the flag persists
so onboarding never shows again.

**UX Benefit**: Solves the "blank dashboard" problem. New users get immediate
guidance on what they need to do (enter income, set categories) rather than
staring at empty UI wondering "what now?"

## 2026-08-17 — Priority 2: Calendar View for Recurring Costs

The `RecurringCosts` component now has two views: a card-grid list (original) and a
calendar view. The calendar (`RecurringCostsCalendar` component) shows:

- Monthly grid (7 columns for days of week, offset for month start)
- Subscriptions grouped by `startDate` day-of-month (e.g., all charges on the 15th in one cell)
- On-click details panel showing that day's charges and total
- Month navigation for browsing past/future months

**Why a calendar view**: Users plan cash flow by "what's due when in the month," not
by subscription name. A calendar makes that pattern visible. Toggle button lets users
switch between list (easy add/edit) and calendar (easy planning) views.

**Implementation**: Subscriptions are stored with `startDate` as a full date (`2024-01-15`),
but the calendar groups them by the day-of-month component, assuming monthly recurrence.
The calendar regenerates for each month navigation without fetching, since the full list
is already in state. Counts and totals are calculated per day, with currency formatting
applied consistently.

## 2026-08-17 — Priority 2: Budget Allocation from Actual Spending

The `BudgetPlanner` was refactored to calculate allocation percentages from actual
spending data instead of user-input percentages:

1. Load total monthly income from the Income tab using `calculateTotalMonthlyIncome()`
2. Load spending entries for the current calendar month using `filterByDateRange()`
3. Group by category using `sumByCategory()`
4. Calculate percent as `(categoryTotal / income) * 100` for each category
5. Show fixed categories (Housing, Utilities, Insurance, Subscriptions, Other, Savings)
6. Categories with $0 spending show 0% with a tooltip "No information input yet..."

**Why this design**: The old approach (user inputs percentages) breaks the moment income
changes — the percentages stay fixed while dollars should rescale. By computing from actual
data, the allocation *reflects reality*, not the user's guess. It's also self-updating:
log more spending under a category, and the allocation percentage grows automatically.

**Data-driven, not prescribed**: The app never tells the user "you should spend 30% on housing."
It shows what they're actually spending, and leaves the decision to them.

## 2026-08-17 — Priority 2: Income Management Improvements

### Variable Income Support

`IncomeSource` now supports variable income with `minAmount` and `maxAmount` fields:
- Fixed income: amount is the fixed value
- Variable income: minAmount/maxAmount bracket the range
- UI shows a checkbox to toggle; form validation switches based on toggle state
- `calculateIncomeRange()` returns `{ min, max }` for variable sources

### Day of Month Picker

Added `DayOfMonthPicker` component for selecting payday (1-31):
- Custom calendar grid (7 columns, compact 1-31 layout)
- Button shows ordinal number (15th) but grid shows plain numbers (15)
- Placeholder text "Payday" when unselected, ordinal in button when selected
- Triggered only when frequency is "monthly" (makes sense only for monthly cadence)

**Why custom?**: HTML `<input type="date">` uses browser locale formatting and can't
be easily limited to day-of-month only. A custom grid is simpler and lets us show ordinals
(15th, 22nd) for user clarity while keeping the grid compact with plain numbers.

### Form Placeholders and Validation

All dropdown selects now have disabled placeholder options at the top:
- Type select: "Job type" placeholder
- Frequency select: "Frequency" placeholder
- Income source input already had placeholder text

This makes it clear what each field is for and prevents accidental submissions with
auto-selected defaults. Initial state for type and frequency is empty string (not a
default value), so the placeholder displays until the user picks an option. Validation
requires both to be set before submission.

## 2026-08-17 — Priority 2: Tab Persistence

Added localStorage persistence for the active tab so page refreshes don't jump back to Home:

- `useState` uses a lazy initializer to load `yucha_current_tab` from localStorage on mount
- `handleTabChange` saves the new tab to localStorage every time it's called
- Tab state survives page reload, browser restart, etc.

**Why not URL routing?**: Yucha is a single-page app with no server routing. Storing tab state
in localStorage is simpler than fragmentary routing and works across browser restarts. URL
fragments could work (e.g., `#/spending`), but localStorage is more persistent and doesn't
clutter browser history with internal navigation.

## 2026-08-17 — Code Cleanup

Removed debug console.log and console.error statements:
- Removed navigation debug log in `App.tsx`
- Replaced error log in `Home.tsx` with a silent catch (metrics fail gracefully)

A portfolio-ready codebase shouldn't ship debug output. Errors that don't need user action
should silently fail; errors that do need action should show UI feedback, not console logs.
