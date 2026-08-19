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
    return <ErrorMessage message={error} onRetry={loadDashboard} />
  }

  const currentGoal = goals[currentGoalIndex]
  const nextUpcomingBills = subscriptions
    .sort((a, b) => {
      const aDay = parseInt(a.startDate.split('-')[2])
      const bDay = parseInt(b.startDate.split('-')[2])
      return aDay - bDay
    })
    .slice(0, 3)

  const ordinal = (n: number) => {
    if (n % 100 >= 11 && n % 100 <= 13) return n + 'th'
    const lastDigit = n % 10
    if (lastDigit === 1) return n + 'st'
    if (lastDigit === 2) return n + 'nd'
    if (lastDigit === 3) return n + 'rd'
    return n + 'th'
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
            {formatCurrency(totalSpending, currency)}
          </motion.div>
        </div>

        <div style={{ padding: 'var(--space-lg)', background: 'var(--color-surface-1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Monthly Subscriptions</p>
          <motion.div
            style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginTop: 'var(--space-sm)' }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {formatCurrency(subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0), currency)}
          </motion.div>
        </div>

        <div style={{ padding: 'var(--space-lg)', background: 'var(--color-surface-1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Emergency Fund</p>
          <motion.div
            style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginTop: 'var(--space-sm)' }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.25 }}
          >
            {emergencyFundPercent}%
          </motion.div>
        </div>
      </motion.div>

      {/* Goals Carousel */}
      {goals.length > 0 && currentGoal && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            padding: 'var(--space-2xl)',
            background: 'var(--color-surface-1)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            marginBottom: 'var(--space-3xl)',
          }}
        >
          <p style={{ margin: '0 0 var(--space-md) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Goal Progress</p>
          <motion.div
            key={currentGoal.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 style={{ margin: '0 0 var(--space-sm) 0', fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)' }}>
              {currentGoal.name}
            </h3>
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                <span>{formatCurrency(currentGoal.currentAmount, currency)}</span>
                <span>{Math.round((currentGoal.currentAmount / currentGoal.targetAmount) * 100)}%</span>
              </div>
              <div style={{ background: 'var(--color-page)', borderRadius: 'var(--radius-sm)', height: '8px', overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', background: 'var(--color-primary)', borderRadius: 'var(--radius-sm)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((currentGoal.currentAmount / currentGoal.targetAmount) * 100, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              Target: {formatCurrency(currentGoal.targetAmount, currency)}
            </p>
          </motion.div>
          <div style={{ marginTop: 'var(--space-lg)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Goal {currentGoalIndex + 1} of {goals.length}
          </div>
        </motion.div>
      )}

      {/* Upcoming Bills */}
      {nextUpcomingBills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            padding: 'var(--space-2xl)',
            background: 'var(--color-surface-1)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          <p style={{ margin: '0 0 var(--space-lg) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Upcoming Bills</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {nextUpcomingBills.map((bill) => {
              const day = parseInt(bill.startDate.split('-')[2])
              return (
                <motion.div
                  key={bill.id}
                  whileHover={{ x: 4 }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--color-border)' }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                      {bill.name}
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                      Due on the {ordinal(day)}
                    </p>
                  </div>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                    {formatCurrency(bill.monthlyAmount, currency)}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
