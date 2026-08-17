import { useEffect, useState } from 'react'
import { db } from './db'
import { DEFAULT_CURRENCY, type CurrencyCode } from './currencies'

export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadCurrency() {
      const settings = await db.appSettings.get(1)
      if (settings?.currency) {
        setCurrencyState(settings.currency)
      }
      setIsLoading(false)
    }
    loadCurrency()
  }, [])

  async function setCurrency(newCurrency: CurrencyCode) {
    setCurrencyState(newCurrency)
    const settings = await db.appSettings.get(1)
    if (settings) {
      await db.appSettings.put({ ...settings, currency: newCurrency })
    }
  }

  return { currency, setCurrency, isLoading }
}
