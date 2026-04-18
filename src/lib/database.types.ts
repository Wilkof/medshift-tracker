export type Json = string | number | boolean | null | { [k: string]: Json | undefined } | Json[]

export interface ShiftRow {
  id: string
  user_id: string
  date: string
  weekday: string
  start_time: string | null
  end_time: string | null
  hours: number
  rate: number
  wage: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ShiftInsertRow {
  id?: string
  user_id: string
  date: string
  weekday: string
  start_time?: string | null
  end_time?: string | null
  hours?: number
  rate?: number
  wage?: number
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface ShiftUpdateRow {
  id?: string
  user_id?: string
  date?: string
  weekday?: string
  start_time?: string | null
  end_time?: string | null
  hours?: number
  rate?: number
  wage?: number
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface ProfileRow {
  id: string
  full_name: string | null
  default_rate: number
  currency: string
  theme: string
  created_at: string
  updated_at: string
}

export interface ProfileInsertRow {
  id: string
  full_name?: string | null
  default_rate?: number
  currency?: string
  theme?: string
  created_at?: string
  updated_at?: string
}

export interface ProfileUpdateRow {
  id?: string
  full_name?: string | null
  default_rate?: number
  currency?: string
  theme?: string
  created_at?: string
  updated_at?: string
}

export interface Database {
  public: {
    Tables: {
      shifts: {
        Row: ShiftRow
        Insert: ShiftInsertRow
        Update: ShiftUpdateRow
        Relationships: []
      }
      profiles: {
        Row: ProfileRow
        Insert: ProfileInsertRow
        Update: ProfileUpdateRow
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Shift = ShiftRow
export type ShiftInsert = ShiftInsertRow
export type ShiftUpdate = ShiftUpdateRow
export type Profile = ProfileRow
