# Mobile Responsiveness Implementation Plan

## Target: 375px (iPhone SE) to 480px (small Android)

## Issues Identified

### 🔴 Critical (Layout breaks)
1. **SpendingLog form** - 5-column grid: `grid-template-columns: 110px 1fr 150px 1fr auto`
   - On 407px: each column too wide, causes wrap chaos
   - Fix: Single column on mobile `grid-template-columns: 1fr`

2. **DayOfMonthPicker** - `min-width: 280px` overflows 375px screen
   - Leaves only 95px for padding/borders
   - Fix: `max-width: 100%; width: calc(100% - 2*var(--space-lg))`

3. **RecurringCostsCalendar** - Sidebar `350px` + calendar side-by-side
   - Grid: `1fr 350px` breaks on mobile
   - Fix: Stack vertically `grid-template-columns: 1fr` on mobile

### ⚠️ High (Usability)
4. **Touch targets** - Buttons 40px (below WCAG 44×44px)
   - Forms: input height 40px, need padding increase
   - Fix: Min height 44px on mobile buttons/inputs

5. **Font sizes** - Body text may be too small on mobile
   - Check readability at 375px width

6. **Form spacing** - inputs too close together
   - Gap between form fields may be too small

### 🟡 Medium (Polish)
7. **Navigation labels** - Hidden on desktop (`display: none`)
   - May need to show on mobile for clarity
   - Current: icon-only nav

8. **Lists** - Spending log list items wrap awkwardly
   - Buttons stack in odd ways
   - Date/amount/buttons need better arrangement

## Implementation Approach

### Breakpoint
Use `@media (max-width: 768px)` for tablet  
Use `@media (max-width: 600px)` for mobile  
Use `@media (max-width: 375px)` for small phones (if needed)

### Priority Order
1. **Forms** - SpendingLog, Onboarding, IncomeManager
2. **Calendars** - DayOfMonthPicker, RecurringCostsCalendar
3. **Touch targets** - All buttons/inputs to 44px
4. **Lists** - Spending log entry layout
5. **Navigation** - Label visibility

## Files to Update

### High Priority
- [ ] SpendingLog.css - Form grid, entry layout
- [ ] DayOfMonthPicker.css - Width constraint
- [ ] RecurringCostsCalendar.css - Grid layout
- [ ] Budget-related forms - All form grids
- [ ] IncomeManager.css - Form grid
- [ ] GoalsPlanner.css - Touch targets, form grid

### Medium Priority
- [ ] AccountManagement.css - Form grid, table scrolling
- [ ] EmergencyFundTracker.css - Layout
- [ ] BurnRateTracker.css - Layout
- [ ] NetWorthDashboard.css - Layout, card sizes

### Low Priority
- [ ] Navigation labels - Consider revealing on mobile
- [ ] App.css header - May need adjustment

## Testing Checklist
- [ ] No horizontal scrolling at 375px
- [ ] All buttons/inputs ≥44×44px
- [ ] Forms stack vertically on mobile
- [ ] Date/amount/buttons readable on entry list
- [ ] Calendar picker fits on screen
- [ ] Touch interactions work smoothly
- [ ] Text is readable (check font sizes)
- [ ] All modals work on mobile

## Expected Changes
- Grid columns: 5 → 1-2 on mobile
- Spacing: May increase gaps between inputs
- Button sizes: 40px → 44px min
- Calendar width: constrained to viewport
- Sidebar layouts: stack vertically

## Estimated Effort
- Forms: 2-3 hours
- Calendars: 1-2 hours  
- Touch targets: 1 hour
- Lists/polish: 1 hour
- Testing: 1 hour
- **Total: 6-8 hours**
