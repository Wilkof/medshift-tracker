import { useEffect, useMemo, useState } from 'react'
import type { Shift } from '../lib/database.types'
import { calcHours, calcWage, formatMoney, todayIso, weekdayLongUA } from '../lib/utils'
import { Modal } from './Modal'

interface Props {
  open: boolean
  onClose: () => void
  initial?: Partial<Shift> | null
  defaultRate: number
  currency: string
  onSave: (data: {
    id?: string
    date: string
    start_time: string | null
    end_time: string | null
    rate: number
    notes: string | null
  }) => Promise<{ error: string | null }>
  onDelete?: (id: string) => Promise<{ error: string | null }>
}

export function ShiftForm({ open, onClose, initial, defaultRate, currency, onSave, onDelete }: Props) {
  const [date, setDate] = useState(initial?.date ?? todayIso())
  const [start, setStart] = useState(initial?.start_time ?? '')
  const [end, setEnd] = useState(initial?.end_time ?? '')
  const [rate, setRate] = useState<number>(initial?.rate ?? defaultRate)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDate(initial?.date ?? todayIso())
      setStart(initial?.start_time ?? '')
      setEnd(initial?.end_time ?? '')
      setRate(initial?.rate ?? defaultRate)
      setNotes(initial?.notes ?? '')
      setError(null)
    }
  }, [open, initial, defaultRate])

  const hours = useMemo(() => calcHours(start || null, end || null), [start, end])
  const wage = useMemo(() => calcWage(hours, rate), [hours, rate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date) {
      setError('Оберіть дату')
      return
    }
    setSaving(true)
    const { error } = await onSave({
      id: initial?.id,
      date,
      start_time: start || null,
      end_time: end || null,
      rate,
      notes: notes.trim() || null,
    })
    setSaving(false)
    if (error) setError(error)
    else onClose()
  }

  async function handleDelete() {
    if (!initial?.id || !onDelete) return
    if (!confirm('Видалити цю зміну?')) return
    setSaving(true)
    const { error } = await onDelete(initial.id)
    setSaving(false)
    if (error) setError(error)
    else onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? 'Редагувати зміну' : 'Нова зміна'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Дата
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
            required
          />
          {date && (
            <p className="mt-1 text-xs text-slate-500">{weekdayLongUA(date)}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Початок
            </label>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="input"
              step={60}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Кінець
            </label>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="input"
              step={60}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Погодинна ставка ({currency})
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="input"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Нотатки
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input min-h-[72px]"
            rows={2}
            placeholder="Напр.: нічне чергування, напарник, тощо"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-brand-50 p-4 dark:bg-brand-500/10">
          <div>
            <div className="text-xs uppercase tracking-wide text-brand-700 dark:text-brand-300">
              Години
            </div>
            <div className="text-2xl font-bold text-brand-700 dark:text-brand-200">
              {hours.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-brand-700 dark:text-brand-300">
              Заробіток
            </div>
            <div className="text-2xl font-bold text-brand-700 dark:text-brand-200">
              {formatMoney(wage, currency)}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          {initial?.id && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="btn btn-ghost text-rose-600 dark:text-rose-400"
            >
              Видалити
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={saving}>
              Скасувати
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Збереження…' : 'Зберегти'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
