import { useEffect, useState, type FormEvent } from 'react'
import { db } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { useToast } from '../lib/toastStore'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { GOAL_CATEGORIES, type Goal, type GoalCategory, getGoalProgress, getGoalStatus } from '../lib/goals'
import './GoalsPlanner.css'

export function GoalsPlanner() {
  const { show: showToast } = useToast()
  const [goals, setGoals] = useState<Goal[]>([])
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [category, setCategory] = useState<GoalCategory>('savings')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { currency } = useCurrencyContext()

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        await refresh()
      } catch (err) {
        setError('Failed to load goals. Please try again.')
        console.error('Failed to load goals:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function refresh() {
    try {
      const allGoals = await db.goals.toArray()
      const sorted = allGoals.sort((a, b) => a.priority - b.priority)
      setGoals(sorted)
      setError(null)
    } catch (err) {
      setError('Failed to load goals. Please try again.')
      console.error('Failed to load goals:', err)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setValidationError(null)
    const amount = Number(targetAmount)

    if (!name.trim()) {
      setValidationError('Goal name is required')
      return
    }
    if (!amount || amount <= 0) {
      setValidationError('Target amount must be greater than 0')
      return
    }

    try {
      setSubmitting(true)
      await db.goals.add({
        id: crypto.randomUUID(),
        name: name.trim(),
        targetAmount: amount,
        currentAmount: 0,
        category,
        targetDate: targetDate || undefined,
        priority: goals.length,
        createdAt: new Date().toISOString(),
      })

      setName('')
      setTargetAmount('')
      setCategory('savings')
      setTargetDate('')
      setValidationError(null)
      showToast('Goal created', 'success')
      await refresh()
    } catch (err) {
      showToast('Failed to create goal. Please try again.', 'error')
      console.error('Failed to add goal:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteGoal(id: string) {
    try {
      await db.goals.delete(id)
      showToast('Goal deleted', 'success')
      await refresh()
    } catch (err) {
      showToast('Failed to delete goal. Please try again.', 'error')
      console.error('Failed to delete goal:', err)
    }
  }

  async function updateGoalAmount(id: string, amount: number) {
    try {
      const goal = await db.goals.get(id)
      if (goal) {
        await db.goals.update(id, { currentAmount: Math.max(0, amount) })
        showToast('Goal updated', 'success')
        await refresh()
      }
    } catch (err) {
      showToast('Failed to update goal. Please try again.', 'error')
      console.error('Failed to update goal amount:', err)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading goals..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refresh} />
  }

  return (
    <div className="goals-planner">
      <form className="goals-planner__form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Goal name (e.g., Emergency Fund)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="goals-planner__input"
          disabled={submitting}
        />
        <input
          type="number"
          placeholder="Target amount"
          step="0.01"
          inputMode="decimal"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          className="goals-planner__input"
          disabled={submitting}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as GoalCategory)}
          className="goals-planner__select"
          disabled={submitting}
        >
          {Object.entries(GOAL_CATEGORIES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="goals-planner__input"
          disabled={submitting}
        />
        <button type="submit" className="goals-planner__button" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Goal'}
        </button>
        {validationError && <ErrorMessage message={validationError} />}
      </form>

      {goals.length === 0 && (
        <div className="goals-planner__empty">
          <p>No goals yet — create one to start building your future.</p>
        </div>
      )}

      <div className="goals-planner__list">
        {goals.map((goal) => {
          const progress = getGoalProgress(goal)
          const status = getGoalStatus(goal)

          return (
            <div key={goal.id} className={`goals-planner__card goals-planner__card--${status}`}>
              <div className="goals-planner__card-header">
                <div>
                  <h3 className="goals-planner__goal-name">{goal.name}</h3>
                  <p className="goals-planner__goal-category">
                    {GOAL_CATEGORIES[goal.category as GoalCategory]}
                  </p>
                </div>
                <div className="goals-planner__card-actions">
                  <button
                    type="button"
                    onClick={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)}
                    className="goals-planner__add-icon"
                    aria-label={`Add amount to ${goal.name}`}
                    title="Add to goal"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteGoal(goal.id)}
                    className="goals-planner__delete"
                    aria-label={`Delete ${goal.name}`}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="goals-planner__progress-container">
                <div className="goals-planner__progress-bar">
                  <div
                    className="goals-planner__progress-fill"
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
                <p className="goals-planner__progress-text">
                  {Math.round(progress)}%
                </p>
              </div>

              <div className="goals-planner__stats">
                <div>
                  <span>Current</span>
                  <strong>{formatCurrency(goal.currentAmount, currency)}</strong>
                </div>
                <div>
                  <span>Target</span>
                  <strong>{formatCurrency(goal.targetAmount, currency)}</strong>
                </div>
                <div>
                  <span>Remaining</span>
                  <strong>{formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount), currency)}</strong>
                </div>
              </div>

              {expandedGoalId === goal.id && (
                <div className="goals-planner__amount-input">
                  <label htmlFor={`amount-${goal.id}`}>Add to this goal:</label>
                  <div className="goals-planner__amount-group">
                    <input
                      id={`amount-${goal.id}`}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      inputMode="decimal"
                      autoFocus
                      onBlur={(e) => {
                        const amount = Number(e.target.value)
                        if (amount > 0) {
                          updateGoalAmount(goal.id, goal.currentAmount + amount)
                          e.target.value = ''
                          setExpandedGoalId(null)
                        }
                      }}
                      className="goals-planner__amount-input-field"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = document.querySelector(
                          `#amount-${goal.id}`,
                        ) as HTMLInputElement
                        const amount = Number(input?.value)
                        if (amount > 0) {
                          updateGoalAmount(goal.id, goal.currentAmount + amount)
                          input.value = ''
                          setExpandedGoalId(null)
                        }
                      }}
                      className="goals-planner__add-button"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
