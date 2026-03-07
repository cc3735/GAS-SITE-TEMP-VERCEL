import { supabase } from './supabase';

const DEBOUNCE_MS = 3000;
const timers: Record<string, number> = {};

export interface ProgressData {
  completed_lessons: string[];
  quiz_scores: Record<string, { score: number; total: number }>;
  total_lessons: number;
  completion_percentage: number;
}

export async function enrollInCourse(courseId: string, userId: string) {
  const { error } = await supabase.from('education_progress').upsert(
    { course_id: courseId, user_id: userId, status: 'active' },
    { onConflict: 'user_id,course_id' },
  );
  return !error;
}

export async function markCourseComplete(courseId: string, userId: string) {
  await supabase
    .from('education_progress')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('course_id', courseId)
    .eq('user_id', userId);
}

export function syncProgress(courseId: string, userId: string) {
  if (timers[courseId]) clearTimeout(timers[courseId]);
  timers[courseId] = window.setTimeout(async () => {
    const lessons = localStorage.getItem(`gas_course_progress_${courseId}`);
    const quizzes = localStorage.getItem(`gas_quiz_scores_${courseId}`);
    const summary = localStorage.getItem(`gas_course_summary_${courseId}`);

    const parsed = summary ? JSON.parse(summary) : {};
    const completedLessons: string[] = lessons ? JSON.parse(lessons) : [];
    const totalLessons: number = parsed.total || 0;
    const pct = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;

    const progress: ProgressData = {
      completed_lessons: completedLessons,
      quiz_scores: quizzes ? JSON.parse(quizzes) : {},
      total_lessons: totalLessons,
      completion_percentage: pct,
    };

    await supabase
      .from('education_progress')
      .update({ progress, last_accessed_at: new Date().toISOString() })
      .eq('course_id', courseId)
      .eq('user_id', userId);

    if (pct >= 100) {
      await markCourseComplete(courseId, userId);
    }
  }, DEBOUNCE_MS);
}

export async function loadProgress(courseId: string, userId: string): Promise<ProgressData | null> {
  const { data } = await supabase
    .from('education_progress')
    .select('progress')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .single();

  if (!data?.progress) return null;

  const p = data.progress as ProgressData;

  // Hydrate localStorage from Supabase if localStorage is empty
  const localLessons = localStorage.getItem(`gas_course_progress_${courseId}`);
  if (!localLessons && p.completed_lessons?.length) {
    localStorage.setItem(`gas_course_progress_${courseId}`, JSON.stringify(p.completed_lessons));
  }
  const localQuizzes = localStorage.getItem(`gas_quiz_scores_${courseId}`);
  if (!localQuizzes && p.quiz_scores && Object.keys(p.quiz_scores).length) {
    localStorage.setItem(`gas_quiz_scores_${courseId}`, JSON.stringify(p.quiz_scores));
  }
  if (p.total_lessons) {
    localStorage.setItem(
      `gas_course_summary_${courseId}`,
      JSON.stringify({ completed: p.completed_lessons?.length || 0, total: p.total_lessons }),
    );
  }

  return p;
}
