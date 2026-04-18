import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AppLayout } from './components/AppLayout'
import { DashboardPage } from './pages/Dashboard'
import { CalendarPage } from './pages/Calendar'
import { ShiftsPage } from './pages/Shifts'
import { ProfilePage } from './pages/Profile'
import { LoginPage } from './pages/Login'

const AnalyticsPage = lazy(() =>
  import('./pages/Analytics').then((m) => ({ default: m.AnalyticsPage })),
)

function Spinner() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-slate-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
    </div>
  )
}

function ProtectedShell() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/shifts" element={<ShiftsPage />} />
        <Route
          path="/analytics"
          element={
            <Suspense fallback={<Spinner />}>
              <AnalyticsPage />
            </Suspense>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedShell />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}
