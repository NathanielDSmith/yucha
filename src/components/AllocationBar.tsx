import { useState, type SyntheticEvent } from 'react'
import type { BudgetResult } from '../lib/budget'
import { formatCurrency } from '../lib/currency'
import {
  CATEGORY_COLOR_SLOTS,
  OTHER_COLOR_VAR,
  UNALLOCATED_COLOR_VAR,
  categorySlotVar,
} from '../lib/colors'
import './AllocationBar.css'

interface Segment {
  key: string
  label: string
  amount: number
  colorVar: string
}

function buildSegments(categories: BudgetResult['categories']): Segment[] {
  const positive = categories
    .map((category, index) => ({ ...category, index }))
    .filter((category) => category.amount > 0)

  const direct = positive.slice(0, CATEGORY_COLOR_SLOTS)
  const overflow = positive.slice(CATEGORY_COLOR_SLOTS)

  const segments: Segment[] = direct.map((category, slot) => ({
    key: `${category.name}-${category.index}`,
    label: category.name || 'Untitled',
    amount: category.amount,
    colorVar: categorySlotVar(slot),
  }))

  if (overflow.length > 0) {
    segments.push({
      key: 'other',
      label: `Other (${overflow.length})`,
      amount: overflow.reduce((sum, category) => sum + category.amount, 0),
      colorVar: OTHER_COLOR_VAR,
    })
  }

  return segments
}

interface HoverInfo {
  label: string
  amount: number
  percent: number
  left: number
  top: number
}

export function AllocationBar({ budget }: { budget: BudgetResult }) {
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const [showTable, setShowTable] = useState(false)

  const segments = buildSegments(budget.categories)
  const isOverAllocated = budget.remaining < 0
  const denominator = isOverAllocated ? budget.totalAllocated : budget.income
  const hasData = denominator > 0 && segments.length > 0

  const widthPercent = (amount: number) =>
    denominator > 0 ? (amount / denominator) * 100 : 0

  const unallocatedPercent =
    !isOverAllocated && denominator > 0
      ? Math.max(0, (budget.remaining / denominator) * 100)
      : 0

  const showHover = (
    event: SyntheticEvent<HTMLElement>,
    label: string,
    amount: number,
  ) => {
    const container = event.currentTarget.closest(
      '.allocation-bar',
    ) as HTMLElement | null
    const rect = event.currentTarget.getBoundingClientRect()
    const containerRect = container?.getBoundingClientRect()
    setHover({
      label,
      amount,
      percent: widthPercent(amount),
      left: rect.left + rect.width / 2 - (containerRect?.left ?? 0),
      top: rect.top - (containerRect?.top ?? 0),
    })
  }

  return (
    <div className="allocation-bar">
      {isOverAllocated && (
        <div className="allocation-bar__warning" role="alert">
          <span aria-hidden="true">⚠</span>
          <span>
            Over-allocated by {formatCurrency(Math.abs(budget.remaining))} —
            your categories add up to more than your income.
          </span>
        </div>
      )}

      {hasData ? (
        <div className="allocation-bar__track">
          {segments.map((segment) => (
            <div
              key={segment.key}
              className="allocation-bar__segment"
              style={{
                flexBasis: `${widthPercent(segment.amount)}%`,
                backgroundColor: segment.colorVar,
              }}
              tabIndex={0}
              role="img"
              aria-label={`${segment.label}: ${formatCurrency(segment.amount)} (${widthPercent(segment.amount).toFixed(1)}%)`}
              onPointerEnter={(e) => showHover(e, segment.label, segment.amount)}
              onFocus={(e) => showHover(e, segment.label, segment.amount)}
              onPointerLeave={() => setHover(null)}
              onBlur={() => setHover(null)}
            />
          ))}
          {unallocatedPercent > 0 && (
            <div
              className="allocation-bar__segment allocation-bar__segment--unallocated"
              style={{
                flexBasis: `${unallocatedPercent}%`,
                backgroundColor: UNALLOCATED_COLOR_VAR,
              }}
              tabIndex={0}
              role="img"
              aria-label={`Unallocated: ${formatCurrency(budget.remaining)} (${unallocatedPercent.toFixed(1)}%)`}
              onPointerEnter={(e) => showHover(e, 'Unallocated', budget.remaining)}
              onFocus={(e) => showHover(e, 'Unallocated', budget.remaining)}
              onPointerLeave={() => setHover(null)}
              onBlur={() => setHover(null)}
            />
          )}
        </div>
      ) : (
        <div className="allocation-bar__track allocation-bar__track--empty">
          Add income and at least one category to see your allocation.
        </div>
      )}

      {hover && (
        <div
          className="allocation-bar__tooltip"
          style={{ left: hover.left, top: hover.top }}
        >
          <strong>{formatCurrency(hover.amount)}</strong>
          <span>
            {hover.label} · {hover.percent.toFixed(1)}%
          </span>
        </div>
      )}

      {segments.length > 0 && (
        <ul className="allocation-bar__legend">
          {segments.map((segment) => (
            <li key={segment.key}>
              <span
                className="allocation-bar__swatch"
                style={{ backgroundColor: segment.colorVar }}
                aria-hidden="true"
              />
              <span className="allocation-bar__legend-name">
                {segment.label}
              </span>
              <span className="allocation-bar__legend-amount">
                {formatCurrency(segment.amount)}
              </span>
            </li>
          ))}
          {unallocatedPercent > 0 && (
            <li>
              <span
                className="allocation-bar__swatch"
                style={{ backgroundColor: UNALLOCATED_COLOR_VAR }}
                aria-hidden="true"
              />
              <span className="allocation-bar__legend-name">Unallocated</span>
              <span className="allocation-bar__legend-amount">
                {formatCurrency(budget.remaining)}
              </span>
            </li>
          )}
        </ul>
      )}

      <button
        type="button"
        className="allocation-bar__table-toggle"
        onClick={() => setShowTable((v) => !v)}
        aria-expanded={showTable}
      >
        {showTable ? 'Hide table view' : 'Show as table'}
      </button>

      {showTable && (
        <table className="allocation-bar__table">
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Amount</th>
              <th scope="col">% of income</th>
            </tr>
          </thead>
          <tbody>
            {budget.categories.map((category, index) => (
              <tr key={`${category.name}-${index}`}>
                <td>{category.name || 'Untitled'}</td>
                <td className="allocation-bar__table-num">
                  {formatCurrency(category.amount)}
                </td>
                <td className="allocation-bar__table-num">
                  {budget.income > 0
                    ? `${((category.amount / budget.income) * 100).toFixed(1)}%`
                    : '—'}
                </td>
              </tr>
            ))}
            <tr>
              <td>Remaining</td>
              <td className="allocation-bar__table-num">
                {formatCurrency(budget.remaining)}
              </td>
              <td className="allocation-bar__table-num">
                {budget.income > 0
                  ? `${((budget.remaining / budget.income) * 100).toFixed(1)}%`
                  : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  )
}
