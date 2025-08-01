import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dttczenkpmtejtugfivr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dGN6ZW5rcG10ZWp0dWdmaXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzU2ODYsImV4cCI6MjA2NTc1MTY4Nn0.ZTcbpD3b--XTQxS3--Pu9NuFuYhGBQOtCu7ePK_5s1U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);