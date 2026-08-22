import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { db } from '../lib/db'
import { useCurrencyContext } from '../lib/CurrencyContext'
import type { Goal } from '../lib/goals'
import type { Subscription } from '../lib/subscriptions'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { GoalsCarousel } from './GoalsCarousel'
import { UpcomingBills } from './UpcomingBills'
import { SpendingPieChart } from './SpendingPieChart'
import { SpendingTrendSparkline } from './SpendingTrendSparkline'
import { PriceChecker } from './PriceChecker'
import './Home.css'

export function Home() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currency } = useCurrencyContext()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      setIsLoading(true)
      setError(null)
      const subs = await db.subscriptions.toArray()
      const allGoals = await db.goals.toArray()

      setSubscriptions(subs)
      setGoals(allGoals.sort((a, b) => a.priority - b.priority))
    } catch (err) {
      setError('Failed to load your financial snapshot. Please try again.')
      console.error('Failed to load home metrics:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading your financial snapshot..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadDashboard} />
  }

  return (
    <div className="home">
      <motion.div
        className="home__header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="home__title">Financial Dashboard</h2>
        <p className="home__subtitle">Your complete financial overview at a glance</p>
      </motion.div>

      <div className="home__grid">
        <SpendingPieChart />
        <div className="home__grid-right">
          <SpendingTrendSparkline />
          <GoalsCarousel goals={goals} currency={currency} />
        </div>
      </div>

      <div className="home__bottom-section">
        <UpcomingBills subscriptions={subscriptions} currency={currency} />
      </div>

      <PriceChecker />
    </div>
  )
}
