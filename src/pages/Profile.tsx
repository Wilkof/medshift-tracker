import { useEffect, useState } from 'react'
import { Download, LogOut, Moon, Palette, Save, Sun, User as UserIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useShifts } from '../hooks/useShifts'
import { useTheme, type ThemeMode } from '../contexts/ThemeContext'
import { downloadCsv, shiftsToCsv } from '../lib/utils'

export function ProfilePage() {
  const { user, signOut } = useAuth()
  const { profile, update } = useProfile()
  const { shifts } = useShifts({})
  const { mode, setMode } = useTheme()

  const [fullName, setFullName] = useState('')
  const [rate, setRate] = useState<number>(33)
  const [currency, setCurrency] = useState('PLN')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setRate(Number(profile.default_rate))
      setCurrency(profile.currency ?? 'PLN')
    }
  }, [profile])

  async function save() {
    setSaving(true)
    await update({ full_name: fullName || null, default_rate: rate, currency })
    setSaving(false)
    setSavedAt(Date.now())
  }

  function exportCsv() {
    const csv = shiftsToCsv(shifts)
    const filename = `medshift-${new Date().toISOString().slice(0, 10)}.csv`
    downloadCsv(csv, filename)
  }

  return (
    <div className="animate-fade-up space-y-4 pt-2">
      <header className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[var(--shadow-soft)]">
          <UserIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {fullName || user?.email?.split('@')[0] || 'Профіль'}
          </h1>
          <div className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</div>
        </div>
      </header>

      <section className="card space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Налаштування
        </h2>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Ім'я</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Ставка за годину</label>
            <input
              type="number"
              step="0.01"
              min={0}
              className="input"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Валюта</label>
            <select
              className="input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="PLN">PLN — Польський злотий</option>
              <option value="UAH">UAH — Гривня</option>
              <option value="EUR">EUR — Євро</option>
              <option value="USD">USD — Долар</option>
              <option value="GBP">GBP — Фунт</option>
            </select>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn btn-primary w-full">
          <Save className="h-4 w-4" />
          {saving ? 'Збереження…' : 'Зберегти'}
        </button>
        {savedAt && (
          <div className="text-center text-xs text-emerald-600 dark:text-emerald-400">
            Налаштування збережено
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Palette className="h-4 w-4" /> Оформлення
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <ThemeButton mode="light" active={mode === 'light'} onClick={() => setMode('light')}>
            <Sun className="h-4 w-4" /> Світла
          </ThemeButton>
          <ThemeButton mode="dark" active={mode === 'dark'} onClick={() => setMode('dark')}>
            <Moon className="h-4 w-4" /> Темна
          </ThemeButton>
          <ThemeButton mode="system" active={mode === 'system'} onClick={() => setMode('system')}>
            Авто
          </ThemeButton>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Дані
        </h2>
        <button onClick={exportCsv} className="btn btn-secondary w-full">
          <Download className="h-4 w-4" />
          Експортувати CSV ({shifts.length} записів)
        </button>
      </section>

      <section className="card">
        <button
          onClick={() => {
            if (confirm('Вийти з акаунту?')) void signOut()
          }}
          className="btn btn-ghost w-full text-rose-600 dark:text-rose-400"
        >
          <LogOut className="h-4 w-4" /> Вийти
        </button>
      </section>

      <p className="pt-2 text-center text-xs text-slate-400">
        MedShift · Створено з ❤️ для медичних працівників
      </p>
    </div>
  )
}

function ThemeButton({
  children,
  active,
  onClick,
}: {
  mode: ThemeMode
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
        active
          ? 'bg-brand-500 text-white shadow-[var(--shadow-soft)]'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}
