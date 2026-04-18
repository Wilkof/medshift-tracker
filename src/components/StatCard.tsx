import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
  tone?: 'brand' | 'emerald' | 'violet' | 'amber'
}

const tones = {
  brand: {
    ring: 'ring-brand-500/20',
    iconBg: 'bg-brand-500/10 text-brand-600 dark:bg-brand-400/15 dark:text-brand-300',
  },
  emerald: {
    ring: 'ring-emerald-500/20',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300',
  },
  violet: {
    ring: 'ring-violet-500/20',
    iconBg: 'bg-violet-500/10 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300',
  },
  amber: {
    ring: 'ring-amber-500/20',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300',
  },
} as const

export function StatCard({ icon: Icon, label, value, hint, tone = 'brand' }: Props) {
  const t = tones[tone]
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${t.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold leading-tight tracking-tight">{value}</div>
        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</div>
        {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
      </div>
    </div>
  )
}
