// Category color palette — 8 vibrant, accessible colors
export const CATEGORY_COLORS = [
  { id: 'yellow', name: 'Yellow', hex: '#F4D03F' },
  { id: 'green', name: 'Green', hex: '#1E8E4E' },
  { id: 'red', name: 'Red', hex: '#E4483C' },
  { id: 'dark', name: 'Dark', hex: '#1F1F1F' },
  { id: 'teal', name: 'Teal', hex: '#16A085' },
  { id: 'purple', name: 'Purple', hex: '#8E44AD' },
  { id: 'pink', name: 'Pink', hex: '#E91E63' },
  { id: 'orange', name: 'Orange', hex: '#F39C12' },
] as const

export type CategoryColorId = (typeof CATEGORY_COLORS)[number]['id']

export function getCategoryColor(colorId: string): string {
  const color = CATEGORY_COLORS.find((c) => c.id === colorId)
  return color?.hex || CATEGORY_COLORS[0].hex
}

export function getCategoryColorName(colorId: string): string {
  const color = CATEGORY_COLORS.find((c) => c.id === colorId)
  return color?.name || 'Yellow'
}
