import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Shift, ShiftInsert, ShiftUpdate } from '../lib/database.types'
import { useAuth } from '../contexts/AuthContext'
import { calcHours, calcWage, weekdayShortUA } from '../lib/utils'

export interface ShiftFilters {
  from?: string
  to?: string
  search?: string
}

export function useShifts(filters: ShiftFilters = {}) {
  const { user } = useAuth()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchShifts = useCallback(async () => {
    if (!user) {
      setShifts([])
      setLoading(false)
      return
    }
    setLoading(true)
    let q = supabase
      .from('shifts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (filters.from) q = q.gte('date', filters.from)
    if (filters.to) q = q.lte('date', filters.to)
    const { data, error } = await q
    if (error) {
      setError(error.message)
    } else {
      const rows = (data ?? []) as Shift[]
      const filtered = filters.search
        ? rows.filter((s) => {
            const q = filters.search!.toLowerCase()
            return (
              s.date.includes(q) ||
              (s.weekday ?? '').toLowerCase().includes(q) ||
              (s.notes ?? '').toLowerCase().includes(q)
            )
          })
        : rows
      setShifts(filtered)
    }
    setLoading(false)
  }, [user, filters.from, filters.to, filters.search])

  useEffect(() => {
    void fetchShifts()
  }, [fetchShifts])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('shifts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shifts', filter: `user_id=eq.${user.id}` },
        () => {
          void fetchShifts()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, fetchShifts])

  const upsert = useCallback(
    async (input: {
      id?: string
      date: string
      start_time: string | null
      end_time: string | null
      rate: number
      notes?: string | null
    }) => {
      if (!user) return { error: 'not_authenticated' as const }
      const hours = calcHours(input.start_time, input.end_time)
      const wage = calcWage(hours, input.rate)
      const weekday = weekdayShortUA(input.date)

      if (input.id) {
        const patch: ShiftUpdate = {
          date: input.date,
          weekday,
          start_time: input.start_time,
          end_time: input.end_time,
          hours,
          rate: input.rate,
          wage,
          notes: input.notes ?? null,
        }
        const { error } = await supabase.from('shifts').update(patch).eq('id', input.id)
        if (error) return { error: error.message }
      } else {
        const insert: ShiftInsert = {
          user_id: user.id,
          date: input.date,
          weekday,
          start_time: input.start_time,
          end_time: input.end_time,
          hours,
          rate: input.rate,
          wage,
          notes: input.notes ?? null,
        }
        const { error } = await supabase.from('shifts').upsert(insert, { onConflict: 'user_id,date' })
        if (error) return { error: error.message }
      }
      await fetchShifts()
      return { error: null }
    },
    [user, fetchShifts],
  )

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('shifts').delete().eq('id', id)
      if (error) return { error: error.message }
      await fetchShifts()
      return { error: null }
    },
    [fetchShifts],
  )

  return { shifts, loading, error, refresh: fetchShifts, upsert, remove }
}
