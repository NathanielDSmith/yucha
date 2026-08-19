import { useEffect, useState, type FormEvent } from 'react'
import { db } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { useToast } from '../lib/toastStore'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { ACCOUNT_TYPES, type AccountType } from '../lib/accounts'
import { getAllAccountMetrics } from '../lib/accountmetrics'
import './AccountManagement.css'

export function AccountManagement() {
  const { show: showToast } = useToast()
  const [accounts, setAccounts] = useState([])
  const [spendingEntries, setSpendingEntries] = useState([])
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [type, setType] = useState<AccountType>('savings')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editBalance, setEditBalance] = useState('')
  const [editType, setEditType] = useState<AccountType>('savings')
  const [editValidationError, setEditValidationError] = useState<string | null>(null)
  const { currency } = useCurrencyContext()

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        await refresh()
      } catch (err) {
        setError('Failed to load accounts. Please try again.')
        console.error('Failed to load accounts:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function refresh() {
    try {
      const allAccounts = await db.accounts.toArray()
      const allSpending = await db.spendingEntries.toArray()
      setAccounts(allAccounts)
      setSpendingEntries(allSpending)
      setError(null)
    } catch (err) {
      setError('Failed to load accounts. Please try again.')
      console.error('Failed to load accounts:', err)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setValidationError(null)
    const amount = Number(balance)

    if (!name.trim()) {
      setValidationError('Account name is required')
      return
    }
    if (!amount || amount < 0) {
      setValidationError('Balance must be 0 or greater')
      return
    }

    try {
      setSubmitting(true)
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
      setValidationError(null)
      showToast('Account added', 'success')
      await refresh()
    } catch (err) {
      showToast('Failed to add account. Please try again.', 'error')
      console.error('Failed to add account:', err)
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(account: any) {
    setEditingId(account.id)
    setEditName(account.name)
    setEditBalance(String(account.balance))
    setEditType(account.type)
    setEditValidationError(null)
  }

  async function handleUpdateSubmit(e: FormEvent) {
    e.preventDefault()
    setEditValidationError(null)
    const amount = Number(editBalance)

    if (!editName.trim()) {
      setEditValidationError('Account name is required')
      return
    }
    if (!editBalance || amount < 0) {
      setEditValidationError('Balance must be 0 or greater')
      return
    }

    try {
      setSubmitting(true)
      await db.accounts.update(editingId!, {
        name: editName.trim(),
        balance: amount,
        type: editType,
        updatedAt: new Date().toISOString(),
      })
      showToast('Account updated successfully', 'success')
      setEditingId(null)
      await refresh()
    } catch (err) {
      showToast('Failed to update account. Please try again.', 'error')
      console.error('Failed to update account:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteAccount(id: string) {
    try {
      await db.accounts.delete(id)
      showToast('Account deleted', 'success')
      await refresh()
    } catch (err) {
      showToast('Failed to delete account. Please try again.', 'error')
      console.error('Failed to delete account:', err)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading accounts..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refresh} />
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
          disabled={submitting}
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
          disabled={submitting}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AccountType)}
          className="account-management__select"
          id="account-type"
          name="account-type"
          disabled={submitting}
        >
          {Object.entries(ACCOUNT_TYPES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="account-management__button" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Account'}
        </button>
        {validationError && <ErrorMessage message={validationError} />}
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
                        onClick={() => handleEdit(metric.account)}
                        className="account-management__edit-btn"
                        aria-label={`Edit ${metric.account.name}`}
                      >
                        ✎
                      </button>
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

      {editingId && (
        <div className="account-management__modal-overlay" onClick={() => setEditingId(null)}>
          <div className="account-management__modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Account</h2>
            <form className="account-management__edit-form" onSubmit={handleUpdateSubmit} noValidate>
              <label>
                <span>Account Name</span>
                <input
                  type="text"
                  placeholder="Account name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={submitting}
                  autoFocus
                  aria-describedby={editValidationError ? 'edit-validation-error' : undefined}
                />
              </label>
              <label>
                <span>Balance</span>
                <input
                  type="number"
                  placeholder="Balance"
                  step="0.01"
                  inputMode="decimal"
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  disabled={submitting}
                  aria-describedby={editValidationError ? 'edit-validation-error' : undefined}
                />
              </label>
              <label>
                <span>Account Type</span>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as AccountType)}
                  disabled={submitting}
                >
                  {Object.entries(ACCOUNT_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {editValidationError && (
                <ErrorMessage message={editValidationError} />
              )}
              <div className="account-management__modal-actions">
                <button
                  type="button"
                  className="account-management__modal-cancel"
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
    </div>
  )
}
