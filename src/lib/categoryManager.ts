import { db, type SpendingCategory } from './db'
import { getCategoryColor } from './categoryColors'

export async function getOrCreateCategory(name: string, colorId?: string): Promise<SpendingCategory> {
  const existing = await db.spendingCategories.where('name').equals(name).first()
  if (existing) {
    return existing
  }

  const newCategory: SpendingCategory = {
    id: crypto.randomUUID(),
    name: name.trim(),
    color: colorId || 'yellow',
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
