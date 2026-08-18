# Yucha Development Roadmap

## Priority 1: Critical Fixes & Core Features

### Navigation & UX Fixes
- [x] **Fix home page button navigation** — Log Spending & View Progress buttons not routing to tabs
- [x] **Fix tab state management** — Navigation clicks not updating displayed content reliably
- [x] **Test all button interactions** — Ensure click handlers work across all components

### Goals Improvements
- [x] **Hide "Add to this goal" input by default** — Clean up initial load
- [x] **Replace with + icon button** — Click to reveal input modal/box
- [x] **Reduce text clutter** — Make Goals section less overwhelming

### Notification & Reminder System
- [x] **Create toast/notification component** — For contextual feedback
- [x] **Implement spending entry notifications:**
  - Compound impact reminder: "That $10 coffee = $19.67 over 10 years invested"
  - Goal progress: "You just added $500 to Emergency Fund. Progress: 30%"
  - Goal celebration: "🎉 Goal complete!"
- [ ] **Add optional "impact awareness" tagging** — Users mark categories to see long-term cost
- [x] **Show friendly messages when logging spending** — Educate, don't judge

### Multi-Income Support
- [ ] **Track multiple income sources** — Job, side gig, investments, etc.
- [ ] **Variable income handling** — Calculate average, show range
- [ ] **Income scheduling** — When each source comes in

## Priority 2: Enhanced Features (Should-Have)

### Calendar View
- [ ] **Recurring Costs calendar** — Visual representation of when bills come out
- [ ] **"View Calendar" button on Recurring Costs tab** — Click to see monthly breakdown
- [ ] **Date grid showing obligations** — "25th: Rent ¥8,200 | 10th: Insurance ¥5,000"
- [ ] **Interactive events** — Click date to see all bills due that day

### Expense Categories & Filtering
- [ ] **Filter/search spending by category** — See all entertainment, all housing, etc.
- [ ] **Category-based charts** — Pie chart or bar chart of spending by category
- [ ] **Custom category creation** — Beyond preset Housing/Utilities/etc.

### Savings Rate & Runway
- [ ] **Calculate monthly savings rate** — Income - Spending = Savings
- [ ] **Show "months to goal" for each financial goal** — Based on savings rate
- [ ] **Track savings trajectory** — Are you improving week-to-week?

### Debt Tracking (Future)
- [ ] **Track debts alongside assets** — Not critical now (user has no debt)
- [ ] **Calculate net worth properly** — Assets - Liabilities
- [ ] **Debt payoff timeline** — When will this be paid off?

### Insights & Reports
- [ ] **Month-over-month comparison** — Spending vs. last month
- [ ] **Category trends** — Is rent eating more of budget lately?
- [ ] **Quick stats dashboard** — Average daily spend, biggest expense, etc.

## Priority 3: Nice-to-Have (Polish & Delight)

### UI & Design Refinement
- [ ] **Audit visual hierarchy** — Better emphasis on important numbers
- [ ] **Improve spacing & padding** — Consistent breathing room
- [ ] **Typography refinement** — Better font sizes and weights
- [ ] **Color palette tweaking** — Refine yellow/gold theme as needed
- [ ] **Micro-interactions** — Smooth transitions, hover states

### Data Export & Backup
- [ ] **Export spending as CSV** — For external analysis
- [ ] **Backup/restore settings** — Download data locally
- [ ] **Data portability** — Not locked into browser storage forever

### Mobile Optimization
- [ ] **Responsive design testing** — Tablet & mobile viewports
- [ ] **Touch-friendly interactions** — Larger tap targets
- [ ] **Mobile-specific UX** — Simplified forms for small screens

### Spending Tags & Annotations
- [ ] **Tag spending for "impact awareness"** — User marks what to track
- [ ] **Quick notes on entries** — "Why did I spend this?"
- [ ] **Spending patterns detection** — "You buy coffee ~3x/week"

### Advanced Features (Future)
- [ ] **Recurring cost adjustments** — Predict when bills will increase
- [ ] **Budget vs. reality alerts** — "You're on track" or "You'll overshoot by $X"
- [ ] **Goal milestones** — Celebrate when you hit 25%, 50%, 75%, 100%
- [ ] **Social features** (maybe?) — Share goal progress (optional)

## Known Issues

- Home page button navigation not working reliably
- Tab state not updating on navigation clicks
- Goals section cluttered on initial load
- "Add to this goal" input always visible

## Current State

**Completed (Phases 1-8):**
- Core budget tracking
- Spending log
- Recurring costs
- Insights & compound growth
- Financial health metrics (net worth, emergency fund, burn rate)
- Goals planner
- Multi-currency support
- Dark mode

**In Progress:**
- UX cleanup (Goals, Navigation)
- Notification system

**Not Started:**
- Calendar view
- Advanced filtering
- Savings tracking
- Debt management
- UI refinement

## Notes

- User wants "bright and quirky" feel, not guilt-inducing
- Focus on positive reinforcement and forward-looking perspective
- App is for personal rebuild scenario (unemployed, rebuilding savings)
- No cloud backend (local-first IndexedDB)
- Should feel like a friendly companion, not an overwhelming dashboard
