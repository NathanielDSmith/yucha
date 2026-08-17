import { useMemo, useState } from 'react'
import {
  DEFAULT_ANNUAL_RETURN_RATE,
  projectCompoundGrowth,
} from '../lib/compounding'
import { formatCurrency } from '../lib/currency'
import './QuickCheck.css'

export function QuickCheck() {
  const [amount, setAmount] = useState('')
  const [years, setYears] = useState('10')
  const [ratePercent, setRatePercent] = useState(DEFAULT_ANNUAL_RETURN_RATE * 100)

  const projection = useMemo(() => {
    const parsedAmount = Number(amount) || 0
    const parsedYears = Number(years) || 0
    if (parsedAmount <= 0 || parsedYears <= 0) return null
    return projectCompoundGrowth(parsedAmount, parsedYears, ratePercent / 100)
  }, [amount, years, ratePercent])

  return (
    <div className="quick-check">
      <section className="quick-check__card">
        <h2>What could this purchase become?</h2>
        <p className="quick-check__lead">
          Enter an amount and see what it might grow to if invested instead.
        </p>

        <div className="quick-check__form">
          <div className="quick-check__input-group">
            <label htmlFor="qc-amount">Amount to invest</label>
            <input
              id="qc-amount"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>

          <div className="quick-check__input-group">
            <label htmlFor="qc-years">Time horizon (years)</label>
            <input
              id="qc-years"
              type="number"
              inputMode="numeric"
              value={years}
              min="1"
              max="80"
              onChange={(e) => setYears(e.target.value)}
            />
          </div>

          <div className="quick-check__input-group">
            <label htmlFor="qc-rate">Annual return (%)</label>
            <input
              id="qc-rate"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={ratePercent}
              onChange={(e) => setRatePercent(Number(e.target.value) || 0)}
            />
          </div>
        </div>

        {projection && (
          <div className="quick-check__result">
            <div className="quick-check__value">
              <span className="quick-check__label">Projected value</span>
              <strong>{formatCurrency(projection.futureValue)}</strong>
            </div>
            <div className="quick-check__growth">
              <span className="quick-check__label">Growth</span>
              <strong>+{formatCurrency(projection.totalGrowth)}</strong>
            </div>
          </div>
        )}

        <p className="quick-check__disclaimer">
          This is arithmetic on assumptions you set, not a prediction or
          investment advice. Real returns vary and are never guaranteed.
        </p>
      </section>
    </div>
  )
}
