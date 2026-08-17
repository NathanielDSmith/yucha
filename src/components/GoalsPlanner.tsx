import { useEffect, useState, type FormEvent } from 'react'
import { db } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { useNotification } from '../lib/NotificationContext'
import { GOAL_CATEGORIES, type Goal, type GoalCategory, getGoalProgress, getGoalStatus } from '../lib/goals'
import './GoalsPlanner.css'

export function GoalsPlanner() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [category, setCategory] = useState<GoalCategory>('savings')
  const [targetDate, setTargetDate] = useState('')
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null)
  const { currency } = useCurrencyContext()
  const { showNotification } = useNotification()

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    const allGoals = await db.goals.toArray()
    const sorted = allGoals.sort((a, b) => a.priority - b.priority)
    setGoals(sorted)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const amount = Number(targetAmount)
    if (!name.trim() || !amount || amount <= 0) return

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
    await refresh()
  }

  async function deleteGoal(id: string) {
    await db.goals.delete(id)
    await refresh()
  }

  async function updateGoalAmount(id: string, amount: number) {
    const goal = await db.goals.get(id)
    if (goal) {
      const newAmount = Math.max(0, amount)
      const addedAmount = newAmount - goal.currentAmount
      await db.goals.update(id, { currentAmount: newAmount })

      const progress = Math.round((newAmount / goal.targetAmount) * 100)
      const message = progress === 100
        ? `🎉 Goal complete! You reached ${goal.name}!`
        : `You just added ${formatCurrency(addedAmount, currency)} to ${goal.name}. Progress: ${progress}%`

      showNotification(message, progress === 100 ? 'success' : 'info', 4000)
      await refresh()
    }
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
        />
        <input
          type="number"
          placeholder="Target amount"
          step="0.01"
          inputMode="decimal"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          className="goals-planner__input"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as GoalCategory)}
          className="goals-planner__select"
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
        />
        <button type="submit" className="goals-planner__button">
          Create Goal
        </button>
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
