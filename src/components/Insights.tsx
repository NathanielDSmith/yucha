import { useEffect, useMemo, useState } from 'react'
import { calculateBudget, type BudgetCategory } from '../lib/budget'
import { DEFAULT_ANNUAL_RETURN_RATE } from '../lib/compounding'
import { formatCurrency } from '../lib/currency'
import { parseLocalDate } from '../lib/dates'
import { BUDGET_CONFIG_ID, db } from '../lib/db'
import { buildRetrospective } from '../lib/retrospective'
import {
  filterByDateRange,
  periodStart,
  sumByCategory,
  type RetrospectivePeriod,
  type SpendingEntry,
} from '../lib/spending'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import type { Subscription } from '../lib/subscriptions'
import './Insights.css'

const PERIOD_LABELS: Record<RetrospectivePeriod, string> = {
  month: 'this month',
  '3months': 'the last 3 months',
  '6months': 'the last 6 months',
  all: 'all logged time',
}

export function Insights() {
  const [income, setIncome] = useState(0)
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [entries, setEntries] = useState<SpendingEntry[]>([])
  const [subs, setSubs] = useState<Subscription[]>([])
  const [period, setPeriod] = useState<RetrospectivePeriod>('month')
  const [years, setYears] = useState(10)
  const [ratePercent, setRatePercent] = useState(DEFAULT_ANNUAL_RETURN_RATE * 100)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const config = await db.budgetConfig.get(BUDGET_CONFIG_ID)
        if (config) {
          setIncome(config.income)
          setCategories(config.categories)
        }
        const allEntries = await db.spendingEntries.toArray()
        setEntries(allEntries)
        const allSubs = await db.subscriptions.toArray()
        setSubs(allSubs)
      } catch (err) {
        setError('Failed to load insights data. Please try again.')
        console.error('Failed to load insights:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const budget = useMemo(() => calculateBudget(income, categories), [income, categories])

  const comparison = useMemo(() => {
    const monthEntries = filterByDateRange(entries, periodStart('month'), new Date())
    const actualTotals = new Map(sumByCategory(monthEntries).map((c) => [c.category, c.total]))

    const today = new Date()
    for (const sub of subs) {
      if (parseLocalDate(sub.startDate) > today) continue
      actualTotals.set(sub.category, (actualTotals.get(sub.category) ?? 0) + sub.monthlyAmount)
    }

    const names = new Set<string>([
      ...budget.categories.map((c) => c.name),
      ...actualTotals.keys(),
    ])

    return Array.from(names, (name) => {
      const planned = budget.categories.find((c) => c.name === name)?.amount ?? 0
      const actual = actualTotals.get(name) ?? 0
      return { name, planned, actual, difference: planned - actual }
    }).sort((a, b) => b.actual - a.actual)
  }, [budget, entries, subs])

  const retrospective = useMemo(
    () => buildRetrospective(entries, period, years, ratePercent / 100),
    [entries, period, years, ratePercent],
  )

  if (loading) {
    return <LoadingSpinner message="Loading insights..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />
  }

  return (
    <div className="insights">
      <section className="insights__card">
        <h2>This month: planned vs. actual</h2>
        {comparison.length === 0 ? (
          <p className="insights__empty">
            Set up a budget and log some spending to see this comparison.
          </p>
        ) : (
          <table className="insights__table">
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Planned</th>
                <th scope="col">Actual</th>
                <th scope="col">Difference</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td className="insights__num">{formatCurrency(row.planned)}</td>
                  <td className="insights__num">{formatCurrency(row.actual)}</td>
                  <td
                    className={
                      row.difference < 0
                        ? 'insights__num insights__negative'
                        : 'insights__num'
                    }
                  >
                    {row.difference < 0 ? 'over by ' : ''}
                    {formatCurrency(Math.abs(row.difference))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="insights__card">
        <div className="insights__retro-header">
          <h2>What that spending could have become</h2>
          <div className="insights__controls">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as RetrospectivePeriod)}
            >
              <option value="month">This month</option>
              <option value="3months">Last 3 months</option>
              <option value="6months">Last 6 months</option>
              <option value="all">All time</option>
            </select>
            <label>
              over
              <input
                type="number"
                value={years}
                min={1}
                max={80}
                onChange={(e) => setYears(Number(e.target.value) || 1)}
              />
              years at
            </label>
            <label>
              <input
                type="number"
                value={ratePercent}
                step="0.1"
                onChange={(e) => setRatePercent(Number(e.target.value) || 0)}
              />
              %/yr
            </label>
          </div>
        </div>

        <p className="insights__disclaimer">
          This is arithmetic on assumptions you set, not a prediction or
          investment advice — real returns vary and are never guaranteed.
        </p>

        {retrospective.length === 0 ? (
          <p className="insights__empty">
            No spending logged for {PERIOD_LABELS[period]} yet.
          </p>
        ) : (
          <ul className="insights__retro-list">
            {retrospective.map((row) => (
              <li key={row.category}>
                <span className="insights__retro-category">{row.category}</span>
                <span className="insights__retro-copy">
                  You logged <strong>{formatCurrency(row.totalSpent)}</strong> in{' '}
                  {PERIOD_LABELS[period]} — invested for {years} year
                  {years === 1 ? '' : 's'}, that could have grown to{' '}
                  <strong>{formatCurrency(row.projectedValue)}</strong>.
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
