import { useState } from 'react'
import { SpendingLog } from './SpendingLog'
import { RecurringCosts } from './RecurringCosts'
import { SpendingAggregates } from './SpendingAggregates'

interface SpendingHubProps {
  showRecurringCosts?: boolean
}

export function SpendingHub({ showRecurringCosts = true }: SpendingHubProps) {
  const [subTab, setSubTab] = useState<'everyday' | 'recurring'>('everyday')

  return (
    <div>
      <SpendingAggregates />
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-lg)' }}>
        <button
          onClick={() => setSubTab('everyday')}
          style={{
            background: 'none',
            border: 'none',
            padding: 'var(--space-md) 0',
            fontSize: 'var(--font-size-base)',
            fontWeight: subTab === 'everyday' ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
            color: subTab === 'everyday' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            borderBottom: subTab === 'everyday' ? '2px solid var(--color-primary)' : 'none',
            transition: 'all var(--transition-base)',
          }}
        >
          Everyday Spending
        </button>
        {showRecurringCosts && (
          <button
            onClick={() => setSubTab('recurring')}
            style={{
              background: 'none',
              border: 'none',
              padding: 'var(--space-md) 0',
              fontSize: 'var(--font-size-base)',
              fontWeight: subTab === 'recurring' ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
              color: subTab === 'recurring' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              borderBottom: subTab === 'recurring' ? '2px solid var(--color-primary)' : 'none',
              transition: 'all var(--transition-base)',
            }}
          >
            Recurring Costs
          </button>
        )}
      </div>

      {subTab === 'everyday' && <SpendingLog />}
      {showRecurringCosts && subTab === 'recurring' && <RecurringCosts />}
    </div>
  )
}
