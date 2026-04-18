import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Stethoscope } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { user, loading, signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    )
  }
  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    if (mode === 'reset') {
      const { error } = await resetPassword(email.trim())
      setBusy(false)
      if (error) setError(translateError(error))
      else setInfo('Перевірте email — ми надіслали посилання для скидання паролю.')
      return
    }
    const { error } =
      mode === 'signin'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, fullName.trim() || undefined)
    setBusy(false)
    if (error) {
      setError(translateError(error))
    } else if (mode === 'signup') {
      setInfo('Перевірте електронну пошту, щоб підтвердити реєстрацію.')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white dark:from-brand-950/40 dark:via-slate-950 dark:to-slate-950">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-400/30 blur-3xl dark:bg-brand-500/20" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10 safe-top safe-bottom">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500 text-white shadow-[var(--shadow-lift)]">
            <Stethoscope className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">MedShift</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Облік змін і заробітку для медичних працівників
          </p>
        </div>

        <div className="card animate-fade-up">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                mode === 'signin'
                  ? 'bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500'
              }`}
            >
              Вхід
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500'
              }`}
            >
              Реєстрація
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Ім'я</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input"
                  autoComplete="name"
                  placeholder="Олена"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                autoComplete="email"
                required
                placeholder="name@example.com"
              />
            </div>
            {mode !== 'reset' && (
              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <label className="text-sm font-medium">Пароль</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('reset')
                        setError(null)
                        setInfo(null)
                      }}
                      className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                    >
                      Забули пароль?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  placeholder="Не менше 6 символів"
                />
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </div>
            )}
            {info && (
              <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                {info}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={busy}>
              {busy
                ? 'Зачекайте…'
                : mode === 'signin'
                  ? 'Увійти'
                  : mode === 'signup'
                    ? 'Створити акаунт'
                    : 'Надіслати посилання'}
            </button>
            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setError(null)
                  setInfo(null)
                }}
                className="btn btn-ghost w-full"
              >
                Повернутися до входу
              </button>
            )}
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          Ваші дані під надійним захистом Supabase · RLS
        </p>
      </div>
    </div>
  )
}

function translateError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Невірний email або пароль.'
  if (m.includes('already registered') || m.includes('already exists'))
    return 'Користувач з таким email вже зареєстрований.'
  if (m.includes('password')) return 'Пароль замалий або недійсний.'
  if (m.includes('email')) return 'Недійсний email.'
  return msg
}
