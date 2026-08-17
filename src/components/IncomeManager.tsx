import { useEffect, useState, type FormEvent } from 'react'
import { db } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { calculateTotalMonthlyIncome, calculateIncomeRange, type IncomeSource, type IncomeType, type IncomeFrequency } from '../lib/income'
import './IncomeManager.css'

const INCOME_TYPES: Record<IncomeType, string> = {
  job: 'Full-time Job',
  'side-gig': 'Side Gig',
  investment: 'Investment',
  other: 'Other',
}

const FREQUENCIES: IncomeFrequency[] = ['weekly', 'biweekly', 'monthly', 'yearly']

export function IncomeManager() {
  const [sources, setSources] = useState<IncomeSource[]>([])
  const [name, setName] = useState('')
  const [type, setType] = useState<IncomeType>('job')
  const [amount, setAmount] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [frequency, setFrequency] = useState<IncomeFrequency>('monthly')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [isVariable, setIsVariable] = useState(false)
  const { currency } = useCurrencyContext()

  async function refresh() {
    const all = await db.incomeSources.toArray()
    setSources(all)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsedAmount = Number(amount)
    const parsedMin = minAmount ? Number(minAmount) : undefined
    const parsedMax = maxAmount ? Number(maxAmount) : undefined

    if (!name.trim() || !parsedAmount || parsedAmount <= 0) return

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
    setAmount('')
    setMinAmount('')
    setMaxAmount('')
    setIsVariable(false)
    await refresh()
  }

  async function toggleActive(id: string, currentActive: boolean) {
    await db.incomeSources.update(id, { isActive: !currentActive })
    await refresh()
  }

  async function removeSource(id: string) {
    await db.incomeSources.delete(id)
    await refresh()
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
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value as IncomeType)}
          className="income-manager__select"
        >
          {Object.entries(INCOME_TYPES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as IncomeFrequency)}
          className="income-manager__select"
        >
          {FREQUENCIES.map((freq) => (
            <option key={freq} value={freq}>
              {freq.charAt(0).toUpperCase() + freq.slice(1)}
            </option>
          ))}
        </select>

        {frequency === 'monthly' && (
          <input
            type="number"
            min="1"
            max="31"
            placeholder="Day of month"
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
            className="income-manager__input"
          />
        )}

        <div className="income-manager__amount-section">
          <label className="income-manager__checkbox-label">
            <input
              type="checkbox"
              checked={isVariable}
              onChange={(e) => setIsVariable(e.target.checked)}
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
              />
              <input
                type="number"
                step="0.01"
                placeholder="Max amount"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="income-manager__input"
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
            />
          )}
        </div>

        <button type="submit" className="income-manager__button">
          Add Income
        </button>
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
    </div>
  )
}
