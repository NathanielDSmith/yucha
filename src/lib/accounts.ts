import type { CurrencyCode } from './currencies'

export type AccountType = 'cash' | 'savings' | 'investment' | 'other'

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  currency: CurrencyCode
  createdAt: string
  updatedAt: string
}

export const ACCOUNT_TYPES: Record<AccountType, string> = {
  cash: 'Cash',
  savings: 'Savings Account',
  investment: 'Investment',
  other: 'Other',
}

export function calculateNetWorth(accounts: Account[]): number {
  return accounts.reduce((total, account) => total + account.balance, 0)
}

export function getAccountsByType(accounts: Account[], type: AccountType): Account[] {
  return accounts.filter((a) => a.type === type)
}

export function getTotalByType(accounts: Account[], type: AccountType): number {
  return getAccountsByType(accounts, type).reduce((total, a) => total + a.balance, 0)
}
