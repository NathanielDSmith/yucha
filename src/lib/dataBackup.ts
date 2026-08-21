import { db } from './db'

export interface BackupData {
  version: number
  exportedAt: string
  data: {
    budgetConfig: unknown[]
    spendingEntries: unknown[]
    subscriptions: unknown[]
    appSettings: unknown[]
    goals: unknown[]
    accounts: unknown[]
    incomeSources: unknown[]
    spendingCategories: unknown[]
  }
}

export async function exportData(): Promise<BackupData> {
  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      budgetConfig: await db.budgetConfig.toArray(),
      spendingEntries: await db.spendingEntries.toArray(),
      subscriptions: await db.subscriptions.toArray(),
      appSettings: await db.appSettings.toArray(),
      goals: await db.goals.toArray(),
      accounts: await db.accounts.toArray(),
      incomeSources: await db.incomeSources.toArray(),
      spendingCategories: await db.spendingCategories.toArray(),
    },
  }
  return backup
}

export async function importData(backup: BackupData): Promise<void> {
  if (backup.version !== 1) {
    throw new Error(`Unsupported backup version: ${backup.version}`)
  }

  try {
    // Clear existing data
    await db.budgetConfig.clear()
    await db.spendingEntries.clear()
    await db.subscriptions.clear()
    await db.appSettings.clear()
    await db.goals.clear()
    await db.accounts.clear()
    await db.incomeSources.clear()
    await db.spendingCategories.clear()

    // Import data
    if (backup.data.budgetConfig.length > 0) {
      await db.budgetConfig.bulkAdd(backup.data.budgetConfig as any)
    }
    if (backup.data.spendingEntries.length > 0) {
      await db.spendingEntries.bulkAdd(backup.data.spendingEntries as any)
    }
    if (backup.data.subscriptions.length > 0) {
      await db.subscriptions.bulkAdd(backup.data.subscriptions as any)
    }
    if (backup.data.appSettings.length > 0) {
      await db.appSettings.bulkAdd(backup.data.appSettings as any)
    }
    if (backup.data.goals.length > 0) {
      await db.goals.bulkAdd(backup.data.goals as any)
    }
    if (backup.data.accounts.length > 0) {
      await db.accounts.bulkAdd(backup.data.accounts as any)
    }
    if (backup.data.incomeSources.length > 0) {
      await db.incomeSources.bulkAdd(backup.data.incomeSources as any)
    }
    if (backup.data.spendingCategories.length > 0) {
      await db.spendingCategories.bulkAdd(backup.data.spendingCategories as any)
    }
  } catch (error) {
    throw new Error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function downloadBackup(backup: BackupData): void {
  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `yucha-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function readBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string
        const backup = JSON.parse(json) as BackupData
        resolve(backup)
      } catch (error) {
        reject(new Error('Invalid backup file format'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
