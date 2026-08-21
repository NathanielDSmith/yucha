import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { db } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { getEmergencyFundMetrics } from '../lib/emergency'
import type { Goal } from '../lib/goals'
import './FinancialHealthCard.css'

interface HealthMetric {
  label: string
  progress: number
  status: 'healthy' | 'warning' | 'critical'
  detail: string
}

export function FinancialHealthCard() {
  const { currency } = useCurrencyContext()
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMetrics() {
      try {
        const settings = await db.appSettings.get(1)
        const allGoals = await db.goals.toArray()
        const spending = await db.spendingEntries.toArray()

        const items: HealthMetric[] = []

        // Emergency Fund metric
        if (settings?.emergencyFundGoal) {
          const efMetrics = getEmergencyFundMetrics(settings.emergencyFundGoal, spending)
          const progress = Math.min(100, Math.round(efMetrics.adequacyRatio * 100))
          items.push({
            label: 'Emergency Fund',
            progress,
            status: progress >= 100 ? 'healthy' : progress >= 75 ? 'warning' : 'critical',
            detail: `${progress}% of target`,
          })
        }

        // Goals metric (completed / total)
        if (allGoals.length > 0) {
          const completed = allGoals.filter((g) => g.status === 'completed').length
          const progress = Math.round((completed / allGoals.length) * 100)
          items.push({
            label: 'Goals Progress',
            progress,
            status: progress >= 75 ? 'healthy' : progress >= 50 ? 'warning' : 'critical',
            detail: `${completed} of ${allGoals.length} completed`,
          })
        }

        // Burn Rate (if set)
        if (settings?.burnRateBalance) {
          const monthlySpending = spending.reduce((sum, s) => sum + s.amount, 0) / 12 // Approximate
          const monthsRemaining = monthlySpending > 0 ? settings.burnRateBalance / monthlySpending : 0
          const progress = Math.min(100, Math.round((monthsRemaining / 12) * 100)) // 12 months = healthy
          items.push({
            label: 'Runway',
            progress,
            status: progress >= 75 ? 'healthy' : progress >= 50 ? 'warning' : 'critical',
            detail: `~${monthsRemaining.toFixed(1)} months`,
          })
        }

        setMetrics(items)
      } catch (err) {
        console.error('Failed to load health metrics:', err)
      } finally {
        setLoading(false)
      }
    }
    loadMetrics()
  }, [])

  if (loading || metrics.length === 0) {
    return null
  }

  return (
    <motion.div
      className="financial-health-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h3 className="financial-health-card__title">Financial Health</h3>
      <div className="financial-health-card__metrics">
        {metrics.map((metric, idx) => (
          <div key={metric.label} className={`financial-health-card__metric financial-health-card__metric--${metric.status}`}>
            <div className="financial-health-card__metric-header">
              <span className="financial-health-card__metric-label">{metric.label}</span>
              <span className="financial-health-card__metric-detail">{metric.detail}</span>
            </div>
            <motion.div
              className="financial-health-card__progress-bar"
              initial={{ width: 0 }}
              animate={{ width: `${metric.progress}%` }}
              transition={{ delay: 0.3 + idx * 0.1, duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  )
}
