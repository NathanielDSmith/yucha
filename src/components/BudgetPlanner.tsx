import { useEffect, useMemo, useState } from 'react'
import { calculateTotalMonthlyIncome, type IncomeSource } from '../lib/income'
import { sumByCategory, filterByDateRange, startOfMonth } from '../lib/spending'
import { formatCurrency } from '../lib/currency'
import { db, type BudgetConfig } from '../lib/db'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { AllocationBar } from './AllocationBar'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import type { SpendingEntry } from '../lib/spending'
import './BudgetPlanner.css'

export function BudgetPlanner() {
  const [income, setIncome] = useState(0)
  const [spendingByCategory, setSpendingByCategory] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const { currency } = useCurrencyContext()

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
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
    } catch (err) {
      setError('Failed to load budget data. Please try again.')
      console.error('Failed to load budget data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load income sources and spending entries on mount
  useEffect(() => {
    loadData()
  }, [])

  // Calculate allocation based on spending data
  const budget = useMemo(() => {
    // Get unique categories from actual spending, sorted alphabetically
    const uniqueCategories = Object.keys(spendingByCategory).sort()

    if (income === 0 || uniqueCategories.length === 0) {
      return {
        income: 0,
        totalAllocated: 0,
        remaining: 0,
        categories: [],
      }
    }

    const categories = uniqueCategories.map((name) => {
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

  if (loading) {
    return <LoadingSpinner message="Loading budget..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => loadData()} />
  }

  const MAX_VISIBLE = 5
  const hasMany = budget.categories.length > MAX_VISIBLE
  const visibleCategories = isExpanded ? budget.categories : budget.categories.slice(0, MAX_VISIBLE)

  return (
    <div className="budget-planner">
      <section className="budget-planner__categories">
        <div className="budget-planner__categories-header">
          <h2>Budget Allocation</h2>
          {hasMany && (
            <button
              type="button"
              className="budget-planner__toggle-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'Collapse categories' : 'Expand categories'}
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
        </div>

        {income === 0 || budget.categories.length === 0 ? (
          <p className="budget-planner__empty">
            Add income sources in the Income tab to see your budget allocation.
          </p>
        ) : (
          <>
            <div className="budget-planner__categories-list">
              {visibleCategories.map((category) => (
                <div
                  key={category.id}
                  className="budget-planner__category-row"
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
              ))}
            </div>
            {!isExpanded && hasMany && (
              <p className="budget-planner__showing-count">
                Showing {visibleCategories.length} of {budget.categories.length} categories
              </p>
            )}
          </>
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
