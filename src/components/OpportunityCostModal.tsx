import { useEffect, useState } from 'react'
import { db, APP_SETTINGS_ID } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import { calculateOpportunityCost } from '../lib/pensionCalculator'
import './OpportunityCostModal.css'

interface OpportunityCostModalProps {
  amount: number
  category: string
  onClose: () => void
  isRecurring?: boolean
}

export function OpportunityCostModal({ amount, category, onClose, isRecurring }: OpportunityCostModalProps) {
  const { currency } = useCurrencyContext()
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [useAnnual, setUseAnnual] = useState(false)

  const displayAmount = useAnnual ? amount * 12 : amount
  const displayLabel = useAnnual ? 'annual cost' : (isRecurring ? 'monthly cost' : 'purchase')

  useEffect(() => {
    async function loadDob() {
      try {
        const settings = await db.appSettings.get(APP_SETTINGS_ID)
        setDateOfBirth(settings?.dateOfBirth || null)
      } catch (err) {
        console.error('Failed to load date of birth:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDob()
  }, [])

  const cost = calculateOpportunityCost(displayAmount, 7, dateOfBirth || undefined)

  return (
    <div className="opportunity-modal-overlay" onClick={onClose}>
      <div className="opportunity-modal" onClick={(e) => e.stopPropagation()}>
        <div className="opportunity-modal__header">
          <h2>Investment Growth Potential</h2>
          <div className="opportunity-modal__controls">
            {isRecurring && (
              <button
                type="button"
                className="opportunity-modal__toggle"
                onClick={() => setUseAnnual(!useAnnual)}
                title={useAnnual ? 'Show monthly calculation' : 'Show annual calculation'}
              >
                {useAnnual ? '📅 Annual' : '📅 Monthly'}
              </button>
            )}
            <button type="button" className="opportunity-modal__close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="opportunity-modal__content">
          <p className="opportunity-modal__intro">
            If you invested <strong>{formatCurrency(displayAmount, currency)}</strong> from your {category} {displayLabel} instead of
            spending it at 7% annual return:
          </p>

          {loading ? (
            <p>Loading date of birth...</p>
          ) : !dateOfBirth ? (
            <div className="opportunity-modal__missing-dob">
              <p>
                Set your date of birth in <strong>Settings</strong> to see your estimated pension year growth.
              </p>
              <div className="opportunity-modal__timeframes">
                <div className="opportunity-modal__timeframe">
                  <div className="opportunity-modal__label">1 Year</div>
                  <div className="opportunity-modal__amount">{formatCurrency(cost.year1, currency)}</div>
                  <div className="opportunity-modal__growth">+{formatCurrency(cost.year1 - displayAmount, currency)}</div>
                </div>

                <div className="opportunity-modal__timeframe">
                  <div className="opportunity-modal__label">5 Years</div>
                  <div className="opportunity-modal__amount">{formatCurrency(cost.year5, currency)}</div>
                  <div className="opportunity-modal__growth">+{formatCurrency(cost.year5 - displayAmount, currency)}</div>
                </div>

                <div className="opportunity-modal__timeframe">
                  <div className="opportunity-modal__label">10 Years</div>
                  <div className="opportunity-modal__amount">{formatCurrency(cost.year10, currency)}</div>
                  <div className="opportunity-modal__growth">+{formatCurrency(cost.year10 - displayAmount, currency)}</div>
                </div>

                <div className="opportunity-modal__timeframe">
                  <div className="opportunity-modal__label">20 Years</div>
                  <div className="opportunity-modal__amount">{formatCurrency(cost.year20, currency)}</div>
                  <div className="opportunity-modal__growth">+{formatCurrency(cost.year20 - displayAmount, currency)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="opportunity-modal__timeframes">
              <div className="opportunity-modal__timeframe">
                <div className="opportunity-modal__label">1 Year</div>
                <div className="opportunity-modal__amount">{formatCurrency(cost.year1, currency)}</div>
                <div className="opportunity-modal__growth">+{formatCurrency(cost.year1 - displayAmount, currency)}</div>
              </div>

              <div className="opportunity-modal__timeframe">
                <div className="opportunity-modal__label">5 Years</div>
                <div className="opportunity-modal__amount">{formatCurrency(cost.year5, currency)}</div>
                <div className="opportunity-modal__growth">+{formatCurrency(cost.year5 - displayAmount, currency)}</div>
              </div>

              <div className="opportunity-modal__timeframe">
                <div className="opportunity-modal__label">10 Years</div>
                <div className="opportunity-modal__amount">{formatCurrency(cost.year10, currency)}</div>
                <div className="opportunity-modal__growth">+{formatCurrency(cost.year10 - displayAmount, currency)}</div>
              </div>

              <div className="opportunity-modal__timeframe">
                <div className="opportunity-modal__label">20 Years</div>
                <div className="opportunity-modal__amount">{formatCurrency(cost.year20, currency)}</div>
                <div className="opportunity-modal__growth">+{formatCurrency(cost.year20 - displayAmount, currency)}</div>
              </div>

              {cost.pensionYear && (
                <div className="opportunity-modal__timeframe opportunity-modal__timeframe--pension">
                  <div className="opportunity-modal__label">Pension Year ({cost.pensionYear})</div>
                  <div className="opportunity-modal__amount">{formatCurrency(cost.pensionAmount || 0, currency)}</div>
                  <div className="opportunity-modal__growth">
                    +{formatCurrency((cost.pensionAmount || 0) - displayAmount, currency)}
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="opportunity-modal__disclaimer">
            💡 This is an educational example assuming historical average market returns. Actual results will vary.
          </p>
        </div>
      </div>
    </div>
  )
}
