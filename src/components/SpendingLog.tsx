import { useEffect, useState, type FormEvent } from 'react'
import type { SpendingEntry } from '../lib/spending'
import { formatCurrency } from '../lib/currency'
import { BUDGET_CONFIG_ID, db } from '../lib/db'
import { useNotification } from '../lib/NotificationContext'
import { useCurrencyContext } from '../lib/CurrencyContext'
import './SpendingLog.css'

function today(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function SpendingLog() {
  const [entries, setEntries] = useState<SpendingEntry[]>([])
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const { showNotification } = useNotification()
  const { currency } = useCurrencyContext()

  async function refresh() {
    const all = await db.spendingEntries.toArray()
    all.sort((a, b) => b.date.localeCompare(a.date))
    setEntries(all)
  }

  useEffect(() => {
    refresh()
    db.budgetConfig.get(BUDGET_CONFIG_ID).then((config) => {
      if (config) setCategoryOptions(config.categories.map((c) => c.name).filter(Boolean))
    })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsedAmount = Number(amount)
    if (!parsedAmount || parsedAmount <= 0 || !category.trim()) return

    const entry: SpendingEntry = {
      id: crypto.randomUUID(),
      amount: parsedAmount,
      date,
      category: category.trim(),
      note: note.trim() || undefined,
    }
    await db.spendingEntries.add(entry)

    // Calculate compound growth impact over 10 years
    const annualReturn = 0.07
    const futureValue = parsedAmount * Math.pow(1 + annualReturn, 10)
    const impact = futureValue - parsedAmount

    showNotification(
      `${formatCurrency(parsedAmount, currency)} spent. Over 10 years, that could be worth ${formatCurrency(futureValue, currency)}.`,
      'info',
      5000,
    )

    setAmount('')
    setNote('')
    await refresh()
  }

  async function handleDelete(id: string) {
    await db.spendingEntries.delete(id)
    await refresh()
  }

  return (
    <div className="spending-log">
      <form className="spending-log__form" onSubmit={handleSubmit}>
        <input
          type="number"
          inputMode="decimal"
          placeholder="Amount"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />
        <input
          type="text"
          placeholder="Category"
          list="spending-category-options"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <datalist id="spending-category-options">
          {categoryOptions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="submit">Log spend</button>
      </form>

      <ul className="spending-log__list">
        {entries.length === 0 && (
          <li className="spending-log__empty">No spending logged yet.</li>
        )}
        {entries.map((entry) => (
          <li key={entry.id}>
            <span className="spending-log__date">{entry.date}</span>
            <span className="spending-log__category">{entry.category}</span>
            {entry.note && <span className="spending-log__note">{entry.note}</span>}
            <span className="spending-log__amount">{formatCurrency(entry.amount)}</span>
            <button
              type="button"
              aria-label={`Delete ${entry.category} entry`}
              onClick={() => handleDelete(entry.id)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
