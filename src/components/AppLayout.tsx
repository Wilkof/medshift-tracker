import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface Props {
  children: ReactNode
}

export function AppLayout({ children }: Props) {
  return (
    <div className="relative mx-auto flex min-h-screen max-w-xl flex-col">
      <main className="flex-1 px-4 pb-28 pt-2 safe-top">{children}</main>
      <BottomNav />
    </div>
  )
}
