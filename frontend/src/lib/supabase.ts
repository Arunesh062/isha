import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://ktovloukstlhjmxijgnx.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0b3Zsb3Vrc3RsaGpteGlqZ254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMzU2NjYsImV4cCI6MjEwNzYxMTY2Nn0.IjZ1un4ZNypiFLqTpHSr_tzKcu9ZdGp6zCUU5sjgOUc';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL) ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_ANON_KEY) ||
  DEFAULT_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);
