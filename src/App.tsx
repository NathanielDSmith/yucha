import { useEffect, useState } from 'react'
import { BudgetPlanner } from './components/BudgetPlanner'
import { SpendingLog } from './components/SpendingLog'
import { Subscriptions } from './components/Subscriptions'
import { Insights } from './components/Insights'
import { QuickCheck } from './components/QuickCheck'
import { GoalsPlanner } from './components/GoalsPlanner'
import { NetWorthDashboard } from './components/NetWorthDashboard'
import { EmergencyFundTracker } from './components/EmergencyFundTracker'
import { BurnRateTracker } from './components/BurnRateTracker'
import { AccountManagement } from './components/AccountManagement'
import { ReviewReminder } from './components/ReviewReminder'
import { Onboarding } from './components/Onboarding'
import { CurrencySelector } from './components/CurrencySelector'
import { useCurrency } from './lib/useCurrency'
import { db } from './lib/db'
import './App.css'

const TABS = [
  { id: 'accounts', label: 'Accounts' },
  { id: 'net-worth', label: 'Net Worth' },
  { id: 'emergency', label: 'Emergency Fund' },
  { id: 'burn-rate', label: 'Burn Rate' },
  { id: 'budget', label: 'Budget' },
  { id: 'spending', label: 'Spending' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'insights', label: 'Insights' },
  { id: 'goals', label: 'Goals' },
  { id: 'quick-check', label: 'Quick Check' },
] as const

type TabId = (typeof TABS)[number]['id']

function App() {
  const [tab, setTab] = useState<TabId>('accounts')
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const { currency } = useCurrency()

  useEffect(() => {
    async function checkOnboarding() {
      const settings = await db.appSettings.get(1)
      if (settings?.onboardingComplete) {
        setShowOnboarding(false)
      }
      setIsLoading(false)
    }
    checkOnboarding()
  }, [])

  if (isLoading) {
    return null
  }

  if (showOnboarding) {
    return (
      <main className="app">
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      </main>
    )
  }

  return (
    <main className="app">
      <header className="app__header">
        <h1>Yucha</h1>
        <nav className="app__tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? 'app__tab app__tab--active' : 'app__tab'}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <CurrencySelector />
      </header>

      <div className="app__content">
        <ReviewReminder />
        {tab === 'accounts' && <AccountManagement />}
        {tab === 'net-worth' && <NetWorthDashboard />}
        {tab === 'emergency' && <EmergencyFundTracker />}
        {tab === 'burn-rate' && <BurnRateTracker />}
        {tab === 'budget' && <BudgetPlanner />}
        {tab === 'spending' && <SpendingLog />}
        {tab === 'subscriptions' && <Subscriptions />}
        {tab === 'insights' && <Insights />}
        {tab === 'goals' && <GoalsPlanner />}
        {tab === 'quick-check' && <QuickCheck />}
      </div>
    </main>
  )
}

export default App
