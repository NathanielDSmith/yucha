import { CURRENCIES } from '../lib/currencies'
import { useCurrencyContext } from '../lib/CurrencyContext'
import './CurrencySelector.css'

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrencyContext()

  return (
    <div className="currency-selector">
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as any)}
        className="currency-selector__select"
        aria-label="Select currency"
      >
        {Object.values(CURRENCIES).map((curr) => (
          <option key={curr.code} value={curr.code}>
            {curr.symbol} {curr.code}
          </option>
        ))}
      </select>
    </div>
  )
}
