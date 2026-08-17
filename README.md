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

## Status

Early scaffolding (Phase 1 of the build). Not yet usable.

## Development

```bash
npm install
npm run dev
npm test
```
