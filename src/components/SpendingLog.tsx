import { useEffect, useState, type FormEvent } from 'react'
import type { SpendingEntry } from '../lib/spending'
import type { SpendingCategory } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { db } from '../lib/db'
import { useToast } from '../lib/toastStore'
import { today } from '../lib/dates'
import { getAllCategories, getCategoryHexColor, getOrCreateCategory, seedDefaultCategories, deleteCategory, getCategoryUsageCount } from '../lib/categoryManager'
import { CATEGORY_COLORS } from '../lib/colors'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { EmptyState } from './EmptyState'
import { OpportunityCostModal } from './OpportunityCostModal'
import './SpendingLog.css'

export function SpendingLog() {
  const { show: showToast } = useToast()
  const [entries, setEntries] = useState<SpendingEntry[]>([])
  const [categories, setCategories] = useState<SpendingCategory[]>([])
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editValidationError, setEditValidationError] = useState<string | null>(null)
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('yellow')
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false)
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({})
  const [opportunityCostEntry, setOpportunityCostEntry] = useState<SpendingEntry | null>(null)

  // Date range filtering
  const now = new Date()
  const [startDate, setStartDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(today())
  const [currentPage, setCurrentPage] = useState(1)
  const ENTRIES_PER_PAGE = 25

  function getFilteredEntries() {
    const filtered = entries.filter((entry) => {
      return entry.date >= startDate && entry.date <= endDate
    })
    return filtered
  }

  function getPaginatedEntries() {
    const filtered = getFilteredEntries()
    const start = (currentPage - 1) * ENTRIES_PER_PAGE
    const end = start + ENTRIES_PER_PAGE
    return filtered.slice(start, end)
  }

  function getTotalPages() {
    return Math.ceil(getFilteredEntries().length / ENTRIES_PER_PAGE)
  }

  function handlePreset(days: number | null) {
    const end = today()
    let start: string
    if (days === null) {
      // This month
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    } else {
      const d = new Date()
      d.setDate(d.getDate() - days)
      start = d.toISOString().split('T')[0]
    }
    setStartDate(start)
    setEndDate(end)
    setCurrentPage(1)
  }

  function formatDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-')
    return `${month}/${day}/${year.slice(2)}`
  }

  function getDateRangeLabel() {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const today_str = today()

    if (startDate === new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0] && endDate === today_str) {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      return `${months[now.getMonth()]} ${now.getFullYear()}`
    }

    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  async function refresh() {
    try {
      const all = await db.spendingEntries.toArray()
      all.sort((a, b) => {
        const dateA = String(a.date)
        const dateB = String(b.date)
        return dateB.localeCompare(dateA)
      })
      setEntries(all)
      setError(null)
    } catch (err) {
      setError('Failed to load spending entries. Please try again.')
      console.error('Failed to load spending entries:', err)
    }
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        await seedDefaultCategories()
        await refresh()
        const cats = await getAllCategories()
        setCategories(cats)
        // Build color map by ID
        const colorMap: Record<string, string> = {}
        for (const cat of cats) {
          colorMap[cat.id] = await getCategoryHexColor(cat.id)
        }
        setCategoryColors(colorMap)
      } catch (err) {
        setError('Failed to load data. Please try again.')
        console.error('Failed to load spending data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    if (value === '_new_category') {
      // "+ Add new category" was selected
      setShowNewCategoryModal(true)
      e.target.value = '' // Reset dropdown
    } else if (value !== '') {
      setCategoryId(value)
    }
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) {
      return
    }
    try {
      const newCat = await getOrCreateCategory(newCategoryName.trim(), newCategoryColor)
      const cats = await getAllCategories()
      setCategories(cats)
      // Rebuild color map
      const colorMap: Record<string, string> = {}
      for (const cat of cats) {
        colorMap[cat.id] = await getCategoryHexColor(cat.id)
      }
      setCategoryColors(colorMap)
      setCategoryId(newCat.id)
      setShowNewCategoryModal(false)
      setNewCategoryName('')
      setNewCategoryColor('yellow')
    } catch (err) {
      console.error('Failed to create category:', err)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setValidationError(null)
    const parsedAmount = Number(amount)

    if (!amount || !parsedAmount || parsedAmount <= 0) {
      setValidationError('Amount must be greater than 0')
      return
    }
    if (!categoryId) {
      setValidationError('Category is required')
      return
    }

    try {
      setSubmitting(true)
      const entry: SpendingEntry = {
        id: crypto.randomUUID(),
        amount: parsedAmount,
        date,
        categoryId,
        note: note.trim() || undefined,
      }
      await db.spendingEntries.add(entry)
      setAmount('')
      setCategoryId('')
      setNote('')
      setValidationError(null)
      showToast('Spending logged successfully', 'success')
      await refresh()
    } catch (err) {
      showToast('Failed to log spending. Please try again.', 'error')
      console.error('Failed to add spending entry:', err)
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(entry: SpendingEntry) {
    setEditingId(entry.id)
    setEditAmount(String(entry.amount))
    setEditCategoryId(entry.categoryId)
    setEditDate(entry.date)
    setEditNote(entry.note || '')
    setEditValidationError(null)
  }

  async function handleUpdateSubmit(e: FormEvent) {
    e.preventDefault()
    setEditValidationError(null)
    const parsedAmount = Number(editAmount)

    if (!editAmount || !parsedAmount || parsedAmount <= 0) {
      setEditValidationError('Amount must be greater than 0')
      return
    }
    if (!editCategoryId) {
      setEditValidationError('Category is required')
      return
    }

    try {
      setSubmitting(true)
      await db.spendingEntries.update(editingId!, {
        amount: parsedAmount,
        categoryId: editCategoryId,
        date: editDate,
        note: editNote.trim() || undefined,
      })
      showToast('Entry updated successfully', 'success')
      setEditingId(null)
      await refresh()
    } catch (err) {
      showToast('Failed to update entry. Please try again.', 'error')
      console.error('Failed to update spending entry:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await db.spendingEntries.delete(id)
      showToast('Entry deleted', 'success')
      await refresh()
    } catch (err) {
      showToast('Failed to delete entry. Please try again.', 'error')
      console.error('Failed to delete spending entry:', err)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading spending log..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refresh} />
  }

  return (
    <div className="spending-log">
      <form className="spending-log__form" onSubmit={handleSubmit} noValidate>
        <input
          type="number"
          inputMode="decimal"
          placeholder="Amount"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={submitting}
          aria-label="Spending amount"
          aria-describedby={validationError ? 'validation-error' : undefined}
        />
        <div className="spending-log__category-input">
          <select
            value={categoryId}
            onChange={handleCategoryChange}
            disabled={submitting}
            aria-label="Spending category"
            aria-describedby={validationError ? 'validation-error' : undefined}
          >
            <option value="">Select category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} style={{ color: categoryColors[cat.id] || 'inherit' }}>
                {cat.name}
              </option>
            ))}
            <option value="_new_category">+ Add new category</option>
          </select>
          <button
            type="button"
            className="spending-log__manage-button"
            onClick={() => setShowManageCategoriesModal(true)}
            disabled={submitting}
            aria-label="Delete categories"
            title="Delete categories"
          >
            ⚙
          </button>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={submitting}
          aria-label="Spending date"
        />
        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={submitting}
          aria-label="Spending note (optional)"
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Log spend'}
        </button>
        {validationError && <ErrorMessage message={validationError} />}
      </form>

      <div className="spending-log__filter-section">
        <div className="spending-log__filter-header">
          <h3 className="spending-log__filter-title">{getDateRangeLabel()}</h3>
        </div>
        <div className="spending-log__filter-controls">
          <button className="spending-log__preset-btn" onClick={() => handlePreset(null)}>This Month</button>
          <button className="spending-log__preset-btn" onClick={() => handlePreset(30)}>Last 30 Days</button>
          <button className="spending-log__preset-btn" onClick={() => handlePreset(90)}>Last 3 Months</button>
          <div className="spending-log__date-range">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="spending-log__date-input"
            />
            <span className="spending-log__date-sep">–</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="spending-log__date-input"
            />
          </div>
        </div>
      </div>

      {getFilteredEntries().length === 0 ? (
        <EmptyState message="No spending logged in this period." />
      ) : (
        <>
          <ul className="spending-log__list">
            {getPaginatedEntries().map((entry) => {
              const category = categories.find((c) => c.id === entry.categoryId)
              return (
                <li key={entry.id}>
                  <span className="spending-log__date">{formatDate(entry.date)}</span>
                  <span
                    className="spending-log__category"
                    style={{
                      borderColor: categoryColors[entry.categoryId] || 'var(--color-primary)',
                      backgroundColor: categoryColors[entry.categoryId] ? `${categoryColors[entry.categoryId]}20` : 'var(--color-primary-wash)',
                    }}
                  >
                    {category?.name || 'Unknown'}
                  </span>
                  {entry.note && <span className="spending-log__note">{entry.note}</span>}
                  <span className="spending-log__amount">{formatCurrency(entry.amount)}</span>
                  <button
                    type="button"
                    className="spending-log__opportunity-btn"
                    aria-label={`View opportunity cost of ${category?.name || 'entry'}`}
                    onClick={() => setOpportunityCostEntry(entry)}
                    title="See how much this could grow if invested"
                  >
                    📈
                  </button>
                  <button
                    type="button"
                    className="spending-log__edit-btn"
                    aria-label={`Edit ${category?.name || 'entry'}`}
                    onClick={() => handleEdit(entry)}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${category?.name || 'entry'}`}
                    onClick={() => handleDelete(entry.id)}
                  >
                    ✕
                  </button>
                </li>
              )
            })}
          </ul>
          {getTotalPages() > 1 && (
            <div className="spending-log__pagination">
              <button
                className="spending-log__pagination-btn"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>
              <span className="spending-log__pagination-info">
                Page {currentPage} of {getTotalPages()}
              </span>
              <button
                className="spending-log__pagination-btn"
                onClick={() => setCurrentPage(Math.min(getTotalPages(), currentPage + 1))}
                disabled={currentPage === getTotalPages()}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {editingId && (
        <div className="spending-log__modal-overlay" onClick={() => setEditingId(null)}>
          <div className="spending-log__modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Spending Entry</h2>
            <form className="spending-log__edit-form" onSubmit={handleUpdateSubmit} noValidate>
              <label>
                <span>Amount</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Amount"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  disabled={submitting}
                  aria-describedby={editValidationError ? 'edit-validation-error' : undefined}
                />
              </label>
              <label>
                <span>Category</span>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  disabled={submitting}
                  aria-describedby={editValidationError ? 'edit-validation-error' : undefined}
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Date</span>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  disabled={submitting}
                />
              </label>
              <label>
                <span>Note</span>
                <input
                  type="text"
                  placeholder="Note (optional)"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  disabled={submitting}
                />
              </label>
              {editValidationError && (
                <ErrorMessage message={editValidationError} />
              )}
              <div className="spending-log__modal-actions">
                <button
                  type="button"
                  className="spending-log__modal-cancel"
                  onClick={() => setEditingId(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showManageCategoriesModal && (
        <div className="spending-log__modal-overlay" onClick={() => setShowManageCategoriesModal(false)}>
          <div className="spending-log__modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Categories</h2>
            <div className="spending-log__categories-list">
              {categories.map((cat) => (
                <div key={cat.id} className="spending-log__category-item">
                  <div
                    className="spending-log__category-swatch"
                    style={{ backgroundColor: categoryColors[cat.id] || 'var(--color-primary)' }}
                  />
                  <span className="spending-log__category-name">{cat.name}</span>
                  <button
                    type="button"
                    className="spending-log__category-delete"
                    onClick={async () => {
                      try {
                        const usageCount = await getCategoryUsageCount(cat.id)
                        if (usageCount > 0) {
                          showToast(`Cannot delete "${cat.name}" — it has ${usageCount} entries. Remove or reassign them first.`, 'error')
                          return
                        }
                        if (window.confirm(`Delete category "${cat.name}"?`)) {
                          const result = await deleteCategory(cat.id)
                          if (result.success) {
                            const cats = await getAllCategories()
                            setCategories(cats)
                            const colorMap: Record<string, string> = {}
                            for (const c of cats) {
                              colorMap[c.id] = await getCategoryHexColor(c.id)
                            }
                            setCategoryColors(colorMap)
                            if (categoryId === cat.id) {
                              setCategoryId('')
                            }
                            showToast('Category deleted', 'success')
                          }
                        }
                      } catch (err) {
                        showToast('Failed to delete category', 'error')
                        console.error('Delete category error:', err)
                      }
                    }}
                    aria-label={`Delete ${cat.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="spending-log__modal-actions">
              <button type="button" onClick={() => setShowManageCategoriesModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewCategoryModal && (
        <div className="spending-log__modal-overlay" onClick={() => setShowNewCategoryModal(false)}>
          <div className="spending-log__modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Category</h2>
            <div className="spending-log__modal-content">
              <input
                type="text"
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                autoFocus
              />
              <div className="spending-log__color-picker">
                <label>Color:</label>
                <div className="spending-log__color-options">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      className={`spending-log__color-swatch ${newCategoryColor === color.id ? 'active' : ''}`}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => setNewCategoryColor(color.id)}
                      title={color.name}
                      aria-label={`Select ${color.name} color`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="spending-log__modal-actions">
              <button
                type="button"
                onClick={() => setShowNewCategoryModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCategory}
              >
                Create Category
              </button>
            </div>
          </div>
        </div>
      )}

      {opportunityCostEntry && (
        <OpportunityCostModal
          amount={opportunityCostEntry.amount}
          category={categories.find((c) => c.id === opportunityCostEntry.categoryId)?.name || 'Unknown'}
          onClose={() => setOpportunityCostEntry(null)}
        />
      )}
    </div>
  )
}
