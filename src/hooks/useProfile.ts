import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/database.types'
import { useAuth } from '../contexts/AuthContext'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (error) setError(error.message)
    setProfile(data as Profile | null)
    setLoading(false)
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const update = useCallback(
    async (patch: Partial<Profile>) => {
      if (!user) return { error: 'not_authenticated' }
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', user.id)
        .select('*')
        .single()
      if (error) return { error: error.message }
      setProfile(data as Profile)
      return { error: null }
    },
    [user],
  )

  return { profile, loading, error, refresh, update }
}
