import { db, BUDGET_CONFIG_ID } from './db'

export async function seedTestData() {
  try {
    // Clear existing data
    await db.spendingEntries.clear()
    await db.subscriptions.clear()
    await db.goals.clear()
    await db.budgetConfig.clear()
    await db.accounts.clear()

    // Comprehensive spending entries (2 weeks of realistic data)
    const spendingEntries = [
      // Food & Groceries
      { id: '1', date: '2026-08-19', category: 'Food', amount: 52.35, note: 'Grocery store - weekly shop' },
      { id: '2', date: '2026-08-18', category: 'Food', amount: 28.50, note: 'Coffee & lunch' },
      { id: '3', date: '2026-08-17', category: 'Food', amount: 45.00, note: 'Dinner at restaurant' },
      { id: '4', date: '2026-08-16', category: 'Food', amount: 18.75, note: 'Breakfast & snacks' },
      { id: '5', date: '2026-08-15', category: 'Food', amount: 62.80, note: 'Grocery store' },
      { id: '6', date: '2026-08-14', category: 'Food', amount: 35.20, note: 'Pizza night' },
      { id: '7', date: '2026-08-13', category: 'Food', amount: 12.50, note: 'Coffee' },

      // Transport
      { id: '8', date: '2026-08-19', category: 'Transport', amount: 12.00, note: 'Gas' },
      { id: '9', date: '2026-08-16', category: 'Transport', amount: 18.50, note: 'Uber rides' },
      { id: '10', date: '2026-08-12', category: 'Transport', amount: 9.75, note: 'Public transit' },

      // Shopping
      { id: '11', date: '2026-08-18', category: 'Shopping', amount: 89.99, note: 'New t-shirts' },
      { id: '12', date: '2026-08-15', category: 'Shopping', amount: 34.50, note: 'Phone case' },
      { id: '13', date: '2026-08-11', category: 'Shopping', amount: 120.00, note: 'Shoes' },

      // Entertainment
      { id: '14', date: '2026-08-17', category: 'Entertainment', amount: 25.00, note: 'Movie tickets' },
      { id: '15', date: '2026-08-14', category: 'Entertainment', amount: 15.00, note: 'Concert' },
      { id: '16', date: '2026-08-10', category: 'Entertainment', amount: 45.00, note: 'Video game' },

      // Healthcare
      { id: '17', date: '2026-08-13', category: 'Healthcare', amount: 65.00, note: 'Doctor visit' },
      { id: '18', date: '2026-08-09', category: 'Healthcare', amount: 22.50, note: 'Pharmacy' },

      // Utilities (one-off bills)
      { id: '19', date: '2026-08-15', category: 'Utilities', amount: 150.00, note: 'Electric bill' },
      { id: '20', date: '2026-08-10', category: 'Utilities', amount: 75.00, note: 'Water bill' },
    ]

    for (const entry of spendingEntries) {
      await db.spendingEntries.add(entry)
    }

    // Comprehensive subscriptions & recurring costs
    const subscriptions = [
      { id: '1', name: 'Rent', category: 'Housing', monthlyAmount: 1200.00, startDate: '2024-01-01', usageCount: 8 },
      { id: '2', name: 'Netflix', category: 'Subscriptions', monthlyAmount: 15.99, startDate: '2024-03-15', usageCount: 17 },
      { id: '3', name: 'Spotify Premium', category: 'Subscriptions', monthlyAmount: 12.99, startDate: '2024-02-01', usageCount: 18 },
      { id: '4', name: 'Gym Membership', category: 'Health', monthlyAmount: 50.00, startDate: '2024-01-10', usageCount: 8 },
      { id: '5', name: 'Internet', category: 'Utilities', monthlyAmount: 60.00, startDate: '2024-01-15', usageCount: 8 },
      { id: '6', name: 'Phone Bill', category: 'Utilities', monthlyAmount: 45.00, startDate: '2024-01-01', usageCount: 8 },
      { id: '7', name: 'Adobe Creative Cloud', category: 'Software', monthlyAmount: 54.99, startDate: '2024-04-20', usageCount: 4 },
      { id: '8', name: 'Cloud Storage (iCloud)', category: 'Software', monthlyAmount: 9.99, startDate: '2024-01-05', usageCount: 8 },
      { id: '9', name: 'Car Insurance', category: 'Insurance', monthlyAmount: 125.00, startDate: '2024-01-01', usageCount: 8 },
      { id: '10', name: 'Electric Bill (Recurring)', category: 'Utilities', monthlyAmount: 150.00, startDate: '2024-01-01', usageCount: 8 },
    ]

    for (const sub of subscriptions) {
      await db.subscriptions.add(sub)
    }

    // Multiple goals at different stages
    const goals = [
      {
        id: '1',
        name: 'Emergency Fund',
        targetAmount: 10000,
        currentAmount: 6400,
        category: 'emergency' as const,
        targetDate: undefined,
        priority: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Europe Vacation',
        targetAmount: 4500,
        currentAmount: 2100,
        category: 'travel' as const,
        targetDate: '2026-07-2027',
        priority: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'MacBook Pro',
        targetAmount: 2500,
        currentAmount: 1200,
        category: 'purchase' as const,
        targetDate: '2026-12-01',
        priority: 2,
        createdAt: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'Car Fund',
        targetAmount: 15000,
        currentAmount: 4500,
        category: 'vehicle' as const,
        targetDate: '2027-12-31',
        priority: 3,
        createdAt: new Date().toISOString(),
      },
      {
        id: '5',
        name: 'Home Furniture',
        targetAmount: 3000,
        currentAmount: 750,
        category: 'home' as const,
        targetDate: '2026-10-31',
        priority: 4,
        createdAt: new Date().toISOString(),
      },
      {
        id: '6',
        name: 'Wedding Fund',
        targetAmount: 25000,
        currentAmount: 8900,
        category: 'events' as const,
        targetDate: '2027-06-01',
        priority: 5,
        createdAt: new Date().toISOString(),
      },
    ]

    for (const goal of goals) {
      await db.goals.add(goal)
    }

    // Bank accounts and savings
    const accounts = [
      {
        id: '1',
        name: 'Checking Account',
        type: 'cash' as const,
        balance: 4500.00,
        currency: 'USD' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'High-Yield Savings',
        type: 'savings' as const,
        balance: 25000.00,
        currency: 'USD' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Investment Portfolio',
        type: 'investment' as const,
        balance: 42500.00,
        currency: 'USD' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    for (const account of accounts) {
      await db.accounts.add(account)
    }

    // Realistic budget config
    await db.budgetConfig.put({
      id: 1,
      categories: [
        { id: '1', name: 'Food', type: 'percentage' as const, percent: 18, amount: undefined },
        { id: '2', name: 'Transport', type: 'percentage' as const, percent: 8, amount: undefined },
        { id: '3', name: 'Entertainment', type: 'percentage' as const, percent: 7, amount: undefined },
        { id: '4', name: 'Shopping', type: 'percentage' as const, percent: 12, amount: undefined },
        { id: '5', name: 'Utilities', type: 'percentage' as const, percent: 20, amount: undefined },
        { id: '6', name: 'Healthcare', type: 'percentage' as const, percent: 5, amount: undefined },
        { id: '7', name: 'Other', type: 'percentage' as const, percent: 30, amount: undefined },
      ],
    })

    // App settings with realistic values
    await db.appSettings.put({
      id: 1,
      onboardingComplete: true,
      currency: 'USD',
      emergencyFundGoal: 10000,
      burnRateBalance: null,
    })

    console.log('✅ Comprehensive test data seeded successfully!')
    return true
  } catch (error) {
    console.error('❌ Error seeding test data:', error)
    return false
  }
}

export async function clearTestData() {
  try {
    await db.spendingEntries.clear()
    await db.subscriptions.clear()
    await db.goals.clear()
    await db.budgetConfig.clear()
    await db.accounts.clear()
    await db.appSettings.clear()
    console.log('✅ Test data cleared!')
    return true
  } catch (error) {
    console.error('❌ Error clearing data:', error)
    return false
  }
}

export async function backupUserData() {
  try {
    const backup = {
      spendingEntries: await db.spendingEntries.toArray(),
      subscriptions: await db.subscriptions.toArray(),
      goals: await db.goals.toArray(),
      budgetConfig: await db.budgetConfig.get(1),
      appSettings: await db.appSettings.get(1),
      accounts: await db.accounts.toArray(),
    }
    localStorage.setItem('yucha_user_backup', JSON.stringify(backup))
    console.log('✅ User data backed up to localStorage')
    return true
  } catch (error) {
    console.error('❌ Error backing up data:', error)
    return false
  }
}

export async function restoreUserData() {
  try {
    const backup = localStorage.getItem('yucha_user_backup')
    if (!backup) {
      console.warn('⚠️ No backup found')
      return false
    }

    const data = JSON.parse(backup)

    // Clear demo data
    await db.spendingEntries.clear()
    await db.subscriptions.clear()
    await db.goals.clear()
    await db.budgetConfig.clear()
    await db.accounts.clear()

    // Restore user data
    if (data.spendingEntries?.length) await db.spendingEntries.bulkAdd(data.spendingEntries)
    if (data.subscriptions?.length) await db.subscriptions.bulkAdd(data.subscriptions)
    if (data.goals?.length) await db.goals.bulkAdd(data.goals)
    if (data.budgetConfig) await db.budgetConfig.put(data.budgetConfig)
    if (data.accounts?.length) await db.accounts.bulkAdd(data.accounts)

    console.log('✅ User data restored!')
    return true
  } catch (error) {
    console.error('❌ Error restoring data:', error)
    return false
  }
}
