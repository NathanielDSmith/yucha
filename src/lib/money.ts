// Number.EPSILON compensates for binary floating-point representation
// error (e.g. 10.005 * 100 === 1000.4999999999999 without it).
export function roundCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
