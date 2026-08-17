import { useEffect, useState } from 'react'
import { Home } from './components/Home'
import { BudgetPlanner } from './components/BudgetPlanner'
import { SpendingHub } from './components/SpendingHub'
import { GoalsPlanner } from './components/GoalsPlanner'
import { IncomeManager } from './components/IncomeManager'
import { NetWorthDashboard } from './components/NetWorthDashboard'
import { EmergencyFundTracker } from './components/EmergencyFundTracker'
import { BurnRateTracker } from './components/BurnRateTracker'
import { AccountManagement } from './components/AccountManagement'
import { ReviewReminder } from './components/ReviewReminder'
import { Onboarding } from './components/Onboarding'
import { CurrencySelector } from './components/CurrencySelector'
import { Icon } from './components/Icon'
import { useCurrency } from './lib/useCurrency'
import { db } from './lib/db'
import './App.css'

type TabId = 'home' | 'track-spending' | 'insights-net-worth' | 'insights-emergency' | 'insights-burn-rate' | 'goals' | 'income' | 'settings-budget' | 'settings-accounts'

const MAIN_TABS = [
  { id: 'home' as const, icon: 'home' as const, title: 'Home' },
  { id: 'track-spending' as const, icon: 'send' as const, title: 'Spending' },
  { id: 'insights-net-worth' as const, icon: 'trending-up' as const, title: 'Insights' },
  { id: 'goals' as const, icon: 'flag' as const, title: 'Goals' },
  { id: 'income' as const, icon: 'dollar-sign' as const, title: 'Income' },
  { id: 'settings-budget' as const, icon: 'settings' as const, title: 'Settings' },
] as const

function App() {
  const [tab, setTab] = useState<TabId>(() => {
    const saved = localStorage.getItem('yucha_current_tab')
    return (saved as TabId) || 'home'
  })
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const { currency } = useCurrency()

  const handleTabChange = (newTab: TabId) => {
    setTab(newTab)
    localStorage.setItem('yucha_current_tab', newTab)
  }

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
          {MAIN_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.title}
              className={tab.startsWith(t.id) ? 'app__tab app__tab--active' : 'app__tab'}
              onClick={() => handleTabChange(t.id as TabId)}
            >
              <Icon name={t.icon} size={20} />
              <span className="app__tab-label">{t.title}</span>
            </button>
          ))}
        </nav>
        <CurrencySelector />
      </header>

      <div className="app__content">
        <ReviewReminder />
        {tab === 'home' && <Home onNavigate={(newTab) => handleTabChange(newTab as TabId)} />}
        {tab === 'track-spending' && <SpendingHub />}
        {tab === 'insights-net-worth' && <NetWorthDashboard />}
        {tab === 'insights-emergency' && <EmergencyFundTracker />}
        {tab === 'insights-burn-rate' && <BurnRateTracker />}
        {tab === 'goals' && <GoalsPlanner />}
        {tab === 'income' && <IncomeManager />}
        {tab === 'settings-budget' && <BudgetPlanner />}
        {tab === 'settings-accounts' && <AccountManagement />}
      </div>
    </main>
  )
}

export default App
