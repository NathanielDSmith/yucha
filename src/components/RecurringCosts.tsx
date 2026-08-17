import { useEffect, useState, type FormEvent } from 'react'
import { costPerUse, totalPaid, type Subscription } from '../lib/subscriptions'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { getCurrency } from '../lib/currencies'
import { db } from '../lib/db'
import { RecurringCostsCalendar } from './RecurringCostsCalendar'
import './Subscriptions.css'

const COST_CATEGORIES = {
  housing: 'Housing',
  utilities: 'Utilities',
  insurance: 'Insurance',
  subscriptions: 'Subscriptions',
  other: 'Other',
}

type CostCategory = keyof typeof COST_CATEGORIES

function today(): number {
  return new Date().getDate()
}

export function RecurringCosts() {
  const [costs, setCosts] = useState<Subscription[]>([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState<CostCategory>('other')
  const [monthlyAmount, setMonthlyAmount] = useState('')
  const [dayOfMonth, setDayOfMonth] = useState(today())
  const [showCalendar, setShowCalendar] = useState(false)
  const { currency } = useCurrencyContext()
  const currencySymbol = getCurrency(currency)?.symbol || '$'

  async function refresh() {
    const all = await db.subscriptions.toArray()
    setCosts(all)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const amount = Number(monthlyAmount)
    if (!name.trim() || !amount || amount <= 0) return

    const dateStr = `2024-01-${String(dayOfMonth).padStart(2, '0')}`

    await db.subscriptions.add({
      id: crypto.randomUUID(),
      name: name.trim(),
      category: COST_CATEGORIES[category],
      monthlyAmount: amount,
      startDate: dateStr,
      usageCount: 0,
    })
    setName('')
    setCategory('other')
    setMonthlyAmount('')
    setDayOfMonth(today())
    await refresh()
  }

  async function logUse(id: string) {
    await db.transaction('rw', db.subscriptions, async () => {
      const current = await db.subscriptions.get(id)
      if (!current) return
      await db.subscriptions.update(id, { usageCount: current.usageCount + 1 })
    })
    await refresh()
  }

  async function remove(id: string) {
    await db.subscriptions.delete(id)
    await refresh()
  }

  return (
    <div className="subscriptions">
      <form className="subscriptions__form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name (e.g., Rent, Mobile Bill, Netflix)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          id="recurring-name"
          name="recurring-name"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CostCategory)}
          id="recurring-category"
          name="recurring-category"
        >
          {Object.entries(COST_CATEGORIES).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <input
          type="number"
          inputMode="decimal"
          placeholder={currencySymbol}
          step="0.01"
          value={monthlyAmount}
          onChange={(e) => setMonthlyAmount(e.target.value)}
          id="recurring-amount"
          name="recurring-amount"
        />
        <input
          type="number"
          min="1"
          max="31"
          placeholder="Day"
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(Number(e.target.value))}
          id="recurring-day"
          name="recurring-day"
          title="Day of month it comes out (1-31)"
        />
        <button type="submit">Add</button>
      </form>

      {costs.length === 0 && (
        <p className="subscriptions__empty">
          No recurring costs yet. Add rent, utilities, insurance, or other monthly bills.
        </p>
      )}

      {costs.length > 0 && (
        <>
          <button
            type="button"
            className="subscriptions__calendar-toggle"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            {showCalendar ? '← Back to List' : '📅 View Calendar'}
          </button>

          {showCalendar ? (
            <RecurringCostsCalendar />
          ) : (
            <div className="subscriptions__list">
              {costs.map((cost) => {
              const paid = totalPaid(cost)
              const perUse = costPerUse(cost)
              return (
                <div className="subscriptions__card" key={cost.id}>
                  <div className="subscriptions__card-header">
                    <div>
                      <strong>{cost.name}</strong>
                      <span className="subscriptions__category">{cost.category}</span>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${cost.name}`}
                      onClick={() => remove(cost.id)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="subscriptions__stats">
                    <div>
                      <span>Monthly</span>
                      <strong>{formatCurrency(cost.monthlyAmount)}</strong>
                    </div>
                    <div>
                      <span>Paid to date</span>
                      <strong>{formatCurrency(paid)}</strong>
                    </div>
                    <div>
                      <span>Months active</span>
                      <strong>{cost.usageCount}</strong>
                    </div>
                    <div>
                      <span>Total cost</span>
                      <strong>{formatCurrency(paid)}</strong>
                    </div>
                  </div>
                </div>
              )
            })}</div>
          )}
        </>
      )}
    </div>
  )
}
