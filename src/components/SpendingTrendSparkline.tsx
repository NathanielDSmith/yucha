import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { db } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { parseLocalDate } from '../lib/dates'
import './SpendingTrendSparkline.css'

interface DayData {
  date: string
  amount: number
}

export function SpendingTrendSparkline() {
  const { currency } = useCurrencyContext()
  const [days, setDays] = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTrend() {
      try {
        const entries = await db.spendingEntries.toArray()
        const subs = await db.subscriptions.toArray()

        // Get last 30 days
        const today = new Date()
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(today.getDate() - 29)

        // Create a map of day -> total
        const dailyTotals = new Map<string, number>()

        // Add spending entries
        for (const entry of entries) {
          const entryDate = parseLocalDate(entry.date)
          if (entryDate >= thirtyDaysAgo && entryDate <= today) {
            const dateStr = entry.date
            dailyTotals.set(dateStr, (dailyTotals.get(dateStr) ?? 0) + entry.amount)
          }
        }

        // Add subscriptions (recurring daily amount)
        for (const sub of subs) {
          const subStart = parseLocalDate(sub.startDate)
          if (subStart <= today) {
            const dailyAmount = sub.monthlyAmount / 30

            for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
              if (d >= subStart) {
                const dateStr = d.toISOString().split('T')[0]
                dailyTotals.set(dateStr, (dailyTotals.get(dateStr) ?? 0) + dailyAmount)
              }
            }
          }
        }

        // Build complete 30-day array
        const result: DayData[] = []
        for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0]
          result.push({
            date: dateStr,
            amount: dailyTotals.get(dateStr) ?? 0,
          })
        }

        setDays(result)
      } catch (err) {
        console.error('Failed to load spending trend:', err)
      } finally {
        setLoading(false)
      }
    }
    loadTrend()
  }, [])

  if (loading || days.length === 0) {
    return null
  }

  const maxAmount = Math.max(...days.map((d) => d.amount), 1)
  const avgAmount = days.reduce((sum, d) => sum + d.amount, 0) / days.length

  // Create SVG sparkline
  const points = days.map((day, idx) => {
    const x = (idx / (days.length - 1)) * 300
    const y = 50 - (day.amount / maxAmount) * 40
    return `${x},${y}`
  })

  const polylinePoints = points.join(' ')

  return (
    <motion.div
      className="spending-trend-sparkline"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <h3 className="spending-trend-sparkline__title">30-Day Trend</h3>
      <div className="spending-trend-sparkline__chart">
        <svg viewBox="0 0 300 80" className="spending-trend-sparkline__svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="trend-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          <polyline points={polylinePoints} fill="none" stroke="var(--color-primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" />

          <motion.polyline
            points={polylinePoints}
            fill="url(#trend-gradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          />
        </svg>
      </div>

      <div className="spending-trend-sparkline__stats">
        <div className="spending-trend-sparkline__stat">
          <span className="spending-trend-sparkline__stat-label">Average</span>
          <span className="spending-trend-sparkline__stat-value">{formatCurrency(avgAmount, currency)}</span>
        </div>
        <div className="spending-trend-sparkline__stat">
          <span className="spending-trend-sparkline__stat-label">Peak Day</span>
          <span className="spending-trend-sparkline__stat-value">{formatCurrency(maxAmount, currency)}</span>
        </div>
      </div>
    </motion.div>
  )
}
