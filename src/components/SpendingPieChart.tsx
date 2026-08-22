import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { db } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { sumByCategory, startOfMonth, filterByDateRange } from '../lib/spending'
import { getPieChartColor } from '../lib/colors'
import type { Subscription } from '../lib/subscriptions'
import './SpendingPieChart.css'

function CustomLegend(props: any) {
  const { payload } = props
  if (!payload) return null

  return (
    <div className="spending-pie-chart__custom-legend">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="spending-pie-chart__legend-item">
          <div
            className="spending-pie-chart__legend-dot"
            style={{ backgroundColor: entry.color }}
          />
          <span className="spending-pie-chart__legend-label">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

interface PieData {
  name: string
  value: number
  categoryId: string
  color: string
}

export function SpendingPieChart() {
  const { currency } = useCurrencyContext()
  const [data, setData] = useState<PieData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

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

        // Convert to recharts format
        const categoryMap = new Map(categories.map((c) => [c.id, c]))
        let grandTotal = 0
        const items: PieData[] = []
        let categoryIndex = 0

        categoryTotals.forEach((amount, categoryId) => {
          const cat = categoryMap.get(categoryId)
          if (cat && amount > 0) {
            items.push({
              name: cat.name,
              value: Math.round(amount * 100) / 100,
              categoryId,
              color: getPieChartColor(categoryIndex, categoryId),
            })
            grandTotal += amount
            categoryIndex++
          }
        })

        // Sort by value (largest first)
        items.sort((a, b) => b.value - a.value)

        setData(items)
        setTotal(grandTotal)
      } catch (err) {
        console.error('Failed to load pie chart data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return null
  }

  if (data.length === 0) {
    return null
  }

  return (
    <motion.div
      className="spending-pie-chart"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h3 style={{ margin: '0 0 var(--space-lg) 0', fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
        Monthly Spending by Category
      </h3>
      <ResponsiveContainer width="100%" height={435}>
        <PieChart margin={{ top: 80, right: 20, bottom: 30, left: 20 }}>
          <Pie
            data={data}
            cx="50%"
            cy="38%"
            outerRadius={110}
            innerRadius={65}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            activeIndex={activeIndex ?? undefined}
            activeShape={{ outerRadius: 125, innerRadius: 65 }}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value, currency)}
            contentStyle={{
              backgroundColor: '#2d2d2d',
              border: `2px solid #444`,
              borderRadius: '8px',
              padding: '10px 14px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              color: '#ffffff',
            }}
            labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}
            cursor={{ fill: 'none' }}
          />
          <Legend
            verticalAlign="bottom"
            height={40}
            wrapperStyle={{ paddingTop: '10px' }}
            content={<CustomLegend />}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
