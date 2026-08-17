import { useEffect, useState, type FormEvent } from 'react'
import { db } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { calculateBurnRateMetrics, formatRunway } from '../lib/burnrate'
import './BurnRateTracker.css'

export function BurnRateTracker() {
  const [spendingEntries, setSpendingEntries] = useState([])
  const [currentBalance, setCurrentBalance] = useState<number | null>(null)
  const [newBalance, setNewBalance] = useState('')
  const { currency } = useCurrencyContext()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const entries = await db.spendingEntries.toArray()
    setSpendingEntries(entries)

    const settings = await db.appSettings.get(1)
    setCurrentBalance(settings?.burnRateBalance ?? null)
  }

  async function handleSetBalance(e: FormEvent) {
    e.preventDefault()
    const amount = Number(newBalance)
    if (!amount || amount <= 0) return

    await db.appSettings.update(1, { burnRateBalance: amount })
    setCurrentBalance(amount)
    setNewBalance('')
    await loadData()
  }

  const metrics = currentBalance ? calculateBurnRateMetrics(currentBalance, spendingEntries) : null

  let statusClass = 'burn-rate__status-banner--good'
  let statusIcon = '✓'
  let statusTitle = 'Runway stable'
  let statusMessage = ''

  if (metrics) {
    if (metrics.monthsOfRunway < 1) {
      statusClass = 'burn-rate__status-banner--critical'
      statusIcon = '⚠'
      statusTitle = 'Critical runway'
      statusMessage = `You have ${formatRunway(metrics.daysOfRunway)} of spending left.`
    } else if (metrics.monthsOfRunway < 3) {
      statusClass = 'burn-rate__status-banner--warning'
      statusIcon = '⚡'
      statusTitle = 'Limited runway'
      statusMessage = `${formatRunway(metrics.daysOfRunway)} remaining at current burn rate.`
    } else if (metrics.trend === 'accelerating') {
      statusClass = 'burn-rate__status-banner--warning'
      statusIcon = '📈'
      statusTitle = 'Spending accelerating'
      statusMessage = `Your burn rate increased ${metrics.trendPercentage.toFixed(1)}% vs last month.`
    } else {
      statusMessage = `${formatRunway(metrics.daysOfRunway)} of runway at current burn rate.`
    }
  }

  return (
    <div className="burn-rate">
      {metrics && (
        <>
          <div className="burn-rate__hero">
            <p className="burn-rate__hero-label">Time Until Depleted</p>
            <p className="burn-rate__hero-value">
              {formatRunway(metrics.daysOfRunway)}
            </p>
            <p className="burn-rate__hero-sublabel">at current spending pace</p>
          </div>

          <div className={`burn-rate__status-banner ${statusClass}`}>
            <span className="burn-rate__status-icon">{statusIcon}</span>
            <div className="burn-rate__status-content">
              <p className="burn-rate__status-title">{statusTitle}</p>
              <p className="burn-rate__status-text">{statusMessage}</p>
            </div>
          </div>

          <div className="burn-rate__metrics">
            <div className="burn-rate__metric-card">
              <p className="burn-rate__metric-label">Daily Burn</p>
              <p className="burn-rate__metric-value">
                {formatCurrency(metrics.dailyBurnRate, currency)}
              </p>
            </div>
            <div className="burn-rate__metric-card">
              <p className="burn-rate__metric-label">Monthly Burn</p>
              <p className="burn-rate__metric-value">
                {formatCurrency(metrics.monthlyBurnRate, currency)}
              </p>
              <div
                className={`burn-rate__trend burn-rate__trend--${metrics.trend}`}
              >
                {metrics.trend === 'accelerating' && '📈'}
                {metrics.trend === 'stable' && '➡️'}
                {metrics.trend === 'improving' && '📉'}
                {Math.abs(metrics.trendPercentage).toFixed(1)}%{' '}
                {metrics.trend}
              </div>
            </div>
            <div className="burn-rate__metric-card">
              <p className="burn-rate__metric-label">Current Balance</p>
              <p className="burn-rate__metric-value">
                {formatCurrency(currentBalance, currency)}
              </p>
            </div>
          </div>

          <div className="burn-rate__timeline">
            <p className="burn-rate__timeline-title">Runway Timeline</p>
            <div className="burn-rate__timeline-bar">
              <div
                className="burn-rate__timeline-fill"
                style={{
                  width: `${Math.min(100, (metrics.daysOfRunway / 180) * 100)}%`,
                }}
              />
            </div>
            <div className="burn-rate__timeline-markers">
              <div className="burn-rate__marker">
                <span>Today</span>
              </div>
              <div className="burn-rate__marker">
                <span>3 months</span>
              </div>
              <div className="burn-rate__marker">
                <span>6 months</span>
              </div>
            </div>
          </div>
        </>
      )}

      <form className="burn-rate__input-section" onSubmit={handleSetBalance}>
        <input
          type="number"
          placeholder="Enter your current available balance"
          step="0.01"
          inputMode="decimal"
          value={newBalance}
          onChange={(e) => setNewBalance(e.target.value)}
          className="burn-rate__input"
          id="burn-rate-balance"
          name="burn-rate-balance"
        />
        <input
          type="text"
          value="Current Balance"
          disabled
          className="burn-rate__input"
          id="burn-rate-label"
          name="burn-rate-label"
        />
        <button type="submit" className="burn-rate__button">
          {currentBalance ? 'Update' : 'Set'} Balance
        </button>
      </form>
    </div>
  )
}
