import { useEffect, useState, type FormEvent } from 'react'
import { db } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { useToast } from '../lib/toastStore'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { getEmergencyFundMetrics, RECOMMENDED_MONTHS, MINIMUM_MONTHS } from '../lib/emergency'
import './EmergencyFundTracker.css'

export function EmergencyFundTracker() {
  const { show: showToast } = useToast()
  const [emergencyFundGoal, setEmergencyFundGoal] = useState<number | null>(null)
  const [spendingEntries, setSpendingEntries] = useState([])
  const [newGoal, setNewGoal] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { currency } = useCurrencyContext()

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        await loadData()
      } catch (err) {
        setError('Failed to load emergency fund data. Please try again.')
        console.error('Failed to load emergency fund:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function loadData() {
    try {
      const entries = await db.spendingEntries.toArray()
      setSpendingEntries(entries)

      const settings = await db.appSettings.get(1)
      setEmergencyFundGoal(settings?.emergencyFundGoal ?? null)
      setError(null)
    } catch (err) {
      setError('Failed to load emergency fund data. Please try again.')
      console.error('Failed to load emergency fund:', err)
    }
  }

  async function handleSetGoal(e: FormEvent) {
    e.preventDefault()
    setValidationError(null)
    const amount = Number(newGoal)

    if (!amount || amount <= 0) {
      setValidationError('Emergency fund goal must be greater than 0')
      return
    }

    try {
      setSubmitting(true)
      await db.appSettings.update(1, { emergencyFundGoal: amount })
      setEmergencyFundGoal(amount)
      setNewGoal('')
      setValidationError(null)
      showToast('Emergency fund goal updated', 'success')
      await loadData()
    } catch (err) {
      showToast('Failed to update goal. Please try again.', 'error')
      console.error('Failed to set emergency fund goal:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading emergency fund..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />
  }

  const metrics = emergencyFundGoal ? getEmergencyFundMetrics(emergencyFundGoal, spendingEntries) : null

  const statusBadgeClass = `emergency-fund__status-badge emergency-fund__status-badge--${metrics?.status || 'critical'}`

  return (
    <div className="emergency-fund">
      {metrics && (
        <>
          <div className="emergency-fund__hero">
            <div className="emergency-fund__runway">
              <p className="emergency-fund__runway-label">Months of Runway</p>
              <p className="emergency-fund__runway-value">
                {metrics.monthsOfRunway.toFixed(1)}
              </p>
              <p className="emergency-fund__runway-sublabel">
                Based on recent spending
              </p>
            </div>

            <div className="emergency-fund__adequacy">
              <p className="emergency-fund__adequacy-label">
                Goal: {RECOMMENDED_MONTHS} Months
              </p>
              <div className="emergency-fund__progress-bar">
                <div
                  className="emergency-fund__progress-fill"
                  style={{ width: `${Math.min(100, metrics.adequacyRatio * 100)}%` }}
                >
                  {metrics.adequacyRatio > 0.1 && (
                    <p className="emergency-fund__progress-text">
                      {Math.round(metrics.adequacyRatio * 100)}%
                    </p>
                  )}
                </div>
              </div>
              <div className="emergency-fund__status">
                <span className={statusBadgeClass}>
                  {metrics.status}
                </span>
                <p className="emergency-fund__status-text">
                  {metrics.isAdequate
                    ? '✓ You\'re covered for 6+ months'
                    : `⚠ Need ${(RECOMMENDED_MONTHS * (emergencyFundGoal / (emergencyFundGoal / metrics.monthsOfRunway)) - emergencyFundGoal).toFixed(0)} more`}
                </p>
              </div>
            </div>
          </div>

          <div className="emergency-fund__metrics">
            <div className="emergency-fund__metric-card">
              <p className="emergency-fund__metric-label">Emergency Fund</p>
              <p className="emergency-fund__metric-value">
                {formatCurrency(emergencyFundGoal, currency)}
              </p>
            </div>
            <div className="emergency-fund__metric-card">
              <p className="emergency-fund__metric-label">Monthly Spending</p>
              <p className="emergency-fund__metric-value">
                {formatCurrency(
                  emergencyFundGoal / metrics.monthsOfRunway,
                  currency,
                )}
              </p>
            </div>
            <div className="emergency-fund__metric-card">
              <p className="emergency-fund__metric-label">Time to Depletion</p>
              <p className="emergency-fund__metric-value">
                {metrics.monthsOfRunway.toFixed(1)} mo
              </p>
            </div>
          </div>
        </>
      )}

      <form className="emergency-fund__form" onSubmit={handleSetGoal}>
        <input
          type="number"
          placeholder="Set your emergency fund goal"
          step="0.01"
          inputMode="decimal"
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          className="emergency-fund__input"
          id="emergency-fund-goal"
          name="emergency-fund-goal"
          disabled={submitting}
        />
        <select
          value={RECOMMENDED_MONTHS}
          disabled
          className="emergency-fund__select"
          id="emergency-fund-months"
          name="emergency-fund-months"
        >
          <option>{RECOMMENDED_MONTHS} months goal</option>
        </select>
        <button type="submit" className="emergency-fund__button" disabled={submitting}>
          {submitting ? 'Saving...' : emergencyFundGoal ? 'Update' : 'Set'} Goal
        </button>
        {validationError && <ErrorMessage message={validationError} />}
      </form>

      <div className="emergency-fund__info">
        <span className="emergency-fund__info-icon">ℹ️</span>
        <p className="emergency-fund__info-text">
          An emergency fund of {RECOMMENDED_MONTHS} months of expenses provides a safety net
          for unexpected events. We calculate this based on your actual spending patterns
          from the past 6 months.
        </p>
      </div>
    </div>
  )
}
