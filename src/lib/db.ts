import Dexie, { type Table } from 'dexie'
import type { BudgetCategory } from './budget'
import type { SpendingEntry } from './spending'
import type { Subscription } from './subscriptions'
import type { Goal } from './goals'
import type { Account } from './accounts'
import type { IncomeSource } from './income'
import type { CurrencyCode } from './currencies'

export type { SpendingEntry, Account }

export interface SpendingCategory {
  id: string
  name: string
  color: string
  createdAt: string
}

export interface BudgetConfig {
  id: number
  income: number
  categories: BudgetCategory[]
}

export interface AppSettings {
  id: number
  lastReviewedAt: string
  onboardingComplete?: boolean
  currency?: CurrencyCode
  emergencyFundGoal?: number
  burnRateBalance?: number
  dateOfBirth?: string
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
  spendingCategories!: Table<SpendingCategory, string>

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
    this.version(6).stores({
      budgetConfig: 'id',
      spendingEntries: 'id, date, category',
      subscriptions: 'id, category',
      appSettings: 'id',
      goals: 'id, priority',
      accounts: 'id, type',
      incomeSources: 'id, type, isActive',
      spendingCategories: 'id, name',
    })
    this.version(7)
      .stores({
        budgetConfig: 'id',
        spendingEntries: 'id, date, categoryId',
        subscriptions: 'id, categoryId',
        appSettings: 'id',
        goals: 'id, priority',
        accounts: 'id, type',
        incomeSources: 'id, type, isActive',
        spendingCategories: 'id, name',
      })
      .upgrade(async (tx) => {
        // Migrate spending entries: category string → categoryId
        const entries = await tx.table('spendingEntries').toCollection().toArray()
        for (const entry of entries) {
          if (entry.category && !entry.categoryId) {
            // Find or create category with this name
            const existing = await tx.table('spendingCategories').where('name').equals(entry.category).first()
            const categoryId = existing?.id || `cat_${crypto.randomUUID()}`

            // Create category if it doesn't exist
            if (!existing) {
              await tx.table('spendingCategories').put({
                id: categoryId,
                name: entry.category,
                color: 'gray',
                createdAt: new Date().toISOString(),
              })
            }

            // Update entry with categoryId and remove old category field
            await tx.table('spendingEntries').update(entry.id, {
              categoryId,
              category: undefined,
            })
          }
        }

        // Migrate subscriptions: category string → categoryId
        const subs = await tx.table('subscriptions').toCollection().toArray()
        for (const sub of subs) {
          if (sub.category && !sub.categoryId) {
            // Find or create category with this name
            const existing = await tx.table('spendingCategories').where('name').equals(sub.category).first()
            const categoryId = existing?.id || `cat_${crypto.randomUUID()}`

            // Create category if it doesn't exist
            if (!existing) {
              await tx.table('spendingCategories').put({
                id: categoryId,
                name: sub.category,
                color: 'gray',
                createdAt: new Date().toISOString(),
              })
            }

            // Update subscription with categoryId and remove old category field
            await tx.table('subscriptions').update(sub.id, {
              categoryId,
              category: undefined,
            })
          }
        }
      })
  }
}

export const db = new YuchaDB()
