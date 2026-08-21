import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { db, type SpendingCategory } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { sumByCategory, startOfMonth } from '../lib/spending'
import { filterByDateRange } from '../lib/spending'
import type { Subscription } from '../lib/subscriptions'
import './SpendingPieChart.css'

interface PieSegment {
  categoryId: string
  name: string
  amount: number
  percentage: number
  color: string
}

export function SpendingPieChart() {
  const { currency } = useCurrencyContext()
  const [segments, setSegments] = useState<PieSegment[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const categories = await db.spendingCategories.toArray()
        const allEntries = await db.spendingEntries.toArray()
        const subs = await db.subscriptions.toArray()

        // Filter to current month only
        const monthStart = startOfMonth()
        const monthEnd = new Date()
        const monthEntries = filterByDateRange(allEntries, monthStart, monthEnd)

        // Sum by category
        const categoryTotals = new Map<string, number>()
        const spendingTotals = sumByCategory(monthEntries)
        for (const { categoryId, total: amt } of spendingTotals) {
          categoryTotals.set(categoryId, (categoryTotals.get(categoryId) ?? 0) + amt)
        }

        // Add active subscriptions (recurring)
        const today = new Date()
        for (const sub of subs) {
          const subStart = new Date(sub.startDate)
          if (subStart <= today) {
            categoryTotals.set(sub.categoryId, (categoryTotals.get(sub.categoryId) ?? 0) + sub.monthlyAmount)
          }
        }

        // Convert to segments with colors
        const categoryMap = new Map(categories.map((c) => [c.id, c]))
        let grandTotal = 0
        const items: PieSegment[] = []

        categoryTotals.forEach((amount, categoryId) => {
          const cat = categoryMap.get(categoryId)
          if (cat && amount > 0) {
            items.push({
              categoryId,
              name: cat.name,
              amount,
              percentage: 0, // Will calculate after summing
              color: cat.color,
            })
            grandTotal += amount
          }
        })

        // Calculate percentages
        items.forEach((item) => {
          item.percentage = grandTotal > 0 ? (item.amount / grandTotal) * 100 : 0
        })

        // Sort by amount (largest first)
        items.sort((a, b) => b.amount - a.amount)

        setSegments(items)
        setTotal(grandTotal)
      } catch (err) {
        console.error('Failed to load pie chart data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const pieData = useMemo(() => {
    let currentAngle = -90 // Start at top
    return segments.map((segment) => {
      const sliceAngle = (segment.percentage / 100) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + sliceAngle
      currentAngle = endAngle
      return { ...segment, startAngle, endAngle, sliceAngle }
    })
  }, [segments])

  if (loading || segments.length === 0) {
    return null
  }

  const radius = 60
  const cx = 100
  const cy = 100

  const pathData = (start: number, end: number) => {
    const startRad = (start * Math.PI) / 180
    const endRad = (end * Math.PI) / 180
    const x1 = cx + radius * Math.cos(startRad)
    const y1 = cy + radius * Math.sin(startRad)
    const x2 = cx + radius * Math.cos(endRad)
    const y2 = cy + radius * Math.sin(endRad)
    const largeArc = end - start > 180 ? 1 : 0
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
  }

  return (
    <motion.div
      className="spending-pie-chart"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="spending-pie-chart__container">
        <div className="spending-pie-chart__chart">
          <svg viewBox="0 0 200 200" className="spending-pie-chart__svg">
            {pieData.map((segment, idx) => (
              <motion.path
                key={segment.categoryId}
                d={pathData(segment.startAngle, segment.endAngle)}
                fill={segment.color}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
              />
            ))}
            <circle cx={cx} cy={cy} r={35} fill="var(--color-page)" />
            <text
              x={cx}
              y={cy - 8}
              textAnchor="middle"
              className="spending-pie-chart__total-label"
            >
              Total
            </text>
            <text
              x={cx}
              y={cy + 12}
              textAnchor="middle"
              className="spending-pie-chart__total-amount"
            >
              {formatCurrency(total, currency)}
            </text>
          </svg>
        </div>

        <div className="spending-pie-chart__legend">
          {segments.map((segment) => (
            <div key={segment.categoryId} className="spending-pie-chart__legend-item">
              <div className="spending-pie-chart__color-box" style={{ backgroundColor: segment.color }} />
              <div className="spending-pie-chart__legend-info">
                <div className="spending-pie-chart__category-name">{segment.name}</div>
                <div className="spending-pie-chart__category-amount">
                  {formatCurrency(segment.amount, currency)} ({segment.percentage.toFixed(0)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
