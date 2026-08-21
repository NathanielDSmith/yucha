import { useEffect, useState, type FormEvent } from 'react'
import { db } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { useToast } from '../lib/toastStore'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { GOAL_CATEGORIES, type Goal, type GoalCategory, getGoalProgress, getGoalStatus } from '../lib/goals'
import { DEFAULT_ANNUAL_RETURN_RATE } from '../lib/compounding'
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
  const [fundingGoalId, setFundingGoalId] = useState<string | null>(null)
  const [fundAmount, setFundAmount] = useState('')
  const [fundValidationError, setFundValidationError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editTargetAmount, setEditTargetAmount] = useState('')
  const [editCategory, setEditCategory] = useState<GoalCategory>('savings')
  const [editTargetDate, setEditTargetDate] = useState('')
  const [editValidationError, setEditValidationError] = useState<string | null>(null)
  const [opportunityCostGoalId, setOpportunityCostGoalId] = useState<string | null>(null)
  const [years, setYears] = useState(10)
  const [ratePercent, setRatePercent] = useState(DEFAULT_ANNUAL_RETURN_RATE * 100)
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

  function openFundingModal(goal: Goal) {
    setFundingGoalId(goal.id)
    setFundAmount('')
    setFundValidationError(null)
  }

  async function handleAddFunds(e: FormEvent) {
    e.preventDefault()
    setFundValidationError(null)
    const amount = Number(fundAmount)

    if (!fundAmount || !amount || amount <= 0) {
      setFundValidationError('Amount must be greater than 0')
      return
    }

    try {
      setSubmitting(true)
      const goal = goals.find((g) => g.id === fundingGoalId)
      if (!goal) {
        throw new Error('Goal not found')
      }

      await db.goals.update(fundingGoalId!, {
        currentAmount: goal.currentAmount + amount,
      })

      showToast(`Added ${formatCurrency(amount, currency)} to ${goal.name}`, 'success')
      setFundingGoalId(null)
      setFundAmount('')
      await refresh()
    } catch (err) {
      showToast('Failed to add funds. Please try again.', 'error')
      console.error('Failed to add funds:', err)
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

  function openEditModal(goal: Goal) {
    setEditingId(goal.id)
    setEditName(goal.name)
    setEditTargetAmount(String(goal.targetAmount))
    setEditCategory(goal.category as GoalCategory)
    setEditTargetDate(goal.targetDate || '')
    setEditValidationError(null)
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault()
    setEditValidationError(null)
    const amount = Number(editTargetAmount)

    if (!editName.trim()) {
      setEditValidationError('Goal name is required')
      return
    }
    if (!amount || amount <= 0) {
      setEditValidationError('Target amount must be greater than 0')
      return
    }

    try {
      setSubmitting(true)
      await db.goals.update(editingId!, {
        name: editName.trim(),
        targetAmount: amount,
        category: editCategory,
        targetDate: editTargetDate || undefined,
      })

      showToast('Goal updated', 'success')
      setEditingId(null)
      await refresh()
    } catch (err) {
      showToast('Failed to update goal. Please try again.', 'error')
      console.error('Failed to update goal:', err)
    } finally {
      setSubmitting(false)
    }
  }

  function calculateOpportunityCost(amount: number): number {
    return amount * (Math.pow(1 + DEFAULT_ANNUAL_RETURN_RATE, years) - 1)
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
                    onClick={() => setOpportunityCostGoalId(goal.id)}
                    className="goals-planner__opportunity-btn"
                    title="See long-term cost of this goal"
                    aria-label={`View opportunity cost of ${goal.name}`}
                  >
                    📈
                  </button>
                  <button
                    type="button"
                    onClick={() => openFundingModal(goal)}
                    className="goals-planner__add-funds"
                    aria-label={`Add funds to ${goal.name}`}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(goal)}
                    className="goals-planner__edit"
                    aria-label={`Edit ${goal.name}`}
                    title="Edit goal"
                  >
                    ✎
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
            </div>
          )
        })}
      </div>

      {fundingGoalId && (
        <div className="goals-planner__modal-overlay" onClick={() => setFundingGoalId(null)}>
          <div className="goals-planner__modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Funds to Goal</h2>
            <form className="goals-planner__fund-form" onSubmit={handleAddFunds} noValidate>
              <label>
                <span>Amount to add</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Amount"
                  step="0.01"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  disabled={submitting}
                  autoFocus
                  aria-describedby={fundValidationError ? 'fund-validation-error' : undefined}
                />
              </label>
              {fundValidationError && (
                <ErrorMessage message={fundValidationError} />
              )}
              <div className="goals-planner__modal-actions">
                <button
                  type="button"
                  className="goals-planner__modal-cancel"
                  onClick={() => setFundingGoalId(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Funds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingId && (
        <div className="goals-planner__modal-overlay" onClick={() => setEditingId(null)}>
          <div className="goals-planner__modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Goal</h2>
            <form className="goals-planner__edit-form" onSubmit={handleSaveEdit} noValidate>
              <label>
                <span>Goal name</span>
                <input
                  type="text"
                  placeholder="Goal name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={submitting}
                  autoFocus
                />
              </label>
              <label>
                <span>Target amount</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Target amount"
                  step="0.01"
                  value={editTargetAmount}
                  onChange={(e) => setEditTargetAmount(e.target.value)}
                  disabled={submitting}
                />
              </label>
              <label>
                <span>Category</span>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as GoalCategory)}
                  disabled={submitting}
                >
                  {Object.entries(GOAL_CATEGORIES).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Target date (optional)</span>
                <input
                  type="date"
                  value={editTargetDate}
                  onChange={(e) => setEditTargetDate(e.target.value)}
                  disabled={submitting}
                />
              </label>
              {editValidationError && (
                <ErrorMessage message={editValidationError} />
              )}
              <div className="goals-planner__modal-actions">
                <button
                  type="button"
                  className="goals-planner__modal-cancel"
                  onClick={() => setEditingId(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {opportunityCostGoalId && (() => {
        const goal = goals.find((g) => g.id === opportunityCostGoalId)
        if (!goal) return null
        const cost = calculateOpportunityCost(goal.targetAmount)
        return (
          <div className="goals-planner__modal-overlay" onClick={() => setOpportunityCostGoalId(null)}>
            <div className="goals-planner__modal goals-planner__modal--opportunity" onClick={(e) => e.stopPropagation()}>
              <h2>Long-Term Cost of "{goal.name}"</h2>
              <div className="goals-planner__opportunity-content">
                <div className="goals-planner__opportunity-stat">
                  <span className="goals-planner__opportunity-label">Goal Amount</span>
                  <span className="goals-planner__opportunity-value">{formatCurrency(goal.targetAmount, currency)}</span>
                </div>
                <div className="goals-planner__opportunity-stat">
                  <span className="goals-planner__opportunity-label">Time Horizon</span>
                  <select value={years} onChange={(e) => setYears(Number(e.target.value))} className="goals-planner__opportunity-select">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((y) => (
                      <option key={y} value={y}>{y} years</option>
                    ))}
                  </select>
                </div>
                <div className="goals-planner__opportunity-stat">
                  <span className="goals-planner__opportunity-label">Annual Return</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={ratePercent}
                    onChange={(e) => setRatePercent(Number(e.target.value))}
                    className="goals-planner__opportunity-input"
                  />
                  %
                </div>
              </div>
              <div className="goals-planner__opportunity-result">
                <p className="goals-planner__opportunity-message">
                  If you invested <strong>{formatCurrency(goal.targetAmount, currency)}</strong> instead of spending it on this goal, it would grow to:
                </p>
                <p className="goals-planner__opportunity-growth">
                  {formatCurrency(goal.targetAmount + cost, currency)}
                </p>
                <p className="goals-planner__opportunity-lost">
                  That's <strong>{formatCurrency(cost, currency)}</strong> in lost growth potential.
                </p>
              </div>
              <div className="goals-planner__modal-actions">
                <button
                  type="button"
                  className="goals-planner__modal-cancel"
                  onClick={() => setOpportunityCostGoalId(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
