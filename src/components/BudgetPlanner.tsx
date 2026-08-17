import { useEffect, useMemo, useState } from 'react'
import { calculateTotalMonthlyIncome, type IncomeSource } from '../lib/income'
import { sumByCategory, filterByDateRange, startOfMonth } from '../lib/spending'
import { formatCurrency } from '../lib/currency'
import { db, type BudgetConfig } from '../lib/db'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { AllocationBar } from './AllocationBar'
import type { SpendingEntry } from '../lib/spending'
import './BudgetPlanner.css'

const FIXED_CATEGORIES = [
  'Housing',
  'Utilities',
  'Insurance',
  'Subscriptions',
  'Other',
  'Savings',
]

export function BudgetPlanner() {
  const [income, setIncome] = useState(0)
  const [spendingByCategory, setSpendingByCategory] = useState<Record<string, number>>({})
  const [loaded, setLoaded] = useState(false)
  const { currency } = useCurrencyContext()

  // Load income sources and spending entries on mount
  useEffect(() => {
    async function loadData() {
      const incomeSources = await db.incomeSources.toArray()
      const totalIncome = calculateTotalMonthlyIncome(incomeSources)
      setIncome(totalIncome)

      const allSpending = await db.spendingEntries.toArray()
      const monthStart = startOfMonth()
      const monthEnd = new Date()
      const thisMonthSpending = filterByDateRange(allSpending, monthStart, monthEnd)

      const categorized = sumByCategory(thisMonthSpending)
      const byCategory: Record<string, number> = {}
      categorized.forEach((cat) => {
        byCategory[cat.category] = cat.total
      })
      setSpendingByCategory(byCategory)
      setLoaded(true)
    }
    loadData()
  }, [])

  // Calculate allocation based on spending data
  const budget = useMemo(() => {
    if (income === 0) {
      return {
        income: 0,
        totalAllocated: 0,
        remaining: 0,
        categories: FIXED_CATEGORIES.map((name) => ({
          id: name,
          name,
          type: 'percentage' as const,
          percent: 0,
          amount: 0,
        })),
      }
    }

    const categories = FIXED_CATEGORIES.map((name) => {
      const spending = spendingByCategory[name] || 0
      const percent = (spending / income) * 100
      return {
        id: name,
        name,
        type: 'percentage' as const,
        percent: Math.round(percent * 10) / 10, // Round to 1 decimal
        amount: spending,
      }
    })

    const totalAllocated = Object.values(spendingByCategory).reduce((sum, val) => sum + val, 0)

    return {
      income,
      totalAllocated,
      remaining: income - totalAllocated,
      categories,
    }
  }, [income, spendingByCategory])

  if (!loaded) return null

  return (
    <div className="budget-planner">
      <section className="budget-planner__categories">
        <div className="budget-planner__categories-header">
          <h2>Budget Allocation</h2>
        </div>

        {income === 0 ? (
          <p className="budget-planner__empty">
            Add income sources in the Income tab to see your budget allocation.
          </p>
        ) : (
          <div className="budget-planner__categories-list">
            {budget.categories.map((category) => {
              const hasData = spendingByCategory[category.name] !== undefined
              const tooltip = hasData ? undefined : 'No information input yet. Please update to get clear percentages.'
              return (
                <div
                  key={category.id}
                  className="budget-planner__category-row"
                  title={tooltip}
                >
                  <div className="budget-planner__category-name">{category.name}</div>
                  <div className="budget-planner__category-value">
                    <span className="budget-planner__percent">
                      {category.percent.toFixed(1)}%
                    </span>
                    <span className="budget-planner__amount">
                      {formatCurrency(category.amount, currency)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="budget-planner__summary">
        <div>
          <span>Income</span>
          <strong>{formatCurrency(budget.income, currency)}</strong>
        </div>
        <div>
          <span>Allocated</span>
          <strong>{formatCurrency(budget.totalAllocated, currency)}</strong>
        </div>
        <div className={budget.remaining < 0 ? 'budget-planner__negative' : ''}>
          <span>{budget.remaining < 0 ? 'Over by' : 'Remaining'}</span>
          <strong>{formatCurrency(Math.abs(budget.remaining), currency)}</strong>
        </div>
      </section>

      <AllocationBar budget={budget} />
    </div>
  )
}
