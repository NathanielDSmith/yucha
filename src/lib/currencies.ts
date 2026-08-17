export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY'

export interface Currency {
  code: CurrencyCode
  name: string
  symbol: string
  locale: string
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    locale: 'en-US',
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    locale: 'de-DE',
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    locale: 'en-GB',
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    locale: 'ja-JP',
  },
}

export const DEFAULT_CURRENCY: CurrencyCode = 'USD'

export function getCurrency(code: CurrencyCode): Currency {
  return CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY]
}
