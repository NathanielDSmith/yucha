import { useEffect, useState, type FormEvent } from 'react'
import { db } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { ACCOUNT_TYPES, type AccountType, calculateNetWorth, getTotalByType, type Account } from '../lib/accounts'
import { DEFAULT_CURRENCY } from '../lib/currencies'
import './NetWorthDashboard.css'

export function NetWorthDashboard() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [type, setType] = useState<AccountType>('savings')
  const { currency } = useCurrencyContext()

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    const allAccounts = await db.accounts.toArray()
    setAccounts(allAccounts)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const amount = Number(balance)
    if (!name.trim() || !amount || amount < 0) return

    await db.accounts.add({
      id: crypto.randomUUID(),
      name: name.trim(),
      balance: amount,
      type,
      currency: currency || DEFAULT_CURRENCY,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    setName('')
    setBalance('')
    setType('savings')
    await refresh()
  }

  async function deleteAccount(id: string) {
    await db.accounts.delete(id)
    await refresh()
  }

  const netWorth = calculateNetWorth(accounts)

  return (
    <div className="net-worth">
      <div className="net-worth__hero">
        <p className="net-worth__hero-label">Net Worth</p>
        <p className="net-worth__hero-value">{formatCurrency(netWorth, currency)}</p>
      </div>

      <div className="net-worth__breakdown">
        {(Object.keys(ACCOUNT_TYPES) as AccountType[]).map((accountType) => {
          const total = getTotalByType(accounts, accountType)
          return (
            <div key={accountType} className="net-worth__type-card">
              <p className="net-worth__type-label">{ACCOUNT_TYPES[accountType]}</p>
              <p className="net-worth__type-value">{formatCurrency(total, currency)}</p>
            </div>
          )
        })}
      </div>

      <form className="net-worth__form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Account name (e.g., Checking)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="net-worth__input"
          id="net-worth-name"
          name="net-worth-name"
        />
        <input
          type="number"
          placeholder="Balance"
          step="0.01"
          inputMode="decimal"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="net-worth__input"
          id="net-worth-balance"
          name="net-worth-balance"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AccountType)}
          className="net-worth__select"
          id="net-worth-type"
          name="net-worth-type"
        >
          {Object.entries(ACCOUNT_TYPES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="net-worth__button">
          Add Account
        </button>
      </form>

      {accounts.length === 0 && (
        <div className="net-worth__empty">
          <p>No accounts yet — add one to start tracking your net worth.</p>
        </div>
      )}

      {accounts.length > 0 && (
        <div className="net-worth__list">
          {accounts.map((account) => (
            <div key={account.id} className="net-worth__account">
              <div className="net-worth__account-info">
                <p className="net-worth__account-name">{account.name}</p>
                <p className="net-worth__account-type">{ACCOUNT_TYPES[account.type as AccountType]}</p>
              </div>
              <p className="net-worth__account-balance">{formatCurrency(account.balance, currency)}</p>
              <button
                type="button"
                onClick={() => deleteAccount(account.id)}
                className="net-worth__delete"
                aria-label={`Delete ${account.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
