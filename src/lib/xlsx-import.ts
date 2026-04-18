import { calcHours, calcWage, isoDate, weekdayShortUA } from './utils'

type XlsxModule = typeof import('xlsx')
let xlsxPromise: Promise<XlsxModule> | null = null
function loadXlsx(): Promise<XlsxModule> {
  if (!xlsxPromise) xlsxPromise = import('xlsx')
  return xlsxPromise
}

export interface ParsedShift {
  date: string
  weekday: string
  start_time: string | null
  end_time: string | null
  hours: number
  rate: number
  wage: number
  notes: string | null
}

/** Convert Excel serial date / Date / string to ISO yyyy-mm-dd */
function toIsoDate(v: unknown, xlsx: XlsxModule): string | null {
  if (v == null || v === '') return null
  if (v instanceof Date) return isoDate(v)
  if (typeof v === 'number') {
    const d = xlsx.SSF.parse_date_code(v)
    if (!d) return null
    const y = d.y
    const m = String(d.m).padStart(2, '0')
    const day = String(d.d).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  if (typeof v === 'string') {
    const parsed = new Date(v)
    if (!isNaN(parsed.getTime())) return isoDate(parsed)
  }
  return null
}

/** Convert Excel serial time / Date / string to HH:mm */
function toHHmm(v: unknown): string | null {
  if (v == null || v === '') return null
  if (v instanceof Date) {
    const h = String(v.getHours()).padStart(2, '0')
    const m = String(v.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }
  if (typeof v === 'number') {
    // Excel time is fraction of a day
    const frac = v - Math.floor(v)
    const totalMinutes = Math.round(frac * 24 * 60)
    const h = Math.floor(totalMinutes / 60) % 24
    const m = totalMinutes % 60
    if (h === 0 && m === 0) return null
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  if (typeof v === 'string') {
    const m = v.match(/^(\d{1,2})[:.](\d{2})/)
    if (m) {
      const hh = String(Math.min(23, Number(m[1]))).padStart(2, '0')
      const mm = String(Math.min(59, Number(m[2]))).padStart(2, '0')
      return `${hh}:${mm}`
    }
  }
  return null
}

function toNumber(v: unknown): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.').trim())
    return isNaN(n) ? null : n
  }
  return null
}

/**
 * Parse a workbook in the medicover.xlsx style:
 * Each sheet represents a month. Columns: Date | Day | Start | End | Hours | Rate | Wage | Notes
 */
export async function parseWorkbook(
  file: ArrayBuffer,
  defaultRate: number,
): Promise<{ shifts: ParsedShift[]; errors: string[]; sheetsProcessed: number }> {
  const xlsx = await loadXlsx()
  const wb = xlsx.read(file, { type: 'array', cellDates: true })
  const shifts: ParsedShift[] = []
  const errors: string[] = []
  let sheetsProcessed = 0

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    if (!ws) continue
    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(ws, {
      defval: null,
      raw: true,
    })
    if (rows.length === 0) continue
    sheetsProcessed++

    for (const row of rows) {
      const dateRaw =
        row['Date'] ?? row['date'] ?? row['Дата'] ?? row['Date '] ?? null
      const startRaw =
        row['Start'] ?? row['start'] ?? row['Початок'] ?? row['Start '] ?? null
      const endRaw = row['End'] ?? row['end'] ?? row['Кінець'] ?? row['End '] ?? null
      const rateRaw = row['Rate'] ?? row['rate'] ?? row['Ставка'] ?? row['Rate '] ?? null
      const notesRaw =
        row['Notes'] ?? row['notes'] ?? row['Нотатки'] ?? row['Notes '] ?? null

      const date = toIsoDate(dateRaw, xlsx)
      if (!date) continue

      const start = toHHmm(startRaw)
      const end = toHHmm(endRaw)
      const rate = toNumber(rateRaw) ?? defaultRate
      const hours = calcHours(start, end)
      const wage = calcWage(hours, rate)
      const weekday = weekdayShortUA(date)

      shifts.push({
        date,
        weekday,
        start_time: start,
        end_time: end,
        hours,
        rate,
        wage,
        notes: notesRaw != null ? String(notesRaw).trim() || null : null,
      })
    }
  }

  if (shifts.length === 0 && sheetsProcessed > 0) {
    errors.push(
      'Не знайдено рядків з датами. Переконайтесь, що аркуші містять колонки Date/Start/End/Rate.',
    )
  }

  return { shifts, errors, sheetsProcessed }
}
