// A plain yyyy-mm-dd string parsed via `new Date(str)` is UTC midnight;
// reading its local getFullYear()/getMonth()/getDate() (or comparing it
// against a locally-constructed Date) is then off by the local UTC offset
// for anyone west of UTC. Parsing the parts directly keeps a stored date
// string and any "now" comparison in the same timezone.
export function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function today(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return n + 'th'
  const lastDigit = n % 10
  if (lastDigit === 1) return n + 'st'
  if (lastDigit === 2) return n + 'nd'
  if (lastDigit === 3) return n + 'rd'
  return n + 'th'
}
