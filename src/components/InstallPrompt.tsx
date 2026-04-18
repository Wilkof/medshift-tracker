import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'medshift.install_dismissed_at'
const DISMISS_HOURS = 72

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) ?? 0)
      if (Date.now() - dismissedAt < DISMISS_HOURS * 60 * 60 * 1000) return
      setEvent(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler as EventListener)
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener)
  }, [])

  useEffect(() => {
    const handler = () => setVisible(false)
    window.addEventListener('appinstalled', handler)
    return () => window.removeEventListener('appinstalled', handler)
  }, [])

  if (!visible || !event) return null

  async function install() {
    if (!event) return
    await event.prompt()
    await event.userChoice
    setVisible(false)
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setVisible(false)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 mx-auto flex max-w-md px-4 safe-bottom">
      <div className="pointer-events-auto flex w-full animate-fade-up items-center gap-3 rounded-2xl bg-slate-900 p-3 pr-2 text-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] ring-1 ring-white/10 dark:bg-slate-800">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Встановити MedShift</div>
          <div className="truncate text-xs text-slate-300">
            Швидкий доступ з головного екрана
          </div>
        </div>
        <button
          onClick={install}
          className="rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold hover:bg-brand-600"
        >
          Встановити
        </button>
        <button
          onClick={dismiss}
          aria-label="Закрити"
          className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
