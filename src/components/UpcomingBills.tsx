import { motion } from 'framer-motion'
import { formatCurrency } from '../lib/currency'
import { ordinal } from '../lib/dates'
import type { Subscription } from '../lib/subscriptions'

interface UpcomingBillsProps {
  subscriptions: Subscription[]
  currency?: string
}

export function UpcomingBills({ subscriptions, currency = 'USD' }: UpcomingBillsProps) {
  const nextUpcomingBills = subscriptions
    .sort((a, b) => {
      const aDay = parseInt(a.startDate.split('-')[2])
      const bDay = parseInt(b.startDate.split('-')[2])
      return aDay - bDay
    })
    .slice(0, 3)

  if (nextUpcomingBills.length === 0) return null

  return (
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
      <p style={{ margin: '0 0 var(--space-lg) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
        Upcoming Bills
      </p>
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
  )
}
