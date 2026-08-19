import { useState } from 'react'
import { seedTestData, backupUserData, restoreUserData } from '../lib/testData'

export function DemoModeToggle() {
  const [isLoading, setIsLoading] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(
    localStorage.getItem('yucha_demo_mode') === 'true'
  )

  async function handleToggle(enabled: boolean) {
    setIsLoading(true)
    try {
      if (enabled) {
        // Switching TO demo mode
        await backupUserData()
        await seedTestData()
        localStorage.setItem('yucha_demo_mode', 'true')
        setIsDemoMode(true)
        window.location.reload()
      } else {
        // Switching back to user data
        const restored = await restoreUserData()
        if (restored) {
          localStorage.setItem('yucha_demo_mode', 'false')
          setIsDemoMode(false)
          window.location.reload()
        }
      }
    } catch (error) {
      console.error('Error toggling demo mode:', error)
      alert('Failed to toggle demo mode. Check console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ padding: 'var(--space-lg)', background: 'var(--color-surface-1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: '0 0 var(--space-xs) 0', fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
            Demo Mode
          </p>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            {isDemoMode
              ? 'Currently viewing demo data. Your real data is safely backed up.'
              : 'View comprehensive demo data without affecting your real data.'}
          </p>
        </div>
        <button
          onClick={() => handleToggle(!isDemoMode)}
          disabled={isLoading}
          style={{
            padding: 'var(--space-sm) var(--space-lg)',
            background: isDemoMode ? 'var(--color-primary)' : 'var(--color-surface-2)',
            color: isDemoMode ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: 'var(--font-size-sm)',
            opacity: isLoading ? 0.6 : 1,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(14, 165, 233, 0.2)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {isLoading ? 'Loading...' : isDemoMode ? 'Restore My Data' : 'View Demo Data'}
        </button>
      </div>
    </div>
  )
}
