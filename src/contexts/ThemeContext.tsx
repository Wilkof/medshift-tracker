import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  mode: ThemeMode
  resolved: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'medshift.theme'

function getSystemPref(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'system' ? getSystemPref() : mode
}

function applyTheme(resolved: 'light' | 'dark') {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0b1220' : '#ffffff')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system'
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    return saved ?? 'system'
  })
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolveMode(mode))

  useEffect(() => {
    const r = resolveMode(mode)
    setResolved(r)
    applyTheme(r)
    localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  useEffect(() => {
    if (mode !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const r: 'light' | 'dark' = mql.matches ? 'dark' : 'light'
      setResolved(r)
      applyTheme(r)
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [mode])

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolved,
      setMode: setModeState,
      toggle: () => setModeState(resolved === 'dark' ? 'light' : 'dark'),
    }),
    [mode, resolved],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
