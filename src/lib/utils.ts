import { format } from 'date-fns'
import { uk } from 'date-fns/locale'

export const UA_WEEKDAYS_SHORT = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const
export const UA_WEEKDAYS_LONG = [
  'Неділя',
  'Понеділок',
  'Вівторок',
  'Середа',
  'Четвер',
  "П'ятниця",
  'Субота',
] as const
export const UA_MONTHS = [
  'Січень',
  'Лютий',
  'Березень',
  'Квітень',
  'Травень',
  'Червень',
  'Липень',
  'Серпень',
  'Вересень',
  'Жовтень',
  'Листопад',
  'Грудень',
] as const

/**
 * Parse an ISO date string as a LOCAL date (midnight) rather than UTC.
 * `new Date("2026-04-18")` is interpreted as UTC which shifts the day
 * in negative timezones. We want day-granular values to stay stable.
 */
export function parseLocalDate(date: string | Date): Date {
  if (date instanceof Date) return date
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  }
  return new Date(date)
}

export function weekdayShortUA(date: Date | string): string {
  const d = parseLocalDate(date)
  return UA_WEEKDAYS_SHORT[d.getDay()]
}

export function weekdayLongUA(date: Date | string): string {
  const d = parseLocalDate(date)
  return UA_WEEKDAYS_LONG[d.getDay()]
}

export function monthNameUA(month: number): string {
  return UA_MONTHS[month]
}

/** Parse HH:mm to minutes since midnight */
export function timeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null
  const parts = time.split(':')
  if (parts.length < 2) return null
  const h = Number(parts[0])
  const m = Number(parts[1])
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

/** Calculate hours worked between two HH:mm strings. Supports overnight shifts. */
export function calcHours(start: string | null | undefined, end: string | null | undefined): number {
  const s = timeToMinutes(start)
  const e = timeToMinutes(end)
  if (s == null || e == null) return 0
  let diff = e - s
  if (diff < 0) diff += 24 * 60
  return Math.round((diff / 60) * 100) / 100
}

export function calcWage(hours: number, rate: number): number {
  return Math.round(hours * rate * 100) / 100
}

export function formatMoney(amount: number, currency = 'PLN'): string {
  try {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function formatDateUA(date: string | Date, fmt = 'd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date
  return format(d, fmt, { locale: uk })
}

export function formatDateFull(date: string | Date): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date
  return format(d, 'd MMMM yyyy', { locale: uk })
}

export function todayIso(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function clsx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Convert Ukrainian month name to number (1-based) - helper for filters */
export function monthLabel(year: number, month: number): string {
  return `${monthNameUA(month)} ${year}`
}

/** Export shifts array to CSV string. */
export function shiftsToCsv(
  shifts: Array<{
    date: string
    weekday: string
    start_time: string | null
    end_time: string | null
    hours: number
    rate: number
    wage: number
    notes: string | null
  }>,
): string {
  const header = ['Дата', 'День', 'Початок', 'Кінець', 'Години', 'Ставка', 'Заробіток', 'Нотатки']
  const rows = shifts.map((s) => [
    s.date,
    s.weekday,
    s.start_time ?? '',
    s.end_time ?? '',
    String(s.hours),
    String(s.rate),
    String(s.wage),
    (s.notes ?? '').replace(/"/g, '""'),
  ])
  return [header, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n')
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
