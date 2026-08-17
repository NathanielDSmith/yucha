# Yucha

A personal habit-and-perspective tool for real budget planning, plus a
secondary "quick check" calculator for what a purchase costs you long-term
if the money were invested instead.

Yucha is not a budgeting app in the strict "track every cent" sense, and it
is **not** a financial advice tool. It rests on two pillars:

1. **Long-term thinking** — reframe small, easy-to-dismiss spending ("it's
   only $5") into what that spending becomes over time if repeated or
   redirected.
2. **Investment awareness** — show, concretely, what the same money could
   become if invested instead, using assumptions the user sets, not figures
   the app claims to guarantee.

The primary use case is real budget planning: enter income, define your own
categories, allocate money across them, and see it visually so you can
decide what to change. The opportunity-cost calculator and retrospective
spending insight sit on top of that as supporting features, not the
centerpiece.

## No financial advice, ever

Yucha performs arithmetic on assumptions **you** supply. It does not
recommend investments, predict markets, or guarantee outcomes. Every
projection is shown next to a clear disclaimer, and return rates / time
horizons always come from the user, with sensible non-binding defaults.

## Local-first

No cloud backend, no paid hosting, no external API calls for live data. All
financial data stays in your browser's own local storage. See
[`docs/decisions.md`](docs/decisions.md) for the reasoning behind that and
other technical choices.

## Features

### Core Tracking (Phases 1–4)
- **Budget Planner** — Set income, allocate across categories with percentages, see allocation visually
- **Spending Log** — Record everyday spending (coffee, groceries, entertainment, etc.) with category and date
- **Recurring Costs** — Track monthly bills (rent, utilities, insurance, subscriptions) with due dates for cash flow planning
- **Insights** — See planned vs. actual spending, including recurring costs; calculate opportunity cost of spending over time using compound growth

### Financial Health (Phase 8)
- **Accounts** — Track assets across account types (cash, savings, investment, other); see net worth and account allocation
- **Emergency Fund Tracker** — Set 6-month emergency fund goal; see runway and adequacy percentage
- **Burn Rate Calculator** — Calculate days of savings remaining at current spending pace; track trends (accelerating/stable/improving)
- **Goals Planner** — Set financial goals (emergency fund, savings, investment, personal); track progress with visual bars

### Additional Features
- **Quick Check** — Ad-hoc calculator: what does a $X purchase cost over Y years if invested instead?
- **Review Reminder** — 14-day banner suggesting a quick spending review
- **Multi-currency** — Switch between USD, EUR, GBP, JPY with automatic formatting
- **Dark mode** — Automatic via system preference

## Status

Phases 1–8 complete and usable. Core features working. Recent UX overhaul: simplified navigation, cleaner forms, yellow/gold single-tone design.

## Design

- **Navigation** — 5 main tabs (Home, Spending, Insights, Goals, Settings) with icon-based design (Feather Icons)
- **Spending** — Sub-navigation: Everyday Spending vs. Recurring Costs for cleaner organization
- **Color scheme** — Warm yellow/gold single-tone (no gradients; better readability)
- **Dark mode** — Automatic via `prefers-color-scheme` media query
- **Design tokens** — Centralized colors, typography, spacing, shadows in `src/design-tokens.css`

## Tech Stack

- **React 18** with TypeScript for UI components
- **Vite** for development and bundling
- **Dexie.js** for local-first IndexedDB storage (v4 schema with accounts, spending, recurring costs, goals)
- **Vitest** for unit testing
- **Feather Icons** for clean, modern navigation
- **Intl.NumberFormat** for currency-aware formatting across locales

## Development

```bash
npm install
npm run dev      # Start dev server (http://localhost:5174)
npm test         # Run unit tests
npm run build    # Build for production
```

## Project Structure

```
src/
  components/     # React UI components (Budget, Spending, Goals, etc.)
  lib/            # Business logic (budget, compounding, burn rate, etc.)
  *.css           # Design tokens, component styles, utilities
```

See [`docs/decisions.md`](docs/decisions.md) for architectural decisions and rationale.
