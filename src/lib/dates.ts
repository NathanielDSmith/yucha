// A plain yyyy-mm-dd string parsed via `new Date(str)` is UTC midnight;
// reading its local getFullYear()/getMonth()/getDate() (or comparing it
// against a locally-constructed Date) is then off by the local UTC offset
// for anyone west of UTC. Parsing the parts directly keeps a stored date
// string and any "now" comparison in the same timezone.
export function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}
