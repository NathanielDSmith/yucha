# Data Consistency Audit Report

## Database Schema Overview

Yucha uses Dexie.js (IndexedDB) with 8 tables:

| Table | Purpose | Key | Indexes |
|-------|---------|-----|---------|
| `budgetConfig` | Budget allocation plan (singleton) | id (=1) | id |
| `appSettings` | User settings (singleton) | id (=1) | id |
| `spendingEntries` | Spending log entries | id (UUID) | id, date, category |
| `spendingCategories` | Category definitions | id (UUID) | id, name |
| `subscriptions` | Recurring cost tracking | id (UUID) | id, category |
| `goals` | Financial goals | id (UUID) | id, priority |
| `accounts` | Bank accounts, investments | id (UUID) | id, type |
| `incomeSources` | Income tracking | id (UUID) | id, type, isActive |

## Data Integrity Issues & Recommendations

### ✅ Singleton Tables (budgetConfig, appSettings)
- **Status**: SAFE
- **Logic**: id=1 enforced by constants (BUDGET_CONFIG_ID, APP_SETTINGS_ID)
- **Validation**: Code paths prevent multiple records via `put()` with fixed key
- **Recommendation**: Consider schema-level constraints in future versions

### ⚠️ Category References (spendingEntries, subscriptions → spendingCategories)
- **Current State**: spendingEntries.category is a string name, not a foreign key to spendingCategories.id
- **Issue**: Orphaned category names if spendingCategories record deleted
- **Impact**: Spending entries remain linked to non-existent categories by name string
- **Recommendation**: 
  - Add validation before deleting spendingCategories
  - Query spendingEntries for matching category name before deletion
  - Update SpendingLog deleteCategory to check for entries first

### 🔴 Type Inconsistency: AppSettings.lastReviewedAt
- **Schema Definition**: `lastReviewedAt: Date` (TypeScript)
- **IndexedDB Storage**: Stored as ISO string (JSON serialization)
- **Issue**: Dexie may not auto-convert on read
- **Recommendation**: 
  - Verify deserialization in ReviewReminder component
  - Consider storing as ISO string in schema
  - Add validation hook on appSettings read

### ⚠️ Budget Categories (budgetConfig.categories)
- **Current State**: Embedded array inside budgetConfig
- **Design**: Not normalized (not in separate table)
- **Impact**: No standalone index, embedded data grows with edits
- **Status**: Works but could be optimized
- **Recommendation**: Current design is acceptable; revisit if performance issues arise

### ✅ Account Type Validation
- **Current State**: accounts.type index exists (CASH, SAVINGS_ACCOUNT, INVESTMENT)
- **Status**: Index supports filtering but no enum constraint
- **Recommendation**: Type values enforced in code; consider schema validation if user input gets direct DB access

### ✅ Income Source Active Flag
- **Current State**: incomeSources.isActive boolean, indexed
- **Status**: SAFE - used for filtering active vs historical sources
- **Recommendation**: Add periodic cleanup of old inactive sources (for storage optimization)

### ⚠️ Goal Priority Ordering
- **Current State**: goals.priority is indexed number, not unique
- **Issue**: Multiple goals can have same priority (no uniqueness constraint)
- **Impact**: UI must handle ties gracefully
- **Recommendation**: 
  - Document priority tie behavior in GoalsPlanner
  - Consider adding secondary sort by goal.createdAt or id

### ⚠️ Subscription Category → SpendingCategory
- **Current State**: subscriptions.category is string name (not foreign key)
- **Issue**: Same orphan problem as spendingEntries
- **Recommendation**: Check RecurringCosts component for category validation before deletion

### ✅ Account Queries
- **Current State**: Uses type index for filtering
- **Status**: SAFE - type values controlled by code
- **Recommendation**: No changes needed

### ⚠️ Income Source Type Values
- **Current State**: type field indexed but values not validated
- **Issue**: Code can write arbitrary types
- **Recommendation**: Enum validation at input boundaries (IncomeManager component)

## Validation Checklist

### Required Before Deletion
- [ ] Before deleting a spendingCategory, validate no spendingEntries use it
- [ ] Before deleting a spendingCategory, validate no subscriptions use it
- [ ] Before deleting an account, validate no incomeSources reference it
- [ ] Before deleting an incomeSource, validate no goals reference it

### Required On Read
- [ ] Deserialize appSettings.lastReviewedAt properly (string → Date)
- [ ] Validate budget categories array is not empty on read
- [ ] Validate account type is known enum on read
- [ ] Validate income type is known enum on read

### Data Migrations Needed
- None at present, but schema is at version 6
- Next migration should add proper foreign key relationships if normalized

## Known Safe Patterns

✅ **ReviewReminder**: Reads single appSettings record (id=1)  
✅ **BudgetPlanner**: Reads single budgetConfig (id=1), validates categories  
✅ **SpendingLog**: Queries by date/category, handles category deletion  
✅ **Goals**: Uses id-based queries, priority tie-handling unclear (verify)  
✅ **Accounts**: Filters by type, no cross-table refs  

## Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|-----------|-----------|
| Orphaned category references | Medium | Medium | Add deletion validation |
| lastReviewedAt deserialization | Low | Low | Verify in ReviewReminder |
| Priority tie ambiguity | Low | High | Document expected behavior |
| Type enum corruption | Low | Low | Input validation at boundaries |

## Recommendations (Priority Order)

1. **HIGH**: Add spendingCategory deletion validation (prevents orphaned entries)
2. **HIGH**: Verify appSettings.lastReviewedAt deserialization works correctly
3. **MEDIUM**: Check goal priority tie-breaking in GoalsPlanner UI
4. **MEDIUM**: Add type enum validation in IncomeManager
5. **LOW**: Future: normalize budget categories into separate table (optimization only)

## Testing Added

- ✅ pensionCalculator tests (18 tests)
- ✅ budget tests (7 tests)  
- ✅ money tests (5 tests)
- ⏳ Data consistency tests: Not yet automated (recommend manual verification of deletion guards)

## Conclusion

The database schema is **reasonably safe** for current usage. Main risk is orphaned category references from unsanitized deletions. All recommendations are defensive improvements, not critical fixes.
