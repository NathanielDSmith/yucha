import { useEffect, useState, type FormEvent } from 'react'
import type { SpendingEntry } from '../lib/spending'
import type { SpendingCategory } from '../lib/db'
import { formatCurrency } from '../lib/currency'
import { BUDGET_CONFIG_ID, db } from '../lib/db'
import { useToast } from '../lib/toastStore'
import { today } from '../lib/dates'
import { getAllCategories, getCategoryHexColor, getOrCreateCategory, seedDefaultCategories, deleteCategory } from '../lib/categoryManager'
import { CATEGORY_COLORS } from '../lib/categoryColors'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'
import { EmptyState } from './EmptyState'
import './SpendingLog.css'

export function SpendingLog() {
  const { show: showToast } = useToast()
  const [entries, setEntries] = useState<SpendingEntry[]>([])
  const [categories, setCategories] = useState<SpendingCategory[]>([])
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editValidationError, setEditValidationError] = useState<string | null>(null)
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('yellow')
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false)
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({})

  async function refresh() {
    try {
      const all = await db.spendingEntries.toArray()
      all.sort((a, b) => b.date.localeCompare(a.date))
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
        // Deduplicate by name
        const unique = Array.from(new Map(cats.map((c) => [c.name, c])).values())
        setCategories(unique)
        // Build color map
        const colorMap: Record<string, string> = {}
        for (const cat of unique) {
          colorMap[cat.name] = await getCategoryHexColor(cat.name)
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
      setCategory(value)
    }
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) {
      return
    }
    try {
      await getOrCreateCategory(newCategoryName.trim(), newCategoryColor)
      const cats = await getAllCategories()
      const unique = Array.from(new Map(cats.map((c) => [c.name, c])).values())
      setCategories(unique)
      // Rebuild color map
      const colorMap: Record<string, string> = {}
      for (const cat of unique) {
        colorMap[cat.name] = await getCategoryHexColor(cat.name)
      }
      setCategoryColors(colorMap)
      setCategory(newCategoryName.trim())
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
    if (!category.trim()) {
      setValidationError('Category is required')
      return
    }

    try {
      setSubmitting(true)
      const trimmedCategory = category.trim()
      // Auto-create category if it doesn't exist
      await getOrCreateCategory(trimmedCategory)
      const entry: SpendingEntry = {
        id: crypto.randomUUID(),
        amount: parsedAmount,
        date,
        category: trimmedCategory,
        note: note.trim() || undefined,
      }
      await db.spendingEntries.add(entry)
      setAmount('')
      setCategory('')
      setNote('')
      setValidationError(null)
      showToast('Spending logged successfully', 'success')
      await refresh()
      // Refresh categories in case a new one was created
      const cats = await getAllCategories()
      setCategories(cats)
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
    setEditCategory(entry.category)
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
    if (!editCategory.trim()) {
      setEditValidationError('Category is required')
      return
    }

    try {
      setSubmitting(true)
      await db.spendingEntries.update(editingId!, {
        amount: parsedAmount,
        category: editCategory.trim(),
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
          autoFocus
          disabled={submitting}
          aria-label="Spending amount"
          aria-describedby={validationError ? 'validation-error' : undefined}
        />
        <div className="spending-log__category-input">
          <select
            value={category}
            onChange={handleCategoryChange}
            disabled={submitting}
            aria-label="Spending category"
            aria-describedby={validationError ? 'validation-error' : undefined}
          >
            <option value="">Select category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name} style={{ color: categoryColors[cat.name] || 'inherit' }}>
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

      {entries.length === 0 ? (
        <EmptyState message="No spending logged yet. Add your first entry above." />
      ) : (
        <ul className="spending-log__list">
          {entries.map((entry) => (
            <li key={entry.id}>
              <span className="spending-log__date">{entry.date}</span>
              <span
                className="spending-log__category"
                style={{
                  borderColor: categoryColors[entry.category] || 'var(--color-primary)',
                  backgroundColor: categoryColors[entry.category] ? `${categoryColors[entry.category]}20` : 'var(--color-primary-wash)',
                }}
              >
                {entry.category}
              </span>
              {entry.note && <span className="spending-log__note">{entry.note}</span>}
              <span className="spending-log__amount">{formatCurrency(entry.amount)}</span>
              <button
                type="button"
                className="spending-log__edit-btn"
                aria-label={`Edit ${entry.category} entry`}
                onClick={() => handleEdit(entry)}
              >
                ✎
              </button>
              <button
                type="button"
                aria-label={`Delete ${entry.category} entry`}
                onClick={() => handleDelete(entry.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
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
                <input
                  type="text"
                  placeholder="Category"
                  list="spending-category-options"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  disabled={submitting}
                  aria-describedby={editValidationError ? 'edit-validation-error' : undefined}
                />
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
                    style={{ backgroundColor: categoryColors[cat.name] || 'var(--color-primary)' }}
                  />
                  <span className="spending-log__category-name">{cat.name}</span>
                  <button
                    type="button"
                    className="spending-log__category-delete"
                    onClick={async () => {
                      if (window.confirm(`Delete category "${cat.name}"?`)) {
                        try {
                          await deleteCategory(cat.id)
                          const cats = await getAllCategories()
                          const unique = Array.from(new Map(cats.map((c) => [c.name, c])).values())
                          setCategories(unique)
                          const colorMap: Record<string, string> = {}
                          for (const c of unique) {
                            colorMap[c.name] = await getCategoryHexColor(c.name)
                          }
                          setCategoryColors(colorMap)
                          if (category === cat.name) {
                            setCategory('')
                          }
                          showToast('Category deleted', 'success')
                        } catch (err) {
                          showToast('Failed to delete category', 'error')
                        }
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
    </div>
  )
}
