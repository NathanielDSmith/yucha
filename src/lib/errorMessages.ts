export const ERROR_MESSAGES = {
  // Spending
  LOAD_SPENDING: 'Failed to load spending entries. Please try again.',
  ADD_SPENDING: 'Failed to log spending. Please try again.',
  DELETE_SPENDING: 'Failed to delete spending entry. Please try again.',

  // Subscriptions
  LOAD_SUBSCRIPTIONS: 'Failed to load subscriptions. Please try again.',
  ADD_SUBSCRIPTION: 'Failed to add subscription. Please try again.',
  DELETE_SUBSCRIPTION: 'Failed to delete subscription. Please try again.',

  // Goals
  LOAD_GOALS: 'Failed to load goals. Please try again.',
  ADD_GOAL: 'Failed to create goal. Please try again.',
  DELETE_GOAL: 'Failed to delete goal. Please try again.',
  UPDATE_GOAL: 'Failed to update goal. Please try again.',

  // Accounts & Net Worth
  LOAD_ACCOUNTS: 'Failed to load accounts. Please try again.',
  ADD_ACCOUNT: 'Failed to add account. Please try again.',
  DELETE_ACCOUNT: 'Failed to delete account. Please try again.',
  LOAD_NET_WORTH: 'Failed to load net worth data. Please try again.',

  // Income
  LOAD_INCOME: 'Failed to load income sources. Please try again.',
  ADD_INCOME: 'Failed to add income source. Please try again.',
  DELETE_INCOME: 'Failed to delete income source. Please try again.',

  // Emergency Fund
  LOAD_EMERGENCY_FUND: 'Failed to load emergency fund data. Please try again.',
  UPDATE_EMERGENCY_FUND: 'Failed to update emergency fund. Please try again.',

  // Burn Rate
  LOAD_BURN_RATE: 'Failed to load burn rate data. Please try again.',
  UPDATE_BURN_RATE: 'Failed to update burn rate balance. Please try again.',

  // Generic
  LOAD_DATA: 'Failed to load data. Please try again.',
  GENERAL: 'An error occurred. Please try again.',
} as const
