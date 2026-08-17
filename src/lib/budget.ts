import { roundCents } from './money'

export type BudgetCategoryInput =
  | { name: string; type: 'fixed'; amount: number }
  | { name: string; type: 'percentage'; percent: number }

// UI-facing category: same shape plus a stable id for React keys and
// Dexie persistence, since a plain array has no identity of its own.
export type BudgetCategory =
  | { id: string; name: string; type: 'fixed'; amount: number }
  | { id: string; name: string; type: 'percentage'; percent: number }

export interface BudgetCategoryResult {
  name: string
  type: 'fixed' | 'percentage'
  amount: number
}

export interface BudgetResult {
  income: number
  categories: BudgetCategoryResult[]
  totalAllocated: number
  remaining: number
}

// Percentage categories resolve against `income` on every call, so callers
// that recompute on income change get automatic rescaling for free — there
// is no stored/cached dollar amount to go stale.
export function calculateBudget(
  income: number,
  categories: BudgetCategoryInput[],
): BudgetResult {
  const resolved: BudgetCategoryResult[] = categories.map((category) => ({
    name: category.name,
    type: category.type,
    amount: roundCents(
      category.type === 'fixed'
        ? category.amount
        : income * (category.percent / 100),
    ),
  }))

  const totalAllocated = roundCents(
    resolved.reduce((sum, category) => sum + category.amount, 0),
  )

  return {
    income,
    categories: resolved,
    totalAllocated,
    remaining: roundCents(income - totalAllocated),
  }
}
