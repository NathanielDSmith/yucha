import { useEffect, useState, type FormEvent } from 'react'
import { db } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { ACCOUNT_TYPES, type AccountType } from '../lib/accounts'
import { getAllAccountMetrics } from '../lib/accountmetrics'
import './AccountManagement.css'

export function AccountManagement() {
  const [accounts, setAccounts] = useState([])
  const [spendingEntries, setSpendingEntries] = useState([])
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [type, setType] = useState<AccountType>('savings')
  const { currency } = useCurrencyContext()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const allAccounts = await db.accounts.toArray()
    const allSpending = await db.spendingEntries.toArray()
    setAccounts(allAccounts)
    setSpendingEntries(allSpending)
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
      currency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    setName('')
    setBalance('')
    setType('savings')
    await loadData()
  }

  async function deleteAccount(id: string) {
    await db.accounts.delete(id)
    await loadData()
  }

  const metrics = getAllAccountMetrics(accounts, spendingEntries)
  const totalNetWorth = accounts.reduce((sum, a) => sum + a.balance, 0)
  const accountCount = accounts.length

  return (
    <div className="account-management">
      <div className="account-management__summary">
        <div className="account-management__summary-item">
          <p className="account-management__summary-label">Total Assets</p>
          <p className="account-management__summary-value">
            {formatCurrency(totalNetWorth, currency)}
          </p>
        </div>
        <div className="account-management__summary-item">
          <p className="account-management__summary-label">Accounts</p>
          <p className="account-management__summary-value">{accountCount}</p>
        </div>
        <div className="account-management__summary-item">
          <p className="account-management__summary-label">Largest Account</p>
          <p className="account-management__summary-value">
            {accounts.length > 0
              ? formatCurrency(
                  Math.max(...accounts.map((a) => a.balance)),
                  currency,
                )
              : '$0.00'}
          </p>
        </div>
      </div>

      <form className="account-management__form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Account name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="account-management__input"
          id="account-name"
          name="account-name"
        />
        <input
          type="number"
          placeholder="Balance"
          step="0.01"
          inputMode="decimal"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="account-management__input"
          id="account-balance"
          name="account-balance"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AccountType)}
          className="account-management__select"
          id="account-type"
          name="account-type"
        >
          {Object.entries(ACCOUNT_TYPES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="account-management__button">
          Add Account
        </button>
      </form>

      {accounts.length === 0 ? (
        <div className="account-management__empty">
          <p>No accounts yet — add one to start managing your assets.</p>
        </div>
      ) : (
        <div className="account-management__table-wrapper">
          <table className="account-management__table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Type</th>
                <th>Balance</th>
                <th>% of Total</th>
                <th>Monthly Rate</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.account.id}>
                  <td>
                    <div className="account-management__name">
                      {metric.account.name}
                    </div>
                  </td>
                  <td>
                    <div className="account-management__type">
                      {ACCOUNT_TYPES[metric.account.type as AccountType]}
                    </div>
                  </td>
                  <td>
                    <div className="account-management__amount">
                      {formatCurrency(metric.account.balance, currency)}
                    </div>
                  </td>
                  <td>
                    <div className="account-management__percent">
                      {metric.percentOfNetWorth.toFixed(1)}%
                    </div>
                  </td>
                  <td>
                    <div className="account-management__percent">
                      {metric.daysToDepletion > 0
                        ? `${(metric.daysToDepletion / 30).toFixed(1)}mo`
                        : '∞'}
                    </div>
                  </td>
                  <td>
                    <div className="account-management__actions">
                      <button
                        type="button"
                        onClick={() => deleteAccount(metric.account.id)}
                        className="account-management__delete-btn"
                        aria-label={`Delete ${metric.account.name}`}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
