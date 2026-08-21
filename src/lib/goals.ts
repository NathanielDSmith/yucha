export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate?: string // ISO date
  category: string // e.g., "emergency", "savings", "investment"
  priority: number // 1 = highest
  createdAt: string // ISO timestamp
}

export type GoalCategory = 'emergency' | 'savings' | 'investment' | 'personal' | 'other'

export const GOAL_CATEGORIES: Record<GoalCategory, string> = {
  emergency: 'Emergency Fund',
  savings: 'Savings Goal',
  investment: 'Investment',
  personal: 'Personal Goal',
  other: 'Other',
}

export function getGoalProgress(goal: Goal): number {
  return goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
}

export function getGoalStatus(goal: Goal): 'completed' | 'in-progress' | 'not-started' {
  if (goal.currentAmount >= goal.targetAmount) {
    return 'completed'
  }
  if (goal.currentAmount > 0) {
    return 'in-progress'
  }
  return 'not-started'
}

export function formatGoalProgress(current: number, target: number): string {
  const remaining = Math.max(0, target - current)
  const pct = target > 0 ? (current / target) * 100 : 0
  return `${Math.round(pct)}% • ${remaining > 0 ? `$${remaining.toFixed(2)} to go` : 'Complete!'}`
}
