import type { Account } from './accounts'
import type { SpendingEntry } from './spending'

export interface AccountMetrics {
  account: Account
  percentOfNetWorth: number
  monthlySpending: number
  savingsRate: number
  daysToDepletion: number
}

export function getAccountMetrics(
  account: Account,
  totalNetWorth: number,
  spendingEntries: SpendingEntry[],
): AccountMetrics {
  const percentOfNetWorth = totalNetWorth > 0 ? (account.balance / totalNetWorth) * 100 : 0

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const monthlySpending = spendingEntries
    .filter((e) => new Date(e.date) >= thirtyDaysAgo)
    .reduce((sum, e) => sum + e.amount, 0) / Math.max(1, 30)

  const savingsRate = monthlySpending > 0 ? account.balance / monthlySpending : 0
  const daysToDepletion = monthlySpending > 0 ? (account.balance / monthlySpending) * 30 : 0

  return {
    account,
    percentOfNetWorth,
    monthlySpending,
    savingsRate,
    daysToDepletion,
  }
}

export function getAllAccountMetrics(
  accounts: Account[],
  spendingEntries: SpendingEntry[],
): AccountMetrics[] {
  const totalNetWorth = accounts.reduce((sum, a) => sum + a.balance, 0)

  return accounts.map((account) =>
    getAccountMetrics(account, totalNetWorth, spendingEntries),
  )
}
