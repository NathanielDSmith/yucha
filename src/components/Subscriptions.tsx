import { useEffect, useState, type FormEvent } from 'react'
import { costPerUse, totalPaid, type Subscription } from '../lib/subscriptions'
import { formatCurrency } from '../lib/currency'
import { db } from '../lib/db'
import { today } from '../lib/dates'
import './Subscriptions.css'

export function Subscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [monthlyAmount, setMonthlyAmount] = useState('')
  const [startDate, setStartDate] = useState(today())

  async function refresh() {
    const all = await db.subscriptions.toArray()
    setSubs(all)
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
      category: category.trim() || 'subscriptions',
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
    // Read-then-write inside a transaction rather than incrementing the
    // `usageCount` captured in render state — two quick clicks otherwise
    // both read the same stale count and the second write clobbers the
    // first instead of adding to it.
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
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <input
          type="number"
          inputMode="decimal"
          placeholder="Monthly $"
          step="0.01"
          value={monthlyAmount}
          onChange={(e) => setMonthlyAmount(e.target.value)}
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <button type="submit">Add subscription</button>
      </form>

      {subs.length === 0 && (
        <p className="subscriptions__empty">
          No recurring costs tracked yet.
        </p>
      )}

      <div className="subscriptions__list">
        {subs.map((sub) => {
          const paid = totalPaid(sub)
          const perUse = costPerUse(sub)
          return (
            <div className="subscriptions__card" key={sub.id}>
              <div className="subscriptions__card-header">
                <div>
                  <strong>{sub.name}</strong>
                  <span className="subscriptions__category">{sub.category}</span>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${sub.name}`}
                  onClick={() => remove(sub.id)}
                >
                  ✕
                </button>
              </div>
              <div className="subscriptions__stats">
                <div>
                  <span>Monthly</span>
                  <strong>{formatCurrency(sub.monthlyAmount)}</strong>
                </div>
                <div>
                  <span>Paid to date</span>
                  <strong>{formatCurrency(paid)}</strong>
                </div>
                <div>
                  <span>Uses logged</span>
                  <strong>{sub.usageCount}</strong>
                </div>
                <div>
                  <span>Cost per use</span>
                  <strong>{perUse === null ? '—' : formatCurrency(perUse)}</strong>
                </div>
              </div>
              <button
                type="button"
                className="subscriptions__log-use"
                onClick={() => logUse(sub.id)}
              >
                +1 use
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
