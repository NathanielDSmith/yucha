import { db, type SpendingCategory } from './db'
import { getCategoryColor } from './categoryColors'

export async function getOrCreateCategory(name: string, colorId?: string): Promise<SpendingCategory> {
  const trimmedName = name.trim()
  const existing = await db.spendingCategories.where('name').equals(trimmedName).first()
  const finalColorId = colorId || 'yellow'

  if (existing) {
    // Update color if it's different and colorId was explicitly provided
    if (colorId && existing.color !== finalColorId) {
      await db.spendingCategories.update(existing.id, { color: finalColorId })
      return { ...existing, color: finalColorId }
    }
    return existing
  }

  const newCategory: SpendingCategory = {
    id: crypto.randomUUID(),
    name: trimmedName,
    color: finalColorId,
    createdAt: new Date().toISOString(),
  }

  await db.spendingCategories.add(newCategory)
  return newCategory
}

export async function getAllCategories(): Promise<SpendingCategory[]> {
  return db.spendingCategories.toArray()
}

export async function getCategoryByName(name: string): Promise<SpendingCategory | undefined> {
  return db.spendingCategories.where('name').equals(name).first()
}

export async function updateCategoryColor(categoryId: string, colorId: string): Promise<void> {
  await db.spendingCategories.update(categoryId, { color: colorId })
}

export async function getCategoryHexColor(categoryName: string): Promise<string> {
  const category = await getCategoryByName(categoryName)
  return category ? getCategoryColor(category.color) : getCategoryColor('yellow')
}

export async function getCategoryUsageCount(categoryName: string): Promise<number> {
  const count = await db.spendingEntries.where('category').equals(categoryName).count()
  const subCount = await db.subscriptions.where('category').equals(categoryName).count()
  return count + subCount
}

export async function deleteCategory(categoryId: string): Promise<{ success: boolean; usageCount: number }> {
  const category = await db.spendingCategories.get(categoryId)
  if (!category) {
    return { success: false, usageCount: 0 }
  }

  const usageCount = await getCategoryUsageCount(category.name)
  if (usageCount > 0) {
    return { success: false, usageCount }
  }

  await db.spendingCategories.delete(categoryId)
  return { success: true, usageCount: 0 }
}

// Default spending categories to seed if table is empty
const DEFAULT_CATEGORIES = [
  { name: 'Food', color: 'red' },
  { name: 'Transport', color: 'teal' },
  { name: 'Shopping', color: 'purple' },
  { name: 'Entertainment', color: 'pink' },
  { name: 'Utilities', color: 'green' },
  { name: 'Healthcare', color: 'orange' },
] as const

export async function seedDefaultCategories(): Promise<void> {
  // Always ensure default categories exist with correct colors
  for (const cat of DEFAULT_CATEGORIES) {
    await getOrCreateCategory(cat.name, cat.color)
  }
}
