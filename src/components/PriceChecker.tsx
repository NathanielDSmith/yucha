import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { db } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { projectCompoundGrowth } from '../lib/compounding'
import './PriceChecker.css'

export function PriceChecker() {
  const { currency } = useCurrencyContext()
  const [amount, setAmount] = useState('')
  const [results, setResults] = useState<{ years: number; value: number }[]>([])
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(null)

  useEffect(() => {
    async function loadSettings() {
      const settings = await db.appSettings.get(1)
      if (settings?.dateOfBirth) {
        setDateOfBirth(settings.dateOfBirth)
      }
    }
    loadSettings()
  }, [])

  useEffect(() => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setResults([])
      return
    }

    const num = Number(amount)
    const timeframes = [1, 5, 10, 20]
    const calculations = timeframes.map((years) => ({
      years,
      value: projectCompoundGrowth(num, years, 0.07).futureValue,
    }))

    // Add pension age if available
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth)
      const retirementAge = 65
      const yearsToRetirement = retirementAge - (new Date().getFullYear() - dob.getFullYear())
      if (yearsToRetirement > 0) {
        calculations.push({
          years: yearsToRetirement,
          value: projectCompoundGrowth(num, yearsToRetirement, 0.07).futureValue,
        })
      }
    }

    setResults(calculations)
  }, [amount, dateOfBirth])

  return (
    <motion.div
      className="price-checker"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="price-checker__title">Price Checker</h3>
      <p className="price-checker__subtitle">See what a purchase could be worth by retirement</p>

      <div className="price-checker__input-group">
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="price-checker__input"
        />
        <span className="price-checker__currency">{currency}</span>
      </div>

      {results.length > 0 && (
        <div className="price-checker__timeline">
          {results.map((result, idx) => (
            <motion.div
              key={result.years}
              className="price-checker__timeframe"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="price-checker__timeframe-label">
                {result.years === 65 || (dateOfBirth && result.years > 20)
                  ? 'Pension Age'
                  : `${result.years} Year${result.years !== 1 ? 's' : ''}`}
              </div>
              <div className="price-checker__timeframe-value">
                {formatCurrency(result.value, currency)}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!results.length && amount && (
        <div className="price-checker__empty">
          Enter an amount to see projections
        </div>
      )}
    </motion.div>
  )
}
