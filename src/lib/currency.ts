import { getCurrency, type CurrencyCode, DEFAULT_CURRENCY } from './currencies'

export function formatCurrency(amount: number, currencyCode: CurrencyCode = DEFAULT_CURRENCY): string {
  if (!isFinite(amount)) {
    const currency = getCurrency(currencyCode)
    return `${currency.symbol}0.00`
  }

  const currency = getCurrency(currencyCode)
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(amount)
}
