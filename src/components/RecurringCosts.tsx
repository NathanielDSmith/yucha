import { useEffect, useState, type FormEvent } from 'react'
import { costPerUse, totalPaid, type Subscription } from '../lib/subscriptions'
import { formatCurrency } from '../lib/currency'
import { db } from '../lib/db'
import './Subscriptions.css'

function today(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function RecurringCosts() {
  const [costs, setCosts] = useState<Subscription[]>([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [monthlyAmount, setMonthlyAmount] = useState('')
  const [startDate, setStartDate] = useState(today())

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

    await db.subscriptions.add({
      id: crypto.randomUUID(),
      name: name.trim(),
      category: category.trim() || 'recurring',
      monthlyAmount: amount,
      startDate,
      usageCount: 0,
    })
    setName('')
    setCategory('')
    setMonthlyAmount('')
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
          placeholder="Name (e.g., Rent, Mobile Bill, Insurance)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          id="recurring-name"
          name="recurring-name"
        />
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          id="recurring-category"
          name="recurring-category"
        />
        <input
          type="number"
          inputMode="decimal"
          placeholder="Monthly amount"
          step="0.01"
          value={monthlyAmount}
          onChange={(e) => setMonthlyAmount(e.target.value)}
          id="recurring-amount"
          name="recurring-amount"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          id="recurring-date"
          name="recurring-date"
        />
        <button type="submit">Add recurring cost</button>
      </form>

      {costs.length === 0 && (
        <p className="subscriptions__empty">
          No recurring costs yet. Add rent, utilities, insurance, or other monthly bills.
        </p>
      )}

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
    </div>
  )
}
