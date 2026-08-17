import { createContext, useContext, type ReactNode } from 'react'
import { useCurrency as useBaseCurrency } from './useCurrency'
import { DEFAULT_CURRENCY, type CurrencyCode } from './currencies'

interface CurrencyContextType {
  currency: CurrencyCode
  setCurrency: (code: CurrencyCode) => Promise<void>
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: DEFAULT_CURRENCY,
  setCurrency: async () => {},
})

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { currency, setCurrency } = useBaseCurrency()

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrencyContext() {
  return useContext(CurrencyContext)
}
