import { useEffect, useState, type FormEvent } from 'react'
import type { SpendingEntry } from '../lib/spending'
import { formatCurrency } from '../lib/currency'
import { BUDGET_CONFIG_ID, db } from '../lib/db'
import { useToast } from '../lib/toastStore'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { EmptyState } from './EmptyState'
import './SpendingLog.css'

function today(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function SpendingLog() {
  const { show: showToast } = useToast()
  const [entries, setEntries] = useState<SpendingEntry[]>([])
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function refresh() {
    try {
      const all = await db.spendingEntries.toArray()
      all.sort((a, b) => b.date.localeCompare(a.date))
      setEntries(all)
      setError(null)
    } catch (err) {
      setError('Failed to load spending entries. Please try again.')
      console.error('Failed to load spending entries:', err)
    }
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        await refresh()
        const config = await db.budgetConfig.get(BUDGET_CONFIG_ID)
        if (config) {
          setCategoryOptions(config.categories.map((c) => c.name).filter(Boolean))
        }
      } catch (err) {
        setError('Failed to load data. Please try again.')
        console.error('Failed to load spending data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setValidationError(null)
    const parsedAmount = Number(amount)

    if (!amount || !parsedAmount || parsedAmount <= 0) {
      setValidationError('Amount must be greater than 0')
      return
    }
    if (!category.trim()) {
      setValidationError('Category is required')
      return
    }

    try {
      setSubmitting(true)
      const entry: SpendingEntry = {
        id: crypto.randomUUID(),
        amount: parsedAmount,
        date,
        category: category.trim(),
        note: note.trim() || undefined,
      }
      await db.spendingEntries.add(entry)
      setAmount('')
      setNote('')
      setValidationError(null)
      showToast('Spending logged successfully', 'success')
      await refresh()
    } catch (err) {
      showToast('Failed to log spending. Please try again.', 'error')
      console.error('Failed to add spending entry:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await db.spendingEntries.delete(id)
      showToast('Entry deleted', 'success')
      await refresh()
    } catch (err) {
      showToast('Failed to delete entry. Please try again.', 'error')
      console.error('Failed to delete spending entry:', err)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading spending log..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refresh} />
  }

  return (
    <div className="spending-log">
      <form className="spending-log__form" onSubmit={handleSubmit} noValidate>
        <input
          type="number"
          inputMode="decimal"
          placeholder="Amount"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
          disabled={submitting}
          aria-label="Spending amount"
          aria-describedby={validationError ? 'validation-error' : undefined}
        />
        <input
          type="text"
          placeholder="Category"
          list="spending-category-options"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={submitting}
          aria-label="Spending category"
          aria-describedby={validationError ? 'validation-error' : undefined}
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
          disabled={submitting}
          aria-label="Spending date"
        />
        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={submitting}
          aria-label="Spending note (optional)"
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Log spend'}
        </button>
        {validationError && <ErrorMessage message={validationError} />}
      </form>

      {entries.length === 0 ? (
        <EmptyState message="No spending logged yet. Add your first entry above." />
      ) : (
        <ul className="spending-log__list">
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
      )}
    </div>
  )
}
