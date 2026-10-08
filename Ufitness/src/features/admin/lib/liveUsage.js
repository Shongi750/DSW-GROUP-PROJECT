import { isSupabaseConfigured, supabase } from '../../../lib/supabase';
import { listStudents } from '../../../lib/students';
import { isMissingTableError } from '../../../lib/cloudErrors';
import { buildFeatureSeries, buildWeekSeries, hasAnyUsage } from './usageMath';

// Real numbers for the Campus Admin dashboard. No sample data:
// if nothing has been recorded yet, the screen shows an empty state.

const CAMPUSES = ['APK', 'APB', 'DFC', 'SWC'];

function campusCode(value) {
  const text = String(value || '').toUpperCase();
  return CAMPUSES.find((code) => text.startsWith(code)) || '';
}

export async function loadLiveStudents() {
  return listStudents();
}

/**
 * cloud: 'ok' | 'local' (no Supabase keys) | 'missing' (run schema.sql) | 'error'
 */
export async function loadLiveUsage() {
  const students = await loadLiveStudents();
  let summary = null;
  let cloud = 'ok';

  if (!isSupabaseConfigured || !supabase) {
    cloud = 'local';
  } else {
    try {
      const { data, error } = await supabase.rpc('admin_usage_summary');
      if (error) cloud = isMissingTableError(error) ? 'missing' : 'error';
      else summary = data;
    } catch {
      cloud = 'error';
    }
  }

  const byDay = buildWeekSeries(summary?.active_by_day);
  const byModule = buildFeatureSeries(summary?.features);

  return {
    cloud,
    students,
    totalStudents: Number(summary?.total_students ?? students.length) || 0,
    signups7d: Number(summary?.signups_7d) || 0,
    active7d: Number(summary?.active_7d) || 0,
    byCampus: CAMPUSES.map((label) => ({
      label,
      value: students.filter((row) => campusCode(row.campus) === label).length,
    })),
    byDay,
    byModule,
    hasUsage: hasAnyUsage(byDay, byModule),
  };
}
