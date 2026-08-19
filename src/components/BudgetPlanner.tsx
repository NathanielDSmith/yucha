import { useEffect, useMemo, useState } from 'react'
import { calculateBudget, type BudgetCategory } from '../lib/budget'
import { formatCurrency } from '../lib/currency'
import { BUDGET_CONFIG_ID, db } from '../lib/db'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { AllocationBar } from './AllocationBar'
import { DemoModeToggle } from './DemoModeToggle'
import './BudgetPlanner.css'

function newCategory(): BudgetCategory {
  return { id: crypto.randomUUID(), name: '', type: 'percentage', percent: 0 }
}

export function BudgetPlanner() {
  const [income, setIncome] = useState(0)
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [loaded, setLoaded] = useState(false)
  const { currency } = useCurrencyContext()

  useEffect(() => {
    db.budgetConfig.get(BUDGET_CONFIG_ID).then((config) => {
      if (config) {
        setIncome(config.income)
        setCategories(config.categories)
      }
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!loaded) return
    db.budgetConfig.put({ id: BUDGET_CONFIG_ID, income, categories })
  }, [loaded, income, categories])

  const budget = useMemo(
    () => calculateBudget(income, categories),
    [income, categories],
  )

  function updateName(id: string, name: string) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)))
  }

  function updateType(id: string, type: 'fixed' | 'percentage') {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        return type === 'fixed'
          ? { id: c.id, name: c.name, type: 'fixed', amount: 0 }
          : { id: c.id, name: c.name, type: 'percentage', percent: 0 }
      }),
    )
  }

  function updateValue(id: string, value: number) {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        return c.type === 'fixed' ? { ...c, amount: value } : { ...c, percent: value }
      }),
    )
  }

  function removeCategory(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  if (!loaded) return null

  return (
    <div className="budget-planner">
      <DemoModeToggle />

      <section className="budget-planner__income">
        <label htmlFor="income">Monthly income</label>
        <input
          id="income"
          type="number"
          inputMode="decimal"
          value={income}
          onChange={(e) => setIncome(Number(e.target.value) || 0)}
        />
      </section>

      <section className="budget-planner__categories">
        <div className="budget-planner__categories-header">
          <h2>Categories</h2>
          <button type="button" onClick={() => setCategories((prev) => [...prev, newCategory()])}>
            Add category
          </button>
        </div>

        {categories.length === 0 && (
          <p className="budget-planner__empty">
            No categories yet — add one to start allocating your income.
          </p>
        )}

        {categories.map((category) => (
          <div className="budget-planner__row" key={category.id}>
            <input
              type="text"
              placeholder="Category name"
              value={category.name}
              onChange={(e) => updateName(category.id, e.target.value)}
            />
            <select
              value={category.type}
              onChange={(e) =>
                updateType(category.id, e.target.value as 'fixed' | 'percentage')
              }
            >
              <option value="percentage">%</option>
              <option value="fixed">$</option>
            </select>
            <input
              type="number"
              inputMode="decimal"
              value={category.type === 'fixed' ? category.amount : category.percent}
              onChange={(e) => updateValue(category.id, Number(e.target.value) || 0)}
            />
            <button
              type="button"
              className="budget-planner__remove"
              aria-label={`Remove ${category.name || 'category'}`}
              onClick={() => removeCategory(category.id)}
            >
              ✕
            </button>
          </div>
        ))}
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
