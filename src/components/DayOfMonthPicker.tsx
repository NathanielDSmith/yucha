import { useState } from 'react'
import './DayOfMonthPicker.css'

interface DayOfMonthPickerProps {
  value: number
  onChange: (day: number) => void
  label?: string
}

function getOrdinalSuffix(num: number): string {
  if (num > 3 && num < 21) return 'th'
  switch (num % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

function formatOrdinal(num: number): string {
  return `${num}${getOrdinalSuffix(num)}`
}

export function DayOfMonthPicker({ value, onChange, label = 'Payday' }: DayOfMonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelectDay = (day: number) => {
    onChange(day)
    setIsOpen(false)
  }

  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  return (
    <div className="day-picker__container">
      <button
        type="button"
        className="day-picker__button"
        onClick={() => setIsOpen(!isOpen)}
        title={label}
      >
        {value ? formatOrdinal(value) : label}
      </button>
        {isOpen && (
          <div className="day-picker__calendar">
            <button
              type="button"
              className="day-picker__day day-picker__day--placeholder"
              disabled
            >
              {label}
            </button>
            {days.map((day) => (
              <button
                key={day}
                type="button"
                className={`day-picker__day ${day === value ? 'day-picker__day--selected' : ''}`}
                onClick={() => handleSelectDay(day)}
              >
                {day}
              </button>
            ))}
          </div>
        )}
    </div>
  )
}
