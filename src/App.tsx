import { useEffect, useState } from 'react'
import { Home } from './components/Home'
import { SpendingHub } from './components/SpendingHub'
import { GoalsPlanner } from './components/GoalsPlanner'
import { NetWorthDashboard } from './components/NetWorthDashboard'
import { EmergencyFundTracker } from './components/EmergencyFundTracker'
import { BurnRateTracker } from './components/BurnRateTracker'
import { ReviewReminder } from './components/ReviewReminder'
import { Onboarding } from './components/Onboarding'
import { Settings } from './components/Settings'
import { Icon } from './components/Icon'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastContainer } from './components/Toast'
import { ToastProvider } from './lib/toastStore'
import { db } from './lib/db'
import './App.css'

type TabId = 'home' | 'track-spending' | 'insights-net-worth' | 'insights-emergency' | 'insights-burn-rate' | 'goals' | 'income' | 'settings'

const MAIN_TABS = [
  { id: 'home' as const, icon: 'home' as const, title: 'Home' },
  { id: 'track-spending' as const, icon: 'send' as const, title: 'Spending' },
  { id: 'insights-net-worth' as const, icon: 'trending-up' as const, title: 'Insights' },
  { id: 'goals' as const, icon: 'flag' as const, title: 'Goals' },
  { id: 'settings' as const, icon: 'settings' as const, title: 'Settings' },
] as const

function AppContent() {
  const [tab, setTab] = useState<TabId>(() => {
    const saved = localStorage.getItem('yucha_current_tab')
    return (saved as TabId) || 'home'
  })
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [goalsEnabled, setGoalsEnabled] = useState(true)
  const [insightsEnabled, setInsightsEnabled] = useState(true)
  const [emergencyFundEnabled, setEmergencyFundEnabled] = useState(true)
  const [burnRateEnabled, setBurnRateEnabled] = useState(true)
  const [recurringCostsEnabled, setRecurringCostsEnabled] = useState(true)

  const handleTabChange = (newTab: TabId) => {
    setTab(newTab)
    localStorage.setItem('yucha_current_tab', newTab)
  }

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const settings = await db.appSettings.get(1)
        if (settings?.onboardingComplete) {
          setShowOnboarding(false)
        }
        setGoalsEnabled(settings?.goalsEnabled ?? true)
        setInsightsEnabled(settings?.insightsEnabled ?? true)
        setEmergencyFundEnabled(settings?.emergencyFundEnabled ?? true)
        setBurnRateEnabled(settings?.burnRateEnabled ?? true)
        setRecurringCostsEnabled(settings?.recurringCostsEnabled ?? true)
      } catch (err) {
        console.error('Failed to load app settings:', err)
        setShowOnboarding(false)
      } finally {
        setIsLoading(false)
      }
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

  const visibleTabs = MAIN_TABS.filter((t) => {
    if (t.id === 'goals' && !goalsEnabled) return false
    if (t.id === 'insights-net-worth' && !insightsEnabled) return false
    if (t.id === 'insights-emergency' && !emergencyFundEnabled) return false
    if (t.id === 'insights-burn-rate' && !burnRateEnabled) return false
    return true
  })

  return (
    <main className="app">
      <header className="app__header">
        <h1>Yucha</h1>
        <nav className="app__tabs">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.title}
              className={tab === t.id ? 'app__tab app__tab--active' : 'app__tab'}
              onClick={() => handleTabChange(t.id)}
            >
              <Icon name={t.icon} size={20} />
              <span className="app__tab-label">{t.title}</span>
            </button>
          ))}
        </nav>
      </header>

      <div className="app__content">
        <ReviewReminder />
        {tab === 'home' && <Home onNavigate={(newTab) => handleTabChange(newTab as TabId)} />}
        {tab === 'track-spending' && <SpendingHub showRecurringCosts={recurringCostsEnabled} />}
        {tab === 'insights-net-worth' && insightsEnabled && <NetWorthDashboard />}
        {tab === 'insights-emergency' && emergencyFundEnabled && <EmergencyFundTracker />}
        {tab === 'insights-burn-rate' && burnRateEnabled && <BurnRateTracker />}
        {tab === 'goals' && goalsEnabled && <GoalsPlanner />}
        {tab === 'settings' && <Settings />}
      </div>
    </main>
  )
}

function App() {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <AppContent />
        <ToastContainer />
      </ErrorBoundary>
    </ToastProvider>
  )
}

export default App
