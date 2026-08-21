import { useEffect, useState, useRef } from 'react'
import { db, APP_SETTINGS_ID } from '../lib/db'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { useToast } from '../lib/toastStore'
import { BudgetPlanner } from './BudgetPlanner'
import { AccountManagement } from './AccountManagement'
import { exportData, importData, downloadBackup, readBackupFile } from '../lib/dataBackup'
import './Settings.css'

type SettingsTab = 'personal' | 'budget' | 'accounts' | 'backup'

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

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await db.appSettings.get(APP_SETTINGS_ID)
        if (settings?.dateOfBirth) {
          setDateOfBirth(settings.dateOfBirth)
          setDateOfBirthInput(settings.dateOfBirth)
        }
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
    console.log('Blur fired. newDob:', newDob, 'dateOfBirth:', dateOfBirth)
    if (!newDob || newDob === dateOfBirth) {
      console.log('Early return')
      return
    }
    console.log('Saving DOB...')
    try {
      const settings = await db.appSettings.get(APP_SETTINGS_ID)
      console.log('Got settings:', settings)
      if (settings) {
        const updatedSettings = { ...settings, dateOfBirth: newDob }
        console.log('About to put:', updatedSettings)
        const result = await db.appSettings.put(updatedSettings)
        console.log('Put result:', result)

        // Verify immediately
        const verify = await db.appSettings.get(APP_SETTINGS_ID)
        console.log('Verified after save:', verify)

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
      setCurrency(newCurrency)
      await db.appSettings.update(APP_SETTINGS_ID, { currency: newCurrency })
      showToast('Currency updated', 'success')
    } catch (err) {
      showToast('Failed to update currency', 'error')
      console.error('Failed to update currency:', err)
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
