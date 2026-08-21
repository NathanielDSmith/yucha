import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { db, type SpendingCategory } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { sumByCategory, startOfMonth } from '../lib/spending'
import { filterByDateRange } from '../lib/spending'
import { getPieChartColor } from '../lib/colors'
import type { Subscription } from '../lib/subscriptions'
import './SpendingPieChart.css'

interface PieSegment {
  categoryId: string
  name: string
  amount: number
  percentage: number
  color: string
  startAngle: number
  endAngle: number
  sliceAngle: number
}

interface HoverState {
  categoryId: string | null
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
        let categoryIndex = 0

        categoryTotals.forEach((amount, categoryId) => {
          const cat = categoryMap.get(categoryId)
          if (cat && amount > 0) {
            items.push({
              categoryId,
              name: cat.name,
              amount,
              percentage: 0, // Will calculate after summing
              color: getPieChartColor(categoryIndex, categoryId),
            })
            grandTotal += amount
            categoryIndex++
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

  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (loading || segments.length === 0) {
    return null
  }

  const outerRadius = 120
  const innerRadius = 70
  const cx = 150
  const cy = 150

  const pathData = (start: number, end: number, outer: number, inner: number) => {
    const startRad = (start * Math.PI) / 180
    const endRad = (end * Math.PI) / 180
    const x1 = cx + outer * Math.cos(startRad)
    const y1 = cy + outer * Math.sin(startRad)
    const x2 = cx + outer * Math.cos(endRad)
    const y2 = cy + outer * Math.sin(endRad)
    const x3 = cx + inner * Math.cos(endRad)
    const y3 = cy + inner * Math.sin(endRad)
    const x4 = cx + inner * Math.cos(startRad)
    const y4 = cy + inner * Math.sin(startRad)
    const largeArc = end - start > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${outer} ${outer} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${largeArc} 0 ${x4} ${y4} Z`
  }

  const hoveredSegment = pieData.find((s) => s.categoryId === hoveredId)

  return (
    <motion.div
      className="spending-pie-chart"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="spending-pie-chart__wrapper">
        <svg viewBox="0 0 300 300" className="spending-pie-chart__svg">
          {pieData.map((segment, idx) => (
            <g
              key={segment.categoryId}
              onMouseEnter={() => setHoveredId(segment.categoryId)}
              onMouseLeave={() => setHoveredId(null)}
              className="spending-pie-chart__segment"
              style={{ cursor: 'pointer' }}
            >
              <motion.path
                d={pathData(
                  segment.startAngle,
                  segment.endAngle,
                  hoveredId === segment.categoryId ? outerRadius + 15 : outerRadius,
                  innerRadius,
                )}
                fill={segment.color}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="spending-pie-chart__path"
              />
            </g>
          ))}
          <circle cx={cx} cy={cy} r={innerRadius - 5} fill="var(--color-page)" />
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

        {hoveredSegment && (
          <motion.div
            className="spending-pie-chart__tooltip"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="spending-pie-chart__tooltip-name">{hoveredSegment.name}</div>
            <div className="spending-pie-chart__tooltip-amount">
              {formatCurrency(hoveredSegment.amount, currency)}
            </div>
            <div className="spending-pie-chart__tooltip-percentage">
              {hoveredSegment.percentage.toFixed(1)}%
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
