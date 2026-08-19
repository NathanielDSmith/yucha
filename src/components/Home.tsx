import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
  const [totalSpending, setTotalSpending] = useState(0)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0)
  const [emergencyFundPercent, setEmergencyFundPercent] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currency } = useCurrencyContext()

  useEffect(() => {
    loadDashboard()
    const interval = setInterval(() => {
      setCurrentGoalIndex(prev => (prev + 1) % Math.max(goals.length, 1))
    }, 5000)
    return () => clearInterval(interval)
  }, [goals.length])

  async function loadDashboard() {
    try {
      setIsLoading(true)
      setError(null)
      const settings = await db.appSettings.get(1)
      const spending = await db.spendingEntries.toArray()
      const subs = await db.subscriptions.toArray()
      const allGoals = await db.goals.toArray()

      setTotalSpending(spending.reduce((sum, s) => sum + s.amount, 0))
      setSubscriptions(subs)
      setGoals(allGoals.sort((a, b) => a.priority - b.priority))

      if (settings?.emergencyFundGoal) {
        const metrics = getEmergencyFundMetrics(settings.emergencyFundGoal, spending)
        setEmergencyFundPercent(Math.round(metrics.adequacyRatio * 100))
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
