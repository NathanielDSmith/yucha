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

// Diverse color palette for pie charts - ensures visual distinction
export const CATEGORY_COLORS = [
  '#F4D03F', // Yellow (primary)
  '#1E8E4E', // Green
  '#E4483C', // Red
  '#2a78d6', // Blue
  '#eb6834', // Orange
  '#9d7fe8', // Purple
  '#ff89b4', // Pink
  '#1a9b8e', // Teal
  '#d4a574', // Brown
  '#e85d75', // Rose
  '#f8b195', // Peach
  '#ff6b9d', // Hot Pink
  '#c44569', // Dark Red
  '#12c2e9', // Cyan
  '#f78e69', // Coral
]

// Get hex color from color name (for existing category color strings)
export function getCategoryColor(colorName: string): string {
  return COLOR_NAME_MAP[colorName.toLowerCase()] || COLOR_NAME_MAP.gray
}

// Get hex color for pie chart by index and categoryId
export function getPieChartColor(categoryIndex: number, categoryId: string): string {
  const hash = categoryId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colorIndex = (categoryIndex + hash) % CATEGORY_COLORS.length
  return CATEGORY_COLORS[colorIndex]
}
