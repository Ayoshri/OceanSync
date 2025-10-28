// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://klljjodqtvpqamtygkpd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbGpqb2RxdHZwcWFtdHlna3BkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMDI5ODcsImV4cCI6MjA3Mjc3ODk4N30.yhPbIvtmTPkUzOBSGwQsIzMrP92nEZAyPVS8STHqPmA';
export const supabase = createClient(supabaseUrl, supabaseKey);

// Function to get hazard reports
export async function getHazardReports() {
  const { data, error } = await supabase.from('hazard_reports').select('*');
  if (error) throw error;
  return data;
}
