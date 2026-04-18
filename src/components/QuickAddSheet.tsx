import { useState } from 'react'
import { Clock, Moon, Plus, Sunrise } from 'lucide-react'
import { Modal } from './Modal'
import { calcHours, calcWage, isoDate, weekdayShortUA } from '../lib/utils'

interface Template {
  id: string
  label: string
  start: string
  end: string
  icon: typeof Sunrise
  tone: string
}

const TEMPLATES: Template[] = [
  {
    id: 'day',
    label: 'Денна 6:00–19:00',
    start: '06:00',
    end: '19:00',
    icon: Sunrise,
    tone: 'from-amber-400 to-orange-500',
  },
  {
    id: 'day-half',
    label: 'Половина дня 6:00–13:00',
    start: '06:00',
    end: '13:00',
    icon: Clock,
    tone: 'from-sky-400 to-blue-500',
  },
  {
    id: 'night',
    label: 'Нічна 19:00–7:00',
    start: '19:00',
    end: '07:00',
    icon: Moon,
    tone: 'from-indigo-500 to-violet-600',
  },
]

interface Props {
  open: boolean
  onClose: () => void
  defaultRate: number
  onAdd: (data: {
    date: string
    start_time: string | null
    end_time: string | null
    rate: number
    notes: string | null
  }) => Promise<{ error: string | null }>
  onOpenCustom: () => void
}

export function QuickAddSheet({ open, onClose, defaultRate, onAdd, onOpenCustom }: Props) {
  const [date, setDate] = useState(isoDate(new Date()))
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function pick(t: Template) {
    setBusy(t.id)
    setError(null)
    const { error } = await onAdd({
      date,
      start_time: t.start,
      end_time: t.end,
      rate: defaultRate,
      notes: null,
    })
    setBusy(null)
    if (error) setError(error)
    else onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Швидке додавання">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Дата
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
          <p className="mt-1 text-xs text-slate-400">{weekdayShortUA(date)} · Ставка {defaultRate}/год</p>
        </div>

        <div className="space-y-2">
          {TEMPLATES.map((t) => {
            const hours = calcHours(t.start, t.end)
            const wage = calcWage(hours, defaultRate)
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => pick(t)}
                disabled={busy !== null}
                className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-brand-400 hover:shadow-[var(--shadow-soft)] active:scale-[0.98] disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-brand-400"
              >
                <div
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${t.tone} text-white shadow-[var(--shadow-soft)]`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{t.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {hours.toFixed(1)} год · ~{wage.toFixed(0)}
                  </div>
                </div>
                {busy === t.id && (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                )}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => {
            onClose()
            onOpenCustom()
          }}
          className="btn btn-secondary w-full"
        >
          <Plus className="h-4 w-4" /> Власний час…
        </button>

        {error && (
          <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}
      </div>
    </Modal>
  )
}
