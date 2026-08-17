import { useEffect, useState } from 'react'
import { db } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import './Onboarding.css'

interface OnboardingProps {
  onComplete: () => void
}

const DEFAULT_CATEGORIES = [
  { name: 'Rent', type: 'percentage' as const, amount: 40 },
  { name: 'Food', type: 'percentage' as const, amount: 15 },
  { name: 'Utilities', type: 'percentage' as const, amount: 10 },
  { name: 'Savings', type: 'percentage' as const, amount: 20 },
]

export function Onboarding({ onComplete }: OnboardingProps) {
  const [slide, setSlide] = useState(0)
  const [income, setIncome] = useState('')
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleSkip()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  async function handleSkip() {
    await markComplete()
  }

  async function handleNext() {
    if (slide === 0) {
      setSlide(1)
    } else if (slide === 1) {
      if (!income || Number(income) <= 0) return
      setSlide(2)
    } else if (slide === 2) {
      await saveAndComplete()
    }
  }

  async function saveAndComplete() {
    const parsedIncome = Number(income)
    if (!parsedIncome || parsedIncome <= 0) return

    // Save budget config in BudgetPlanner's expected format
    await db.budgetConfig.put({
      id: 1,
      income: parsedIncome,
      categories: categories
        .filter((c) => c.name.trim())
        .map((c) => ({
          id: crypto.randomUUID(),
          name: c.name.trim(),
          type: c.type,
          ...(c.type === 'percentage'
            ? { percent: Number(c.amount) || 0 }
            : { amount: Number(c.amount) || 0 }),
        })),
    })

    await markComplete()
  }

  async function markComplete() {
    const settings = await db.appSettings.get(1)
    await db.appSettings.put({
      id: 1,
      lastReviewedAt: settings?.lastReviewedAt || new Date(),
      onboardingComplete: true,
    })
    onComplete()
  }

  function addCategory() {
    setCategories([
      ...categories,
      { name: '', type: 'percentage' as const, amount: 10 },
    ])
  }

  function updateCategory(
    index: number,
    field: 'name' | 'type' | 'amount',
    value: string | number
  ) {
    const updated = [...categories]
    if (field === 'amount') {
      updated[index] = { ...updated[index], [field]: Number(value) }
    } else {
      updated[index] = { ...updated[index], [field]: value as any }
    }
    setCategories(updated)
  }

  function removeCategory(index: number) {
    setCategories(categories.filter((_, i) => i !== index))
  }

  const totalPercentage = categories
    .filter((c) => c.type === 'percentage')
    .reduce((sum, c) => sum + c.amount, 0)

  const fixedTotal = categories
    .filter((c) => c.type === 'fixed')
    .reduce((sum, c) => sum + c.amount, 0)

  const projectedIncome = Number(income) || 0
  const projectedAllocated =
    fixedTotal +
    (projectedIncome * Math.max(0, Math.min(100, totalPercentage))) / 100

  return (
    <div className="onboarding">
      <div className="onboarding__overlay" />
      <div className="onboarding__modal">
        {/* Slide 1: Welcome */}
        {slide === 0 && (
          <div className="onboarding__slide">
            <div className="onboarding__content">
              <h1 className="onboarding__title">Welcome to Yucha</h1>
              <p className="onboarding__subtitle">
                Track your spending and see the real cost of your habits.
              </p>
              <p className="onboarding__text">
                Yucha is about awareness, not judgment. We'll show you what your
                spending could have become if invested instead — so you can make
                habits that move you forward.
              </p>
              <div className="onboarding__features">
                <div className="onboarding__feature">
                  <span className="onboarding__feature-icon">💰</span>
                  <div>
                    <strong>Budget & Track</strong>
                    <p>Set up your monthly budget and log your spending</p>
                  </div>
                </div>
                <div className="onboarding__feature">
                  <span className="onboarding__feature-icon">📈</span>
                  <div>
                    <strong>See the Real Cost</strong>
                    <p>Understand compounded opportunity cost over time</p>
                  </div>
                </div>
                <div className="onboarding__feature">
                  <span className="onboarding__feature-icon">🎯</span>
                  <div>
                    <strong>Build Habits</strong>
                    <p>Make informed choices about where your money goes</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="onboarding__actions">
              <button
                type="button"
                className="onboarding__button onboarding__button--secondary"
                onClick={handleSkip}
              >
                Skip (ESC)
              </button>
              <button
                type="button"
                className="onboarding__button onboarding__button--primary"
                onClick={handleNext}
              >
                Let's Go
              </button>
            </div>
          </div>
        )}

        {/* Slide 2: Income */}
        {slide === 1 && (
          <div className="onboarding__slide">
            <div className="onboarding__content">
              <h2 className="onboarding__title">What's your monthly income?</h2>
              <p className="onboarding__subtitle">
                This is your base for budgeting. You can change it anytime.
              </p>

              <div className="onboarding__input-group">
                <label htmlFor="onboarding-income">Monthly income</label>
                <div className="onboarding__input-wrapper">
                  <span className="onboarding__currency">$</span>
                  <input
                    id="onboarding-income"
                    name="income"
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    step="0.01"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    autoFocus
                    className="onboarding__input"
                  />
                </div>
              </div>

              {income && (
                <div className="onboarding__preview">
                  <p>
                    That's <strong>{formatCurrency(Number(income))}</strong> per
                    month to budget.
                  </p>
                </div>
              )}
            </div>
            <div className="onboarding__actions">
              <button
                type="button"
                className="onboarding__button onboarding__button--secondary"
                onClick={handleSkip}
              >
                Skip (ESC)
              </button>
              <button
                type="button"
                className="onboarding__button onboarding__button--primary"
                onClick={handleNext}
                disabled={!income || Number(income) <= 0}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Slide 3: Categories */}
        {slide === 2 && (
          <div className="onboarding__slide">
            <div className="onboarding__content">
              <h2 className="onboarding__title">Set up your categories</h2>
              <p className="onboarding__subtitle">
                How do you want to split your budget? You can adjust these
                anytime.
              </p>

              <div className="onboarding__categories-list">
                {categories.map((cat, idx) => (
                  <div key={idx} className="onboarding__category-row">
                    <input
                      id={`onboarding-category-name-${idx}`}
                      name={`category-name-${idx}`}
                      type="text"
                      placeholder="e.g., Rent"
                      value={cat.name}
                      onChange={(e) => updateCategory(idx, 'name', e.target.value)}
                      className="onboarding__category-input onboarding__category-name"
                    />
                    <select
                      id={`onboarding-category-type-${idx}`}
                      name={`category-type-${idx}`}
                      value={cat.type}
                      onChange={(e) =>
                        updateCategory(idx, 'type', e.target.value)
                      }
                      className="onboarding__category-input onboarding__category-type"
                    >
                      <option value="percentage">%</option>
                      <option value="fixed">$</option>
                    </select>
                    <input
                      id={`onboarding-category-amount-${idx}`}
                      name={`category-amount-${idx}`}
                      type="number"
                      placeholder="0"
                      step={cat.type === 'percentage' ? '1' : '0.01'}
                      value={cat.amount}
                      onChange={(e) =>
                        updateCategory(idx, 'amount', e.target.value)
                      }
                      className="onboarding__category-input onboarding__category-amount"
                    />
                    <button
                      type="button"
                      onClick={() => removeCategory(idx)}
                      className="onboarding__remove-category"
                      aria-label={`Remove ${cat.name}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="onboarding__add-category"
                onClick={addCategory}
              >
                + Add category
              </button>

              {income && (
                <div className="onboarding__allocation-preview">
                  <div className="onboarding__allocation-stat">
                    <span>Monthly income</span>
                    <strong>{formatCurrency(Number(income))}</strong>
                  </div>
                  <div className="onboarding__allocation-stat">
                    <span>Allocated</span>
                    <strong>{formatCurrency(projectedAllocated)}</strong>
                  </div>
                  <div className="onboarding__allocation-stat">
                    <span>Remaining</span>
                    <strong>
                      {formatCurrency(Math.max(0, Number(income) - projectedAllocated))}
                    </strong>
                  </div>
                </div>
              )}
            </div>
            <div className="onboarding__actions">
              <button
                type="button"
                className="onboarding__button onboarding__button--secondary"
                onClick={() => setSlide(1)}
              >
                Back
              </button>
              <button
                type="button"
                className="onboarding__button onboarding__button--primary"
                onClick={handleNext}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
