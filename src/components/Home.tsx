import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { db } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { getEmergencyFundMetrics } from '../lib/emergency'
import type { Goal } from '../lib/goals'
import type { Subscription } from '../lib/subscriptions'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { GoalsCarousel } from './GoalsCarousel'
import { UpcomingBills } from './UpcomingBills'

interface HomeProps {
  onNavigate?: (tab: string) => void
}

export function Home({ onNavigate }: HomeProps) {
  const [totalSpending, setTotalSpending] = useState(0)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [emergencyFundPercent, setEmergencyFundPercent] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currency } = useCurrencyContext()

  useEffect(() => {
    loadDashboard()
  }, [])

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
    return <ErrorMessage message={error} onRetry={loadDashboard} />
  }

  return (
    <div style={{ padding: 'var(--space-2xl)' }}>
      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-lg)',
          marginBottom: 'var(--space-3xl)',
        }}
      >
        <div style={{ padding: 'var(--space-lg)', background: 'var(--color-surface-1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Total Spending</p>
          <motion.div
            style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginTop: 'var(--space-sm)' }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {formatCurrency(totalSpending + subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0), currency)}
          </motion.div>
        </div>

        <div style={{ padding: 'var(--space-lg)', background: 'var(--color-surface-1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Monthly Recurring Costs</p>
          <motion.div
            style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginTop: 'var(--space-sm)' }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {formatCurrency(subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0), currency)}
          </motion.div>
        </div>

        <div style={{ padding: 'var(--space-lg)', background: emergencyFundPercent >= 100 ? 'var(--color-success-wash)' : 'var(--color-surface-1)', borderRadius: 'var(--radius-md)', border: emergencyFundPercent >= 100 ? '1px solid var(--color-success)' : '1px solid var(--color-border)' }}>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Emergency Fund</p>
          <motion.div
            style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: emergencyFundPercent >= 100 ? 'var(--color-success)' : 'var(--color-text-primary)', marginTop: 'var(--space-sm)' }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.25 }}
          >
            {emergencyFundPercent}% {emergencyFundPercent >= 100 && '✓'}
          </motion.div>
        </div>
      </motion.div>

      {/* Goals Carousel */}
      <GoalsCarousel goals={goals} currency={currency} />

      {/* Upcoming Bills */}
      <UpcomingBills subscriptions={subscriptions} currency={currency} />
    </div>
  )
}
