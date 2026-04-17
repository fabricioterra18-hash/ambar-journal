// ── Date helpers (LOCAL timezone, never UTC) ──

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const SHORT_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/**
 * Returns today as YYYY-MM-DD in the user's LOCAL timezone.
 * This is the ONLY correct way to get "today" for journals/entries.
 */
export function todayISO(): string {
  return toLocalDateKey(new Date())
}

/**
 * Converts any Date to a YYYY-MM-DD string in LOCAL timezone.
 */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Parses a YYYY-MM-DD key into a Date at noon local time (avoids DST issues).
 */
export function parseLocalDateKey(key: string): Date {
  return new Date(key + 'T12:00:00')
}

/**
 * Returns yesterday as YYYY-MM-DD in local timezone.
 */
export function yesterdayISO(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toLocalDateKey(d)
}

/**
 * Returns a date N days ago as YYYY-MM-DD in local timezone.
 */
export function daysAgoISO(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toLocalDateKey(d)
}

/**
 * Adds/subtracts days from a YYYY-MM-DD key, returns new key.
 */
export function addDays(dateKey: string, days: number): string {
  const d = parseLocalDateKey(dateKey)
  d.setDate(d.getDate() + days)
  return toLocalDateKey(d)
}

/**
 * Checks if two date keys represent the same local day.
 */
export function isSameLocalDay(a: string, b: string): boolean {
  return a === b
}

/**
 * Checks if a date key is today.
 */
export function isToday(dateKey: string): boolean {
  return dateKey === todayISO()
}

/**
 * Checks if a date key is before today.
 */
export function isPast(dateKey: string): boolean {
  return dateKey < todayISO()
}

/**
 * Formats "Segunda, 14 Abril"
 */
export function formatDateBR(dateStr: string): string {
  const d = parseLocalDateKey(dateStr)
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/**
 * Formats "14 abr"
 */
export function formatDateShort(dateStr: string): string {
  const d = parseLocalDateKey(dateStr)
  return `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`
}

/**
 * Greeting based on local hour.
 */
export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}
