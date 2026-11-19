import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const ready = Boolean(url && key && !url.includes('TU-PROYECTO') && !key.includes('TU_CLAVE'))
export const supabase = ready ? createClient(url, key) : null
