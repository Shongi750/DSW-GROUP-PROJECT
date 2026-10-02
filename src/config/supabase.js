import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Your specific Supabase project URL
const supabaseUrl = 'https://ghxxmzerqyahhqcrjjkd.supabase.co';
// Replace this with your actual anon key from the dashboard
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoeHhtemVycXlhaGhxY3JqamtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNDM2NzMsImV4cCI6MjEwNTcxOTY3M30.Wj1bZ4mulz7Ocev-Yn9VtpmZtPEPRyCoL9SsmVrY5J0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);