// Supabase client and shared utilities
// All API logic has been moved to TanStack Query hooks

import { createClient } from '@supabase/supabase-js'

// Supabase client configuration
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key'

export const supabase = createClient(supabaseUrl, supabaseKey)
