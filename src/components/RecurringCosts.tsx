import { useEffect, useState, type FormEvent } from 'react'
import { costPerUse, totalPaid, type Subscription } from '../lib/subscriptions'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { getCurrency } from '../lib/currencies'
import { db } from '../lib/db'
import { useToast } from '../lib/toastStore'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { RecurringCostsCalendar } from './RecurringCostsCalendar'
import { OpportunityCostModal } from './OpportunityCostModal'
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
  const { show: showToast } = useToast()
  const [costs, setCosts] = useState<Subscription[]>([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState<CostCategory>('other')
  const [monthlyAmount, setMonthlyAmount] = useState('')
  const [dayOfMonth, setDayOfMonth] = useState(today())
  const [showCalendar, setShowCalendar] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [opportunityCostId, setOpportunityCostId] = useState<string | null>(null)
  const { currency } = useCurrencyContext()
  const currencySymbol = getCurrency(currency)?.symbol || '$'

  async function refresh() {
    try {
      const all = await db.subscriptions.toArray()
      setCosts(all)
      setError(null)
    } catch (err) {
      setError('Failed to load recurring costs. Please try again.')
      console.error('Failed to load recurring costs:', err)
    }
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        await refresh()
      } catch (err) {
        setError('Failed to load data. Please try again.')
        console.error('Failed to load recurring costs:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function startEdit(cost: Subscription) {
    setEditingId(cost.id)
    setName(cost.name)
    setCategory(Object.entries(COST_CATEGORIES).find(([_, v]) => v === cost.category)?.[0] as CostCategory || 'other')
    setMonthlyAmount(String(cost.monthlyAmount))
    const dayMatch = cost.startDate.match(/\d+-\d+-(\d+)/)
    setDayOfMonth(dayMatch ? Number(dayMatch[1]) : today())
  }

  function cancelEdit() {
    setEditingId(null)
    setName('')
    setCategory('other')
    setMonthlyAmount('')
    setDayOfMonth(today())
    setValidationError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setValidationError(null)
    const amount = Number(monthlyAmount)

    if (!name.trim()) {
      setValidationError('Name is required')
      return
    }
    if (!amount || amount <= 0) {
      setValidationError('Amount must be greater than 0')
      return
    }

    try {
      setSubmitting(true)
      const dateStr = `2024-01-${String(dayOfMonth).padStart(2, '0')}`

      if (editingId) {
        await db.subscriptions.update(editingId, {
          name: name.trim(),
          category: COST_CATEGORIES[category],
          monthlyAmount: amount,
          startDate: dateStr,
        })
        showToast('Recurring cost updated', 'success')
      } else {
        await db.subscriptions.add({
          id: crypto.randomUUID(),
          name: name.trim(),
          category: COST_CATEGORIES[category],
          monthlyAmount: amount,
          startDate: dateStr,
          usageCount: 0,
        })
        showToast('Recurring cost added', 'success')
      }

      setName('')
      setCategory('other')
      setMonthlyAmount('')
      setDayOfMonth(today())
      setValidationError(null)
      setEditingId(null)
      await refresh()
    } catch (err) {
      showToast('Failed to save recurring cost. Please try again.', 'error')
      console.error('Failed to save recurring cost:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function logUse(id: string) {
    try {
      await db.transaction('rw', db.subscriptions, async () => {
        const current = await db.subscriptions.get(id)
        if (!current) return
        await db.subscriptions.update(id, { usageCount: current.usageCount + 1 })
      })
      showToast('Usage logged', 'success')
      await refresh()
    } catch (err) {
      showToast('Failed to log usage. Please try again.', 'error')
      console.error('Failed to log usage:', err)
    }
  }

  async function remove(id: string) {
    try {
      await db.subscriptions.delete(id)
      showToast('Recurring cost removed', 'success')
      await refresh()
    } catch (err) {
      showToast('Failed to remove cost. Please try again.', 'error')
      console.error('Failed to remove recurring cost:', err)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading recurring costs..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refresh} />
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
          disabled={submitting}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CostCategory)}
          id="recurring-category"
          name="recurring-category"
          disabled={submitting}
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
          disabled={submitting}
        />
        <input
          type="number"
          min="1"
          max="31"
          placeholder="Day (1-31)"
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(Number(e.target.value))}
          id="recurring-day"
          name="recurring-day"
          title="Which day of the month does this charge (1-31)"
          disabled={submitting}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update' : 'Add')}
        </button>
        {editingId && (
          <button type="button" onClick={cancelEdit} disabled={submitting}>
            Cancel
          </button>
        )}
        {validationError && <ErrorMessage message={validationError} />}
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
                    <div className="subscriptions__card-actions">
                      <button
                        type="button"
                        aria-label={`View investment growth of ${cost.name}`}
                        onClick={() => setOpportunityCostId(cost.id)}
                        className="subscriptions__opportunity-btn"
                        title="View investment growth potential"
                      >
                        📈
                      </button>
                      <button
                        type="button"
                        aria-label={`Edit ${cost.name}`}
                        onClick={() => startEdit(cost)}
                        className="subscriptions__edit-btn"
                        title="Edit this cost"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${cost.name}`}
                        onClick={() => remove(cost.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="subscriptions__stats">
                    <div>
                      <span>Monthly</span>
                      <strong>{formatCurrency(cost.monthlyAmount, currency)}</strong>
                    </div>
                    <div>
                      <span>Annual (12 months)</span>
                      <strong>{formatCurrency(cost.monthlyAmount * 12, currency)}</strong>
                    </div>
                  </div>
                </div>
              )
            })}</div>
          )}
        </>
      )}

      {opportunityCostId && (
        <OpportunityCostModal
          amount={costs.find(c => c.id === opportunityCostId)?.monthlyAmount || 0}
          category={costs.find(c => c.id === opportunityCostId)?.name || ''}
          onClose={() => setOpportunityCostId(null)}
          isRecurring={true}
        />
      )}
    </div>
  )
}
