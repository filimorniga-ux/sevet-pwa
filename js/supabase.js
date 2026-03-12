/* =========================================
   SEVET – Cliente Supabase
   Ecosistema Pet-Tech 360
   ========================================= */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zyvwcxsqdbegzjlmgtou.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dndjeHNxZGJlZ3pqbG1ndG91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTIzMDAsImV4cCI6MjA4ODkyODMwMH0.-fQ-3o43cQ0wQh6dbB_a7r4xq_CMmQyd293J8ALkz-s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };
