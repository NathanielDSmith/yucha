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
