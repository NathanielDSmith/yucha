import { useEffect, useState, type FormEvent } from 'react'
import { db } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { calculateTotalMonthlyIncome, calculateIncomeRange, type IncomeSource, type IncomeType, type IncomeFrequency } from '../lib/income'
import { useToast } from '../lib/toastStore'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { DayOfMonthPicker } from './DayOfMonthPicker'
import './IncomeManager.css'

const INCOME_TYPES: Record<IncomeType, string> = {
  job: 'Full-time Job',
  'side-gig': 'Side Gig',
  investment: 'Investment',
  other: 'Other',
}

const FREQUENCIES: IncomeFrequency[] = ['weekly', 'biweekly', 'monthly', 'yearly']

export function IncomeManager() {
  const { show: showToast } = useToast()
  const [sources, setSources] = useState<IncomeSource[]>([])
  const [name, setName] = useState('')
  const [type, setType] = useState<IncomeType | ''>('')
  const [amount, setAmount] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [frequency, setFrequency] = useState<IncomeFrequency | ''>('')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [isVariable, setIsVariable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState<IncomeType | ''>('')
  const [editAmount, setEditAmount] = useState('')
  const [editMinAmount, setEditMinAmount] = useState('')
  const [editMaxAmount, setEditMaxAmount] = useState('')
  const [editFrequency, setEditFrequency] = useState<IncomeFrequency | ''>('')
  const [editDayOfMonth, setEditDayOfMonth] = useState('1')
  const [editIsVariable, setEditIsVariable] = useState(false)
  const [editValidationError, setEditValidationError] = useState<string | null>(null)
  const { currency } = useCurrencyContext()

  async function refresh() {
    try {
      const all = await db.incomeSources.toArray()
      setSources(all)
      setError(null)
    } catch (err) {
      setError('Failed to load income sources. Please try again.')
      console.error('Failed to load income sources:', err)
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
        console.error('Failed to load income data:', err)
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
    const parsedMin = minAmount ? Number(minAmount) : undefined
    const parsedMax = maxAmount ? Number(maxAmount) : undefined

    if (!name.trim()) {
      setValidationError('Income source name is required')
      return
    }
    if (!type) {
      setValidationError('Job type is required')
      return
    }
    if (!frequency) {
      setValidationError('Frequency is required')
      return
    }

    // Validate amount based on variable income setting
    if (isVariable) {
      if (!parsedMin || !parsedMax || parsedMin <= 0 || parsedMax <= 0) {
        setValidationError('Min and max amounts must be greater than 0')
        return
      }
    } else {
      if (!parsedAmount || parsedAmount <= 0) {
        setValidationError('Amount must be greater than 0')
        return
      }
    }

    try {
      setSubmitting(true)
      const source: IncomeSource = {
        id: crypto.randomUUID(),
        name: name.trim(),
        type,
        amount: parsedAmount,
        minAmount: isVariable ? parsedMin : undefined,
        maxAmount: isVariable ? parsedMax : undefined,
        frequency,
        dayOfMonth: frequency === 'monthly' ? Number(dayOfMonth) : undefined,
        startDate: new Date().toISOString().split('T')[0],
        isActive: true,
        createdAt: new Date().toISOString(),
      }

      await db.incomeSources.add(source)
      setName('')
      setType('')
      setAmount('')
      setMinAmount('')
      setMaxAmount('')
      setFrequency('')
      setIsVariable(false)
      setValidationError(null)
      showToast('Income source added', 'success')
      await refresh()
    } catch (err) {
      showToast('Failed to add income source. Please try again.', 'error')
      console.error('Failed to add income source:', err)
    } finally {
      setSubmitting(false)
    }
  }

  function openEditModal(source: IncomeSource) {
    setEditingId(source.id)
    setEditName(source.name)
    setEditType(source.type)
    setEditAmount(String(source.amount || ''))
    setEditMinAmount(String(source.minAmount || ''))
    setEditMaxAmount(String(source.maxAmount || ''))
    setEditFrequency(source.frequency)
    setEditDayOfMonth(String(source.dayOfMonth || '1'))
    setEditIsVariable(!!(source.minAmount && source.maxAmount))
    setEditValidationError(null)
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault()
    setEditValidationError(null)
    const parsedAmount = Number(editAmount)
    const parsedMin = editMinAmount ? Number(editMinAmount) : undefined
    const parsedMax = editMaxAmount ? Number(editMaxAmount) : undefined

    if (!editName.trim()) {
      setEditValidationError('Income source name is required')
      return
    }
    if (!editType) {
      setEditValidationError('Job type is required')
      return
    }
    if (!editFrequency) {
      setEditValidationError('Frequency is required')
      return
    }

    if (editIsVariable) {
      if (!parsedMin || !parsedMax || parsedMin <= 0 || parsedMax <= 0) {
        setEditValidationError('Min and max amounts must be greater than 0')
        return
      }
    } else {
      if (!parsedAmount || parsedAmount <= 0) {
        setEditValidationError('Amount must be greater than 0')
        return
      }
    }

    try {
      setSubmitting(true)
      await db.incomeSources.update(editingId!, {
        name: editName.trim(),
        type: editType,
        amount: editIsVariable ? undefined : parsedAmount,
        minAmount: editIsVariable ? parsedMin : undefined,
        maxAmount: editIsVariable ? parsedMax : undefined,
        frequency: editFrequency,
        dayOfMonth: editFrequency === 'monthly' ? Number(editDayOfMonth) : undefined,
      })
      showToast('Income source updated', 'success')
      setEditingId(null)
      await refresh()
    } catch (err) {
      showToast('Failed to update income source. Please try again.', 'error')
      console.error('Failed to update income source:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    try {
      await db.incomeSources.update(id, { isActive: !currentActive })
      showToast('Income source updated', 'success')
      await refresh()
    } catch (err) {
      showToast('Failed to update income source. Please try again.', 'error')
      console.error('Failed to toggle income source:', err)
    }
  }

  async function removeSource(id: string) {
    try {
      await db.incomeSources.delete(id)
      showToast('Income source removed', 'success')
      await refresh()
    } catch (err) {
      showToast('Failed to remove income source. Please try again.', 'error')
      console.error('Failed to remove income source:', err)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading income sources..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refresh} />
  }

  const totalMonthly = calculateTotalMonthlyIncome(sources)
  const incomeRange = calculateIncomeRange(sources)

  return (
    <div className="income-manager">
      <div className="income-manager__summary">
        <div className="income-manager__metric">
          <span className="income-manager__label">Monthly Income</span>
          <strong className="income-manager__amount">{formatCurrency(totalMonthly, currency)}</strong>
        </div>
        {incomeRange.min !== incomeRange.max && (
          <div className="income-manager__metric">
            <span className="income-manager__label">Range (Variable)</span>
            <strong className="income-manager__amount">
              {formatCurrency(incomeRange.min, currency)} – {formatCurrency(incomeRange.max, currency)}
            </strong>
          </div>
        )}
      </div>

      <form className="income-manager__form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Income source (e.g., Software Engineer at Acme)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="income-manager__input"
          disabled={submitting}
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value as IncomeType | '')}
          className="income-manager__select"
          disabled={submitting}
        >
          <option value="" disabled hidden>
            Job type
          </option>
          {Object.entries(INCOME_TYPES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as IncomeFrequency | '')}
          className="income-manager__select"
          disabled={submitting}
        >
          <option value="" disabled hidden>
            Frequency
          </option>
          {FREQUENCIES.map((freq) => (
            <option key={freq} value={freq}>
              {freq.charAt(0).toUpperCase() + freq.slice(1)}
            </option>
          ))}
        </select>

        {frequency === 'monthly' && (
          <DayOfMonthPicker
            value={Number(dayOfMonth)}
            onChange={(day) => setDayOfMonth(String(day))}
          />
        )}

        <div className="income-manager__amount-section">
          <label className="income-manager__checkbox-label">
            <input
              type="checkbox"
              checked={isVariable}
              onChange={(e) => setIsVariable(e.target.checked)}
              disabled={submitting}
            />
            Variable income
          </label>

          {isVariable ? (
            <>
              <input
                type="number"
                step="0.01"
                placeholder="Min amount"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="income-manager__input"
                disabled={submitting}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Max amount"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="income-manager__input"
                disabled={submitting}
              />
            </>
          ) : (
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="income-manager__input"
              disabled={submitting}
            />
          )}
        </div>

        <button type="submit" className="income-manager__button" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Income'}
        </button>
        {validationError && <ErrorMessage message={validationError} />}
      </form>

      {sources.length === 0 && (
        <div className="income-manager__empty">
          <p>No income sources yet. Add your primary job, side gigs, or investments.</p>
        </div>
      )}

      <div className="income-manager__list">
        {sources.map((source) => (
          <div key={source.id} className="income-manager__card">
            <div className="income-manager__card-header">
              <div>
                <h3 className="income-manager__card-name">{source.name}</h3>
                <span className="income-manager__card-type">{INCOME_TYPES[source.type]}</span>
              </div>
              <div className="income-manager__card-actions">
                <button
                  type="button"
                  onClick={() => toggleActive(source.id, source.isActive)}
                  className={`income-manager__toggle ${source.isActive ? 'income-manager__toggle--active' : ''}`}
                  aria-label={`${source.isActive ? 'Disable' : 'Enable'} ${source.name}`}
                  title={source.isActive ? 'Disable income' : 'Enable income'}
                >
                  {source.isActive ? '✓' : '○'}
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(source)}
                  className="income-manager__edit"
                  aria-label={`Edit ${source.name}`}
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => removeSource(source.id)}
                  className="income-manager__delete"
                  aria-label={`Delete ${source.name}`}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="income-manager__stats">
              <div>
                <span>Frequency</span>
                <strong>{source.frequency}</strong>
              </div>
              <div>
                <span>Amount</span>
                <strong>
                  {source.minAmount && source.maxAmount
                    ? `${formatCurrency(source.minAmount, currency)} – ${formatCurrency(source.maxAmount, currency)}`
                    : formatCurrency(source.amount, currency)}
                </strong>
              </div>
              {source.dayOfMonth && (
                <div>
                  <span>Arrives</span>
                  <strong>Day {source.dayOfMonth}</strong>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {editingId && (
        <div className="income-manager__modal-overlay" onClick={() => setEditingId(null)}>
          <div className="income-manager__modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Income Source</h2>
            <form className="income-manager__edit-form" onSubmit={handleEditSubmit}>
              <label>
                <span>Income Source Name</span>
                <input
                  type="text"
                  placeholder="e.g., Software Engineer at Acme"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={submitting}
                  autoFocus
                  aria-describedby={editValidationError ? 'edit-validation-error' : undefined}
                />
              </label>

              <label>
                <span>Job Type</span>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as IncomeType | '')}
                  disabled={submitting}
                  aria-describedby={editValidationError ? 'edit-validation-error' : undefined}
                >
                  <option value="" disabled hidden>Job type</option>
                  {Object.entries(INCOME_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Frequency</span>
                <select
                  value={editFrequency}
                  onChange={(e) => setEditFrequency(e.target.value as IncomeFrequency | '')}
                  disabled={submitting}
                  aria-describedby={editValidationError ? 'edit-validation-error' : undefined}
                >
                  <option value="" disabled hidden>Frequency</option>
                  {FREQUENCIES.map((freq) => (
                    <option key={freq} value={freq}>
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              {editFrequency === 'monthly' && (
                <label>
                  <span>Day of Month</span>
                  <DayOfMonthPicker
                    value={Number(editDayOfMonth)}
                    onChange={(day) => setEditDayOfMonth(String(day))}
                  />
                </label>
              )}

              <label className="income-manager__checkbox-label">
                <input
                  type="checkbox"
                  checked={editIsVariable}
                  onChange={(e) => setEditIsVariable(e.target.checked)}
                  disabled={submitting}
                />
                Variable income
              </label>

              {editIsVariable ? (
                <>
                  <label>
                    <span>Min Amount</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Min amount"
                      value={editMinAmount}
                      onChange={(e) => setEditMinAmount(e.target.value)}
                      disabled={submitting}
                    />
                  </label>
                  <label>
                    <span>Max Amount</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Max amount"
                      value={editMaxAmount}
                      onChange={(e) => setEditMaxAmount(e.target.value)}
                      disabled={submitting}
                    />
                  </label>
                </>
              ) : (
                <label>
                  <span>Amount</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    disabled={submitting}
                  />
                </label>
              )}

              {editValidationError && (
                <ErrorMessage message={editValidationError} />
              )}

              <div className="income-manager__modal-actions">
                <button
                  type="button"
                  className="income-manager__modal-cancel"
                  onClick={() => setEditingId(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
