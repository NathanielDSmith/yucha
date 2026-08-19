import Dexie, { type Table } from 'dexie'
import type { BudgetCategory } from './budget'
import type { SpendingEntry } from './spending'
import type { Subscription } from './subscriptions'
import type { Goal } from './goals'
import type { Account } from './accounts'
import type { IncomeSource } from './income'
import type { CurrencyCode } from './currencies'
import { DEFAULT_CURRENCY } from './currencies'

export interface BudgetConfig {
  id: number
  income: number
  categories: BudgetCategory[]
}

export interface AppSettings {
  id: number
  lastReviewedAt: Date
  onboardingComplete?: boolean
  currency?: CurrencyCode
  emergencyFundGoal?: number
  burnRateBalance?: number
}

// Single-row tables, always keyed at id 1 — there is exactly one active
// budget plan and one settings record, not a collection of them.
export const BUDGET_CONFIG_ID = 1
export const APP_SETTINGS_ID = 1

class YuchaDB extends Dexie {
  budgetConfig!: Table<BudgetConfig, number>
  spendingEntries!: Table<SpendingEntry, string>
  subscriptions!: Table<Subscription, string>
  appSettings!: Table<AppSettings, number>
  goals!: Table<Goal, string>
  accounts!: Table<Account, string>
  incomeSources!: Table<IncomeSource, string>

  constructor() {
    super('yucha')
    this.version(1).stores({
      budgetConfig: 'id',
    })
    this.version(2).stores({
      budgetConfig: 'id',
      spendingEntries: 'id, date, category',
      subscriptions: 'id, category',
      appSettings: 'id',
    })
    this.version(3).stores({
      budgetConfig: 'id',
      spendingEntries: 'id, date, category',
      subscriptions: 'id, category',
      appSettings: 'id',
      goals: 'id, priority',
    })
    this.version(4).stores({
      budgetConfig: 'id',
      spendingEntries: 'id, date, category',
      subscriptions: 'id, category',
      appSettings: 'id',
      goals: 'id, priority',
      accounts: 'id, type',
    })
    this.version(5).stores({
      budgetConfig: 'id',
      spendingEntries: 'id, date, category',
      subscriptions: 'id, category',
      appSettings: 'id',
      goals: 'id, priority',
      accounts: 'id, type',
      incomeSources: 'id, type, isActive',
    })
  }
}

export const db = new YuchaDB()
