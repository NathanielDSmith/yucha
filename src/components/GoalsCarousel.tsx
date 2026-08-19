import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { formatCurrency } from '../lib/currency'
import type { Goal } from '../lib/goals'

interface GoalsCarouselProps {
  goals: Goal[]
  currency?: string
}

export function GoalsCarousel({ goals, currency = 'USD' }: GoalsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (goals.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % goals.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [goals.length])

  if (goals.length === 0) return null

  const currentGoal = goals[currentIndex]
  const progress = (currentGoal.currentAmount / currentGoal.targetAmount) * 100

  return (
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
      <p style={{ margin: '0 0 var(--space-md) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
        Goal Progress
      </p>
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
            <span>{Math.round(progress)}%</span>
          </div>
          <div style={{ background: 'var(--color-page)', borderRadius: 'var(--radius-sm)', height: '8px', overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', background: 'var(--color-primary)', borderRadius: 'var(--radius-sm)' }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          Target: {formatCurrency(currentGoal.targetAmount, currency)}
        </p>
      </motion.div>
      <div style={{ marginTop: 'var(--space-lg)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        Goal {currentIndex + 1} of {goals.length}
      </div>
    </motion.div>
  )
}
