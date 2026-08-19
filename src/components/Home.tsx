import { useEffect, useState } from 'react'
import { db } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { getEmergencyFundMetrics } from '../lib/emergency'
import { calculateBurnRateMetrics } from '../lib/burnrate'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'

interface HomeProps {
  onNavigate?: (tab: string) => void
}

export function Home({ onNavigate }: HomeProps) {
  const [primaryMetric, setPrimaryMetric] = useState<{
    label: string
    value: string
    message: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currency } = useCurrencyContext()

  useEffect(() => {
    loadMetrics()
  }, [])

  async function loadMetrics() {
    try {
      setIsLoading(true)
      setError(null)
      const settings = await db.appSettings.get(1)
      const spending = await db.spendingEntries.toArray()
      const emergencyFund = settings?.emergencyFundGoal
      const burnRate = settings?.burnRateBalance

      // Prioritize which metric to show
      if (emergencyFund) {
        const metrics = getEmergencyFundMetrics(emergencyFund, spending)
        const percent = Math.round(metrics.adequacyRatio * 100)
        setPrimaryMetric({
          label: 'Emergency Fund Progress',
          value: `${percent}%`,
          message: metrics.isAdequate
            ? `You're covered for ${metrics.monthsOfRunway.toFixed(1)} months 💚`
            : `${Math.ceil(metrics.monthsOfRunway)} months saved. Goal: 6 months.`,
        })
      } else if (burnRate) {
        const metrics = calculateBurnRateMetrics(burnRate, spending)
        const days = Math.floor(metrics.daysOfRunway)
        setPrimaryMetric({
          label: 'Runway Remaining',
          value: `${days} days`,
          message: `At your current pace, you have ${Math.floor(days / 30)} months left.`,
        })
      } else {
        setPrimaryMetric({
          label: 'Welcome to Yucha',
          value: 'Let\'s begin',
          message: 'Set up your emergency fund goal to get started.',
        })
      }
    } catch (err) {
      setError('Failed to load your financial snapshot. Please try again.')
      console.error('Failed to load home metrics:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading your financial snapshot..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadMetrics} />
  }

  return (
    <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
      <h2 style={{ margin: '0 0 var(--space-xl) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {primaryMetric?.label}
      </h2>
      <div style={{ fontSize: 'var(--font-size-5xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-2xl)', fontVariantNumeric: 'tabular-nums' }}>
        {primaryMetric?.value}
      </div>
      <p style={{ margin: '0 0 var(--space-2xl) 0', fontSize: 'var(--font-size-base)', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
        {primaryMetric?.message}
      </p>
      <div style={{ marginTop: 'var(--space-3xl)', display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => onNavigate?.('track-spending')}
          style={{ padding: 'var(--space-md) var(--space-lg)', background: 'var(--color-primary)', color: 'var(--color-text-inverse)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'var(--font-weight-semibold)' }}>
          + Log Spending
        </button>
        <button
          onClick={() => onNavigate?.('insights-net-worth')}
          style={{ padding: 'var(--space-md) var(--space-lg)', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'var(--font-weight-semibold)' }}>
          View Progress
        </button>
      </div>
    </div>
  )
}
