import { useEffect, useState, useRef } from 'react'
import { db, APP_SETTINGS_ID } from '../lib/db'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { useToast } from '../lib/toastStore'
import { BudgetPlanner } from './BudgetPlanner'
import { AccountManagement } from './AccountManagement'
import { exportData, importData, downloadBackup, readBackupFile } from '../lib/dataBackup'
import type { CurrencyCode } from '../lib/currencies'
import './Settings.css'

type SettingsTab = 'personal' | 'budget' | 'accounts' | 'backup' | 'features'

export function Settings() {
  const { currency, setCurrency } = useCurrencyContext()
  const { show: showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [dateOfBirthInput, setDateOfBirthInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<SettingsTab>('personal')
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [goalsEnabled, setGoalsEnabled] = useState(true)
  const [insightsEnabled, setInsightsEnabled] = useState(true)
  const [emergencyFundEnabled, setEmergencyFundEnabled] = useState(true)
  const [burnRateEnabled, setBurnRateEnabled] = useState(true)
  const [recurringCostsEnabled, setRecurringCostsEnabled] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await db.appSettings.get(APP_SETTINGS_ID)
        if (settings?.dateOfBirth) {
          setDateOfBirth(settings.dateOfBirth)
          setDateOfBirthInput(settings.dateOfBirth)
        }
        setGoalsEnabled(settings?.goalsEnabled ?? true)
        setInsightsEnabled(settings?.insightsEnabled ?? true)
        setEmergencyFundEnabled(settings?.emergencyFundEnabled ?? true)
        setBurnRateEnabled(settings?.burnRateEnabled ?? true)
        setRecurringCostsEnabled(settings?.recurringCostsEnabled ?? true)
        setLoading(false)
      } catch (err) {
        setError('Failed to load settings')
        console.error('Failed to load settings:', err)
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  async function handleDateOfBirthBlur(newDob: string) {
    if (!newDob || newDob === dateOfBirth) {
      return
    }
    try {
      const settings = await db.appSettings.get(APP_SETTINGS_ID)
      if (settings) {
        const updatedSettings = { ...settings, dateOfBirth: newDob }
        await db.appSettings.put(updatedSettings)

        // Verify immediately
        const verify = await db.appSettings.get(APP_SETTINGS_ID)

        setDateOfBirth(newDob)
        setDateOfBirthInput(newDob)
        showToast('Date of birth saved', 'success')
      }
    } catch (err) {
      showToast('Failed to save date of birth', 'error')
      console.error('Failed to save DOB:', err)
    }
  }

  async function handleCurrencyChange(newCurrency: string) {
    try {
      const currencyCode = newCurrency as CurrencyCode
      setCurrency(currencyCode)
      await db.appSettings.update(APP_SETTINGS_ID, { currency: currencyCode })
      showToast('Currency updated', 'success')
    } catch (err) {
      showToast('Failed to update currency', 'error')
      console.error('Failed to update currency:', err)
    }
  }

  async function handleToggleFeature(feature: string, enabled: boolean) {
    const update = { [feature]: enabled }
    try {
      await db.appSettings.update(APP_SETTINGS_ID, update)
      showToast(`${feature.charAt(0).toUpperCase() + feature.slice(1)} ${enabled ? 'enabled' : 'disabled'}`, 'success')
    } catch (err) {
      showToast('Failed to update setting', 'error')
      console.error('Failed to toggle feature:', err)
    }
  }

  async function handleExport() {
    try {
      setIsExporting(true)
      const backup = await exportData()
      downloadBackup(backup)
      showToast('Data exported successfully', 'success')
    } catch (err) {
      showToast('Failed to export data', 'error')
      console.error('Export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }

  async function handleImport(file: File) {
    try {
      setIsImporting(true)
      const backup = await readBackupFile(file)
      await importData(backup)
      showToast('Data imported successfully. Please refresh the page.', 'success')
      setTimeout(() => window.location.reload(), 2000)
    } catch (err) {
      showToast(`Failed to import data: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
      console.error('Import failed:', err)
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (loading) {
    return <div className="settings">Loading settings...</div>
  }

  return (
    <div className="settings">
      <div className="settings__tabs">
        <button
          className={activeTab === 'personal' ? 'settings__tab settings__tab--active' : 'settings__tab'}
          onClick={() => setActiveTab('personal')}
        >
          Personal Info
        </button>
        <button
          className={activeTab === 'budget' ? 'settings__tab settings__tab--active' : 'settings__tab'}
          onClick={() => setActiveTab('budget')}
        >
          Budget
        </button>
        <button
          className={activeTab === 'accounts' ? 'settings__tab settings__tab--active' : 'settings__tab'}
          onClick={() => setActiveTab('accounts')}
        >
          Accounts
        </button>
        <button
          className={activeTab === 'features' ? 'settings__tab settings__tab--active' : 'settings__tab'}
          onClick={() => setActiveTab('features')}
        >
          Features
        </button>
        <button
          className={activeTab === 'backup' ? 'settings__tab settings__tab--active' : 'settings__tab'}
          onClick={() => setActiveTab('backup')}
        >
          Data & Backup
        </button>
      </div>

      {activeTab === 'personal' && (
        <>
          <div className="settings__card">
            <h2>Personal Information</h2>

            <div className="settings__field">
              <label htmlFor="dob">Date of Birth</label>
              <div className="settings__input-wrapper">
                <input
                  id="dob"
                  type="date"
                  value={dateOfBirthInput}
                  onChange={(e) => {
                    setDateOfBirthInput(e.target.value)
                  }}
                  onBlur={(e) => {
                    handleDateOfBirthBlur(e.target.value)
                  }}
                />
                <span className="settings__info-icon" title="Used to calculate your estimated pension year based on Japan's retirement age. All data stored locally on your device.">
                  ℹ️
                </span>
              </div>
              <p className="settings__help-text">
                Used to calculate your estimated pension year based on Japan's retirement age. All data stored locally on your device — never sent to servers.
              </p>
            </div>

          </div>

          <div className="settings__card">
            <h2>Currency</h2>

            <div className="settings__field">
              <label htmlFor="currency">Currency</label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
              >
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
                <option value="JPY">¥ JPY</option>
              </select>
              <p className="settings__help-text">
                ⚠️ Changing currency only affects new entries. Existing amounts are not converted.
              </p>
            </div>
          </div>

          {error && <div className="settings__error">{error}</div>}
        </>
      )}

      {activeTab === 'budget' && <BudgetPlanner />}
      {activeTab === 'accounts' && <AccountManagement />}

      {activeTab === 'features' && (
        <div className="settings__card">
          <h2>Features</h2>
          <p className="settings__help-text">
            Toggle features on or off to customize your experience. Disabled features won't appear in the navigation.
          </p>

          <div className="settings__toggle-group">
            <div className="settings__toggle-item">
              <div>
                <h3 className="settings__toggle-title">Goals</h3>
                <p className="settings__toggle-description">Track and manage financial goals with opportunity cost analysis</p>
              </div>
              <label className="settings__toggle-switch">
                <input
                  type="checkbox"
                  checked={goalsEnabled}
                  onChange={(e) => {
                    setGoalsEnabled(e.target.checked)
                    handleToggleFeature('goalsEnabled', e.target.checked)
                  }}
                />
                <span className="settings__toggle-slider"></span>
              </label>
            </div>

            <div className="settings__toggle-item">
              <div>
                <h3 className="settings__toggle-title">Insights</h3>
                <p className="settings__toggle-description">View net worth, spending analysis, and financial trends</p>
              </div>
              <label className="settings__toggle-switch">
                <input
                  type="checkbox"
                  checked={insightsEnabled}
                  onChange={(e) => {
                    setInsightsEnabled(e.target.checked)
                    handleToggleFeature('insightsEnabled', e.target.checked)
                  }}
                />
                <span className="settings__toggle-slider"></span>
              </label>
            </div>

            <div className="settings__toggle-item">
              <div>
                <h3 className="settings__toggle-title">Emergency Fund Tracker</h3>
                <p className="settings__toggle-description">Monitor emergency fund adequacy</p>
              </div>
              <label className="settings__toggle-switch">
                <input
                  type="checkbox"
                  checked={emergencyFundEnabled}
                  onChange={(e) => {
                    setEmergencyFundEnabled(e.target.checked)
                    handleToggleFeature('emergencyFundEnabled', e.target.checked)
                  }}
                />
                <span className="settings__toggle-slider"></span>
              </label>
            </div>

            <div className="settings__toggle-item">
              <div>
                <h3 className="settings__toggle-title">Burn Rate Tracker</h3>
                <p className="settings__toggle-description">Track runway and monthly burn rate</p>
              </div>
              <label className="settings__toggle-switch">
                <input
                  type="checkbox"
                  checked={burnRateEnabled}
                  onChange={(e) => {
                    setBurnRateEnabled(e.target.checked)
                    handleToggleFeature('burnRateEnabled', e.target.checked)
                  }}
                />
                <span className="settings__toggle-slider"></span>
              </label>
            </div>

            <div className="settings__toggle-item">
              <div>
                <h3 className="settings__toggle-title">Recurring Costs</h3>
                <p className="settings__toggle-description">Track subscriptions and recurring bills</p>
              </div>
              <label className="settings__toggle-switch">
                <input
                  type="checkbox"
                  checked={recurringCostsEnabled}
                  onChange={(e) => {
                    setRecurringCostsEnabled(e.target.checked)
                    handleToggleFeature('recurringCostsEnabled', e.target.checked)
                  }}
                />
                <span className="settings__toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="settings__card">
          <h2>Data & Backup</h2>
          <p className="settings__help-text">
            Export your data as a JSON file for backup, or import a previously exported file to restore your data.
          </p>

          <div className="settings__backup-section">
            <h3>Export Data</h3>
            <p className="settings__help-text">
              Download a backup of all your data (spending, income, goals, settings, etc.).
            </p>
            <button
              className="settings__action-button"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Download Backup'}
            </button>
          </div>

          <div className="settings__backup-section">
            <h3>Import Data</h3>
            <p className="settings__help-text">
              ⚠️ Importing will replace all existing data. Make sure to export first if you want to keep current data.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleImport(file)
                }
              }}
              disabled={isImporting}
              style={{ display: 'none' }}
            />
            <button
              className="settings__action-button settings__action-button--danger"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              {isImporting ? 'Importing...' : 'Select Backup File'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
