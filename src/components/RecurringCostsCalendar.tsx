import { useState, useEffect } from 'react'
import { db, type SpendingCategory } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { useCurrencyContext } from '../lib/CurrencyContext'
import type { Subscription } from '../lib/subscriptions'
import './RecurringCostsCalendar.css'

export function RecurringCostsCalendar() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [categories, setCategories] = useState<SpendingCategory[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const { currency } = useCurrencyContext()

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    const all = await db.subscriptions.toArray()
    setSubscriptions(all)
    const cats = await db.spendingCategories.toArray()
    setCategories(cats)
  }

  // Get days in month
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Group subscriptions by day of month
  const costsByDay: Record<number, Subscription[]> = {}
  subscriptions.forEach((sub) => {
    const day = parseInt(sub.startDate.split('-')[2])
    if (day <= daysInMonth) {
      if (!costsByDay[day]) costsByDay[day] = []
      costsByDay[day].push(sub)
    }
  })

  // Calculate totals for each day
  const totalByDay: Record<number, number> = {}
  Object.entries(costsByDay).forEach(([day, costs]) => {
    totalByDay[Number(day)] = costs.reduce((sum, cost) => sum + cost.monthlyAmount, 0)
  })

  // Get previous and next month
  const prevMonth = new Date(year, month - 1, 1)
  const nextMonth = new Date(year, month + 1, 1)

  // Days of week header
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Generate calendar grid
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }

  // Selected day's bills
  const selectedBills = selectedDay ? costsByDay[selectedDay] || [] : []
  const selectedTotal = selectedDay ? totalByDay[selectedDay] || 0 : 0

  return (
    <div className="recurring-costs-calendar">
      <div className="recurring-costs-calendar__header">
        <button
          onClick={() => setCurrentMonth(prevMonth)}
          className="recurring-costs-calendar__nav-button"
        >
          ←
        </button>
        <h2 className="recurring-costs-calendar__title">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={() => setCurrentMonth(nextMonth)}
          className="recurring-costs-calendar__nav-button"
        >
          →
        </button>
      </div>

      <div className="recurring-costs-calendar__container">
        <div className="recurring-costs-calendar__calendar">
          {/* Day headers */}
          <div className="recurring-costs-calendar__day-headers">
            {daysOfWeek.map((day) => (
              <div key={day} className="recurring-costs-calendar__day-header">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="recurring-costs-calendar__grid">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`recurring-costs-calendar__day ${day ? 'recurring-costs-calendar__day--filled' : ''} ${selectedDay === day ? 'recurring-costs-calendar__day--selected' : ''}`}
                onClick={() => day && setSelectedDay(selectedDay === day ? null : day)}
              >
                {day && (
                  <>
                    <div className="recurring-costs-calendar__day-number">{day}</div>
                    {costsByDay[day] && (
                      <div className="recurring-costs-calendar__day-info">
                        <span className="recurring-costs-calendar__bill-count">
                          {costsByDay[day].length} bill{costsByDay[day].length !== 1 ? 's' : ''}
                        </span>
                        <span className="recurring-costs-calendar__day-total">
                          {formatCurrency(totalByDay[day], currency)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Details panel */}
        {selectedDay && selectedBills.length > 0 && (
          <div className="recurring-costs-calendar__details">
            <h3 className="recurring-costs-calendar__details-title">
              Due on {currentMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </h3>
            <div className="recurring-costs-calendar__bills-list">
              {selectedBills.map((bill) => (
                <div key={bill.id} className="recurring-costs-calendar__bill-item">
                  <div className="recurring-costs-calendar__bill-header">
                    <strong>{bill.name}</strong>
                    <span className="recurring-costs-calendar__bill-amount">
                      {formatCurrency(bill.monthlyAmount, currency)}
                    </span>
                  </div>
                  <span className="recurring-costs-calendar__bill-category">{categories.find((c) => c.id === bill.categoryId)?.name || 'Unknown'}</span>
                </div>
              ))}
            </div>
            <div className="recurring-costs-calendar__details-footer">
              <span className="recurring-costs-calendar__details-label">Day total:</span>
              <strong className="recurring-costs-calendar__details-total">
                {formatCurrency(selectedTotal, currency)}
              </strong>
            </div>
          </div>
        )}

        {selectedDay && selectedBills.length === 0 && (
          <div className="recurring-costs-calendar__empty">
            <p>No bills due on {currentMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          </div>
        )}
      </div>
    </div>
  )
}
