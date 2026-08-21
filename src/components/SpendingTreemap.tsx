import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { db, type SpendingCategory } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { sumByCategory, startOfMonth, filterByDateRange } from '../lib/spending'
import { getPieChartColor } from '../lib/colors'
import type { Subscription } from '../lib/subscriptions'
import './SpendingTreemap.css'

interface TreemapItem {
  categoryId: string
  name: string
  amount: number
  percentage: number
  color: string
  x: number
  y: number
  width: number
  height: number
}

export function SpendingTreemap() {
  const { currency } = useCurrencyContext()
  const [items, setItems] = useState<TreemapItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const categories = await db.spendingCategories.toArray()
        const allEntries = await db.spendingEntries.toArray()
        const subs = await db.subscriptions.toArray()

        // Filter to current month
        const monthStart = startOfMonth()
        const monthEnd = new Date()
        const monthEntries = filterByDateRange(allEntries, monthStart, monthEnd)

        // Sum by category
        const categoryTotals = new Map<string, number>()
        const spendingTotals = sumByCategory(monthEntries)
        for (const { categoryId, total: amt } of spendingTotals) {
          categoryTotals.set(categoryId, (categoryTotals.get(categoryId) ?? 0) + amt)
        }

        // Add subscriptions
        const today = new Date()
        for (const sub of subs) {
          const subStart = new Date(sub.startDate)
          if (subStart <= today) {
            categoryTotals.set(sub.categoryId, (categoryTotals.get(sub.categoryId) ?? 0) + sub.monthlyAmount)
          }
        }

        // Convert to items
        const categoryMap = new Map(categories.map((c) => [c.id, c]))
        let grandTotal = 0
        const itemList: Omit<TreemapItem, 'x' | 'y' | 'width' | 'height'>[] = []
        let colorIndex = 0

        categoryTotals.forEach((amount, categoryId) => {
          const cat = categoryMap.get(categoryId)
          if (cat && amount > 0) {
            itemList.push({
              categoryId,
              name: cat.name,
              amount,
              percentage: 0,
              color: getPieChartColor(colorIndex, categoryId),
            })
            grandTotal += amount
            colorIndex++
          }
        })

        // Calculate percentages
        itemList.forEach((item) => {
          item.percentage = grandTotal > 0 ? (item.amount / grandTotal) * 100 : 0
        })

        // Sort by amount
        itemList.sort((a, b) => b.amount - a.amount)

        // Calculate treemap layout (simple squarified layout)
        const treemapItems = calculateTreemapLayout(itemList, grandTotal)
        setItems(treemapItems)
        setTotal(grandTotal)
      } catch (err) {
        console.error('Failed to load treemap data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading || items.length === 0) {
    return null
  }

  return (
    <motion.div
      className="spending-treemap"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="spending-treemap__container">
        <svg viewBox="0 0 600 400" className="spending-treemap__svg">
          {items.map((item, idx) => (
            <g
              key={item.categoryId}
              onMouseEnter={() => setHoveredId(item.categoryId)}
              onMouseLeave={() => setHoveredId(null)}
              className="spending-treemap__item"
              style={{ cursor: 'pointer' }}
            >
              <motion.rect
                x={item.x}
                y={item.y}
                width={item.width}
                height={item.height}
                fill={item.color}
                stroke="var(--color-page)"
                strokeWidth={2}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="spending-treemap__rect"
              />

              {item.width > 50 && item.height > 40 && (
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 + 0.1 }}
                  className="spending-treemap__label"
                >
                  <text
                    x={item.x + item.width / 2}
                    y={item.y + item.height / 2 - 12}
                    textAnchor="middle"
                    className="spending-treemap__name"
                  >
                    {item.name}
                  </text>
                  <text
                    x={item.x + item.width / 2}
                    y={item.y + item.height / 2 + 8}
                    textAnchor="middle"
                    className="spending-treemap__amount"
                  >
                    {formatCurrency(item.amount, currency)}
                  </text>
                  <text
                    x={item.x + item.width / 2}
                    y={item.y + item.height / 2 + 24}
                    textAnchor="middle"
                    className="spending-treemap__percentage"
                  >
                    {item.percentage.toFixed(0)}%
                  </text>
                </motion.g>
              )}

              {hoveredId === item.categoryId && (item.width <= 50 || item.height <= 40) && (
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="spending-treemap__tooltip-group"
                >
                  <rect
                    x={item.x + item.width / 2 - 60}
                    y={item.y - 50}
                    width={120}
                    height={45}
                    fill="var(--color-page)"
                    stroke="var(--color-border)"
                    strokeWidth={1}
                    rx={4}
                  />
                  <text
                    x={item.x + item.width / 2}
                    y={item.y - 30}
                    textAnchor="middle"
                    className="spending-treemap__tooltip-name"
                  >
                    {item.name}
                  </text>
                  <text
                    x={item.x + item.width / 2}
                    y={item.y - 10}
                    textAnchor="middle"
                    className="spending-treemap__tooltip-value"
                  >
                    {formatCurrency(item.amount, currency)}
                  </text>
                </motion.g>
              )}
            </g>
          ))}
        </svg>
      </div>
    </motion.div>
  )
}

function calculateTreemapLayout(
  items: Omit<TreemapItem, 'x' | 'y' | 'width' | 'height'>[],
  total: number,
): TreemapItem[] {
  const width = 600
  const height = 400
  const area = width * height

  const result: TreemapItem[] = items.map((item) => ({
    ...item,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  }))

  const ratios = items.map((item) => (item.amount / total) * area)

  // Simple layout: arrange in rows
  let x = 0
  let y = 0
  let rowHeight = 0
  let rowWidth = 0
  const targetRowWidth = width * 0.8

  ratios.forEach((ratio, idx) => {
    const itemWidth = Math.sqrt(ratio * (width / height))
    const itemHeight = ratio / itemWidth

    if (rowWidth + itemWidth > targetRowWidth && rowWidth > 0) {
      // Start new row
      y += rowHeight
      x = 0
      rowWidth = 0
      rowHeight = 0
    }

    result[idx].x = x
    result[idx].y = y
    result[idx].width = Math.max(40, itemWidth)
    result[idx].height = Math.max(40, itemHeight)

    x += result[idx].width + 2
    rowWidth += result[idx].width + 2
    rowHeight = Math.max(rowHeight, result[idx].height)
  })

  return result
}
