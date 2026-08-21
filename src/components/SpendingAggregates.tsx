import { useEffect, useState, useMemo } from 'react'
import { db, type SpendingCategory } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { sumByCategory } from '../lib/spending'
import { parseLocalDate } from '../lib/dates'
import type { Subscription } from '../lib/subscriptions'
import './SpendingAggregates.css'

export function SpendingAggregates() {
  const { currency } = useCurrencyContext()
  const [categories, setCategories] = useState<SpendingCategory[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const cats = await db.spendingCategories.toArray()
        const allEntries = await db.spendingEntries.toArray()
        const allSubs = await db.subscriptions.toArray()
        setCategories(cats)
        setEntries(allEntries)
        setSubs(allSubs)
      } catch (err) {
        console.error('Failed to load aggregates:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totals = useMemo(() => {
    const categoryTotals = new Map<string, number>()

    // Sum spending entries by categoryId
    const spendingTotals = sumByCategory(entries)
    for (const { categoryId, total } of spendingTotals) {
      categoryTotals.set(categoryId, (categoryTotals.get(categoryId) ?? 0) + total)
    }

    // Add subscriptions (monthly amount)
    const today = new Date()
    for (const sub of subs) {
      if (parseLocalDate(sub.startDate) <= today) {
        categoryTotals.set(sub.categoryId, (categoryTotals.get(sub.categoryId) ?? 0) + sub.monthlyAmount)
      }
    }

    // Convert to array with category names
    return Array.from(categoryTotals.entries())
      .map(([categoryId, total]) => ({
        categoryId,
        name: categories.find((c) => c.id === categoryId)?.name || 'Unknown',
        total,
      }))
      .sort((a, b) => b.total - a.total)
  }, [entries, subs, categories])

  if (loading || totals.length === 0) {
    return null
  }

  const grandTotal = totals.reduce((sum, cat) => sum + cat.total, 0)

  return (
    <div className="spending-aggregates">
      <div className="spending-aggregates__header">
        <h3 className="spending-aggregates__title">Total Spending by Category</h3>
        <p className="spending-aggregates__subtitle">Everyday + Recurring</p>
      </div>
      <div className="spending-aggregates__list">
        {totals.map((category) => (
          <div key={category.categoryId} className="spending-aggregates__item">
            <span className="spending-aggregates__category">{category.name}</span>
            <span className="spending-aggregates__amount">{formatCurrency(category.total, currency)}</span>
            <div className="spending-aggregates__bar">
              <div
                className="spending-aggregates__fill"
                style={{ width: `${(category.total / grandTotal) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="spending-aggregates__footer">
        <span className="spending-aggregates__label">Total</span>
        <span className="spending-aggregates__total">{formatCurrency(grandTotal, currency)}</span>
      </div>
    </div>
  )
}
