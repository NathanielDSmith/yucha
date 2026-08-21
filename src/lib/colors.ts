// The reference categorical palette validates 8 hues on the adjacent-pair
// gate (stacked bars, in order). Never cycle back to slot 1 for a 9th
// category — a repeated hue is indistinguishable from the real one under
// CVD. Categories past this cap fold into a single "Other" segment instead.
export const CATEGORY_COLOR_SLOTS = 8

export function categorySlotVar(slotIndex: number): string {
  return `var(--series-${slotIndex + 1})`
}

export const OTHER_COLOR_VAR = 'var(--series-other)'
export const UNALLOCATED_COLOR_VAR = 'var(--series-unallocated)'

// Color palette mapping for category names
const COLOR_NAME_MAP: Record<string, string> = {
  red: '#E4483C',
  green: '#1E8E4E',
  blue: '#2a78d6',
  yellow: '#F4D03F',
  orange: '#eb6834',
  purple: '#9d7fe8',
  pink: '#ff89b4',
  teal: '#1a9b8e',
  brown: '#d4a574',
  gray: '#999999',
}

// Diverse color palette for pie charts - everyday colors with high distinctiveness
// Inspired by automotive industry (proven visually distinct palette)
export const CATEGORY_COLORS = [
  { id: 'red', hex: '#e34948', name: 'Red' },
  { id: 'gold', hex: '#eda100', name: 'Gold' },
  { id: 'pink', hex: '#e87ba4', name: 'Pink' },
  { id: 'green', hex: '#008300', name: 'Green' },
  { id: 'purple', hex: '#4a3aa7', name: 'Purple' },
  { id: 'orange', hex: '#eb6834', name: 'Orange' },
  { id: 'blue', hex: '#2a78d6', name: 'Blue' },
  { id: 'teal', hex: '#1baf7a', name: 'Teal' },
  { id: 'brown', hex: '#8b4513', name: 'Brown' },
  { id: 'silver', hex: '#c0c0c0', name: 'Silver' },
  { id: 'gold-bright', hex: '#ffd700', name: 'Bright Gold' },
  { id: 'hotpink', hex: '#ff69b4', name: 'Hot Pink' },
  { id: 'turquoise', hex: '#00ced1', name: 'Turquoise' },
  { id: 'orchid', hex: '#9932cc', name: 'Dark Orchid' },
  { id: 'darkorange', hex: '#ff8c00', name: 'Dark Orange' },
  { id: 'crimson', hex: '#dc143c', name: 'Crimson' },
]

// Get hex color from color name (for existing category color strings)
export function getCategoryColor(colorName: string): string {
  return COLOR_NAME_MAP[colorName.toLowerCase()] || COLOR_NAME_MAP.gray
}

// Get hex color for pie chart by index and categoryId
export function getPieChartColor(categoryIndex: number, categoryId: string): string {
  const hash = categoryId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colorIndex = (categoryIndex + hash) % CATEGORY_COLORS.length
  return CATEGORY_COLORS[colorIndex].hex
}
