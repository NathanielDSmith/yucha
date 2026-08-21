import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { db } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { projectCompoundGrowth } from '../lib/compounding'
import './OpportunityCostCard.css'

interface RecentPurchase {
  id: string
  amount: number
  note?: string
  date: string
}

export function OpportunityCostCard() {
  const { currency } = useCurrencyContext()
  const [purchase, setPurchase] = useState<RecentPurchase | null>(null)
  const [futureValue, setFutureValue] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRecentPurchase() {
      try {
        const entries = await db.spendingEntries.toArray()
        const settings = await db.appSettings.get(1)

        if (entries.length === 0) {
          setLoading(false)
          return
        }

        // Get most recent purchase
        const sorted = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        const recent = sorted[0]

        setPurchase({
          id: recent.id,
          amount: recent.amount,
          note: recent.note || 'Recent purchase',
          date: recent.date,
        })

        // Calculate opportunity cost to retirement
        if (settings?.dateOfBirth) {
          const dob = new Date(settings.dateOfBirth)
          const retirementAge = 65
          const yearsToRetirement = retirementAge - (new Date().getFullYear() - dob.getFullYear())

          if (yearsToRetirement > 0) {
            // Assume 7% annual return (conservative long-term average)
            const projection = projectCompoundGrowth(recent.amount, yearsToRetirement, 0.07)
            setFutureValue(projection.futureValue)
          }
        }
      } catch (err) {
        console.error('Failed to load opportunity cost:', err)
      } finally {
        setLoading(false)
      }
    }
    loadRecentPurchase()
  }, [])

  if (loading || !purchase) {
    return null
  }

  if (futureValue === 0) {
    return null
  }

  const savedAmount = futureValue - purchase.amount

  return (
    <motion.div
      className="opportunity-cost-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="opportunity-cost-card__header">
        <h3 className="opportunity-cost-card__title">Did You Know?</h3>
        <p className="opportunity-cost-card__subtitle">Opportunity cost insight</p>
      </div>

      <div className="opportunity-cost-card__insight">
        <p className="opportunity-cost-card__text">
          That <strong>{formatCurrency(purchase.amount, currency)}</strong> purchase could grow to{' '}
          <strong className="opportunity-cost-card__highlight">{formatCurrency(futureValue, currency)}</strong> by retirement if invested.
        </p>
        <div className="opportunity-cost-card__breakdown">
          <div className="opportunity-cost-card__item">
            <span className="opportunity-cost-card__item-label">Your purchase</span>
            <span className="opportunity-cost-card__item-value">{formatCurrency(purchase.amount, currency)}</span>
          </div>
          <div className="opportunity-cost-card__arrow">→</div>
          <div className="opportunity-cost-card__item opportunity-cost-card__item--highlight">
            <span className="opportunity-cost-card__item-label">Future value (7% return)</span>
            <span className="opportunity-cost-card__item-value">{formatCurrency(futureValue, currency)}</span>
          </div>
        </div>
        <p className="opportunity-cost-card__note">
          💡 Investing early lets your money work harder. Even small purchases add up over decades.
        </p>
      </div>
    </motion.div>
  )
}
