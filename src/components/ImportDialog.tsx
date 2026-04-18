import { useRef, useState } from 'react'
import { FileSpreadsheet, Upload, Check, AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { parseWorkbook, type ParsedShift } from '../lib/xlsx-import'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  open: boolean
  onClose: () => void
  defaultRate: number
  onImported?: () => void
}

type State =
  | { kind: 'idle' }
  | { kind: 'parsed'; shifts: ParsedShift[]; sheets: number; errors: string[] }
  | { kind: 'uploading'; progress: number }
  | { kind: 'done'; inserted: number; updated: number }
  | { kind: 'error'; message: string }

export function ImportDialog({ open, onClose, defaultRate, onImported }: Props) {
  const { user } = useAuth()
  const [state, setState] = useState<State>({ kind: 'idle' })
  const fileInput = useRef<HTMLInputElement>(null)

  function reset() {
    setState({ kind: 'idle' })
    if (fileInput.current) fileInput.current.value = ''
  }

  async function handleFile(file: File) {
    try {
      const buffer = await file.arrayBuffer()
      const { shifts, errors, sheetsProcessed } = await parseWorkbook(buffer, defaultRate)
      if (errors.length && shifts.length === 0) {
        setState({ kind: 'error', message: errors.join(' ') })
        return
      }
      setState({ kind: 'parsed', shifts, sheets: sheetsProcessed, errors })
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof Error ? e.message : 'Не вдалося прочитати файл',
      })
    }
  }

  async function confirmImport() {
    if (state.kind !== 'parsed' || !user) return
    setState({ kind: 'uploading', progress: 0 })
    const rows = state.shifts.map((s) => ({ ...s, user_id: user.id }))
    const chunkSize = 100
    let inserted = 0
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize)
      const { error } = await supabase
        .from('shifts')
        .upsert(chunk, { onConflict: 'user_id,date' })
      if (error) {
        setState({ kind: 'error', message: error.message })
        return
      }
      inserted += chunk.length
      setState({ kind: 'uploading', progress: Math.round((inserted / rows.length) * 100) })
    }
    setState({ kind: 'done', inserted, updated: 0 })
    onImported?.()
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Імпорт з Excel"
    >
      {state.kind === 'idle' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Завантажте <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-white/5">.xlsx</code> файл
            з колонками: <b>Date</b>, <b>Day</b>, <b>Start</b>, <b>End</b>, <b>Hours</b>,{' '}
            <b>Rate</b>, <b>Wage</b>, <b>Notes</b>. Кожен аркуш — окремий місяць. Існуючі
            записи з тією самою датою будуть оновлені.
          </p>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center transition hover:border-brand-400 hover:bg-brand-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-brand-400 dark:hover:bg-brand-500/10">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <div className="font-semibold">Натисніть, щоб обрати файл</div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                .xlsx · до 5 МБ
              </div>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleFile(f)
              }}
            />
          </label>

          <p className="text-xs text-slate-400">
            💡 Підтримує формат файлу <code>medicover.xlsx</code>.
          </p>
        </div>
      )}

      {state.kind === 'parsed' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
            <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="text-sm text-emerald-900 dark:text-emerald-100">
              Файл оброблено: знайдено <b>{state.shifts.length}</b> змін
              {state.sheets > 1 ? ` з ${state.sheets} аркушів` : ''}.
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/5">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 text-left dark:bg-slate-800">
                <tr>
                  <th className="px-3 py-2 font-semibold">Дата</th>
                  <th className="px-3 py-2 font-semibold">День</th>
                  <th className="px-3 py-2 font-semibold">Години</th>
                  <th className="px-3 py-2 font-semibold">Ставка</th>
                  <th className="px-3 py-2 font-semibold">Заробіток</th>
                </tr>
              </thead>
              <tbody>
                {state.shifts.slice(0, 30).map((s, i) => (
                  <tr
                    key={i}
                    className="border-t border-slate-100 dark:border-white/5"
                  >
                    <td className="px-3 py-1.5">{s.date}</td>
                    <td className="px-3 py-1.5">{s.weekday}</td>
                    <td className="px-3 py-1.5 font-medium">{s.hours.toFixed(2)}</td>
                    <td className="px-3 py-1.5">{s.rate}</td>
                    <td className="px-3 py-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      {s.wage.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {state.shifts.length > 30 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-2 text-center text-slate-400"
                    >
                      … та ще {state.shifts.length - 30} рядків
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button onClick={reset} className="btn btn-secondary flex-1">
              Інший файл
            </button>
            <button onClick={confirmImport} className="btn btn-primary flex-1">
              Імпортувати {state.shifts.length}
            </button>
          </div>
        </div>
      )}

      {state.kind === 'uploading' && (
        <div className="space-y-4 py-6 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Завантаження… {state.progress}%
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className="h-full bg-brand-500 transition-all"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {state.kind === 'done' && (
        <div className="space-y-4 py-4 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white">
            <Check className="h-7 w-7" />
          </div>
          <div>
            <div className="text-lg font-semibold">Готово!</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Імпортовано {state.inserted} записів.
            </div>
          </div>
          <button
            onClick={() => {
              reset()
              onClose()
            }}
            className="btn btn-primary w-full"
          >
            Закрити
          </button>
        </div>
      )}

      {state.kind === 'error' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4 dark:bg-rose-500/10">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <div className="text-sm text-rose-900 dark:text-rose-100">
              {state.message}
            </div>
          </div>
          <button onClick={reset} className="btn btn-secondary w-full">
            Спробувати ще раз
          </button>
        </div>
      )}
    </Modal>
  )
}
