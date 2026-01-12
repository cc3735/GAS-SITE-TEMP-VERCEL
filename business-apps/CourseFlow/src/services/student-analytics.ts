/**
 * Student Analytics Service
 *
 * Comprehensive analytics for learning progress including:
 * - Individual progress tracking
 * - Engagement metrics (time spent, participation)
 * - At-risk student identification
 * - Completion rate predictions
 * - Course and instructor analytics
 * - Learning patterns and recommendations
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

// Types
export interface StudentProgress {
  user_id: string;
  course_id: string;
  enrolled_at: Date;
  last_activity: Date;
  progress_percentage: number;
  time_spent_minutes: number;
  modules_completed: number;
  total_modules: number;
  assignments_completed: number;
  total_assignments: number;
  quizzes_completed: number;
  total_quizzes: number;
  average_quiz_score?: number;
  discussion_posts: number;
  discussion_replies: number;
  current_streak_days: number;
  longest_streak_days: number;
  status: 'active' | 'inactive' | 'at_risk' | 'completed';
}

export interface EngagementMetrics {
  total_time_spent_minutes: number;
  average_session_duration_minutes: number;
  total_sessions: number;
  days_active: number;
  content_views: number;
  video_watch_time_minutes: number;
  video_completion_rate: number;
  forum_participation_score: number;
  assignment_submission_rate: number;
  quiz_attempt_rate: number;
  resource_downloads: number;
  last_7_days: {
    date: string;
    minutes: number;
    activities: number;
  }[];
}

export interface AtRiskIndicators {
  is_at_risk: boolean;
  risk_score: number; // 0-100
  risk_factors: {
    factor: string;
    severity: 'low' | 'medium' | 'high';
    details: string;
  }[];
  recommendations: string[];
  last_calculated: Date;
}

export interface CompletionPrediction {
  predicted_completion_date: Date | null;
  confidence: number; // 0-100
  likely_to_complete: boolean;
  estimated_remaining_hours: number;
  current_pace_hours_per_week: number;
  required_pace_hours_per_week: number;
}

export interface CourseAnalytics {
  course_id: string;
  total_enrollments: number;
  active_students: number;
  completion_rate: number;
  average_progress: number;
  average_time_to_complete_hours: number;
  average_quiz_score: number;
  drop_off_points: {
    module_id: string;
    module_title: string;
    drop_off_rate: number;
  }[];
  engagement_by_day: {
    day: string;
    active_students: number;
    total_time_minutes: number;
  }[];
  rating_average?: number;
  rating_count?: number;
}

export interface InstructorAnalytics {
  instructor_id: string;
  total_courses: number;
  total_students: number;
  average_completion_rate: number;
  average_rating: number;
  total_reviews: number;
  response_rate: number;
  average_response_time_hours: number;
  most_popular_course_id?: string;
  revenue_total?: number;
}

export interface LearningActivity {
  id: string;
  user_id: string;
  course_id: string;
  activity_type:
    | 'page_view'
    | 'video_start'
    | 'video_complete'
    | 'quiz_start'
    | 'quiz_submit'
    | 'assignment_start'
    | 'assignment_submit'
    | 'discussion_post'
    | 'discussion_reply'
    | 'resource_download'
    | 'session_start'
    | 'session_end';
  content_id?: string;
  content_type?: string;
  duration_seconds?: number;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface LearningPattern {
  preferred_study_times: {
    hour: number;
    activity_count: number;
  }[];
  preferred_study_days: {
    day: string;
    activity_count: number;
  }[];
  average_session_length_minutes: number;
  content_preferences: {
    type: string;
    engagement_score: number;
  }[];
  learning_velocity: 'slow' | 'moderate' | 'fast';
  consistency_score: number; // 0-100
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  avatar_url?: string;
  points: number;
  badges_count: number;
  courses_completed: number;
  current_streak: number;
}

export class StudentAnalyticsService {
  // ==================== ACTIVITY TRACKING ====================

  async trackActivity(activity: Partial<LearningActivity>): Promise<void> {
    const { error } = await supabase
      .from('learning_activities')
      .insert({
        ...activity,
        created_at: new Date()
      });

    if (error) console.error('Failed to track activity:', error);

    // Update session stats
    if (activity.activity_type === 'session_end' && activity.duration_seconds) {
      await this.updateTimeSpent(
        activity.user_id!,
        activity.course_id!,
        Math.floor(activity.duration_seconds / 60)
      );
    }
  }

  private async updateTimeSpent(
    userId: string,
    courseId: string,
    minutes: number
  ): Promise<void> {
    await supabase.rpc('increment_time_spent', {
      p_user_id: userId,
      p_course_id: courseId,
      p_minutes: minutes
    });
  }

  // ==================== STUDENT PROGRESS ====================

  async getStudentProgress(
    userId: string,
    courseId: string
  ): Promise<StudentProgress | null> {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (!enrollment) return null;

    // Get course structure
    const { data: modules } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', courseId);

    const { data: assignments } = await supabase
      .from('assignments')
      .select('id')
      .eq('course_id', courseId);

    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id')
      .eq('course_id', courseId);

    // Get completions
    const { data: moduleCompletions } = await supabase
      .from('module_completions')
      .select('module_id')
      .eq('user_id', userId)
      .eq('course_id', courseId);

    const { data: submissions } = await supabase
      .from('submissions')
      .select('assignment_id, grade')
      .eq('user_id', userId)
      .eq('status', 'graded');

    const { data: quizAttempts } = await supabase
      .from('quiz_attempts')
      .select('quiz_id, percentage')
      .eq('user_id', userId)
      .eq('status', 'graded');

    // Get discussion activity
    const { count: discussionPosts } = await supabase
      .from('discussion_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('course_id', courseId);

    const { count: discussionReplies } = await supabase
      .from('discussion_replies')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Calculate streak
    const streak = await this.calculateStreak(userId, courseId);

    // Calculate progress
    const totalModules = modules?.length || 0;
    const completedModules = moduleCompletions?.length || 0;
    const progress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

    // Get last activity
    const { data: lastActivity } = await supabase
      .from('learning_activities')
      .select('created_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Calculate average quiz score
    const quizScores = quizAttempts?.map(a => a.percentage) || [];
    const avgQuizScore = quizScores.length > 0
      ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length
      : undefined;

    // Determine status
    let status: StudentProgress['status'] = 'active';
    if (progress >= 100) {
      status = 'completed';
    } else if (lastActivity && new Date(lastActivity.created_at) < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)) {
      status = 'inactive';
    }

    return {
      user_id: userId,
      course_id: courseId,
      enrolled_at: enrollment.enrolled_at,
      last_activity: lastActivity?.created_at || enrollment.enrolled_at,
      progress_percentage: Math.round(progress),
      time_spent_minutes: enrollment.time_spent_minutes || 0,
      modules_completed: completedModules,
      total_modules: totalModules,
      assignments_completed: submissions?.length || 0,
      total_assignments: assignments?.length || 0,
      quizzes_completed: quizAttempts?.length || 0,
      total_quizzes: quizzes?.length || 0,
      average_quiz_score: avgQuizScore,
      discussion_posts: discussionPosts || 0,
      discussion_replies: discussionReplies || 0,
      current_streak_days: streak.current,
      longest_streak_days: streak.longest,
      status
    };
  }

  private async calculateStreak(
    userId: string,
    courseId: string
  ): Promise<{ current: number; longest: number }> {
    const { data: activities } = await supabase
      .from('learning_activities')
      .select('created_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (!activities || activities.length === 0) {
      return { current: 0, longest: 0 };
    }

    // Get unique dates
    const dates = [...new Set(
      activities.map(a => new Date(a.created_at).toDateString())
    )].map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if today or yesterday had activity
    const mostRecent = dates[0];
    const daysDiff = Math.floor((today.getTime() - mostRecent.getTime()) / (24 * 60 * 60 * 1000));

    if (daysDiff > 1) {
      currentStreak = 0;
    } else {
      currentStreak = 1;
      for (let i = 1; i < dates.length; i++) {
        const diff = Math.floor(
          (dates[i - 1].getTime() - dates[i].getTime()) / (24 * 60 * 60 * 1000)
        );
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    for (let i = 1; i < dates.length; i++) {
      const diff = Math.floor(
        (dates[i - 1].getTime() - dates[i].getTime()) / (24 * 60 * 60 * 1000)
      );
      if (diff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return { current: currentStreak, longest: longestStreak };
  }

  // ==================== ENGAGEMENT METRICS ====================

  async getEngagementMetrics(
    userId: string,
    courseId: string
  ): Promise<EngagementMetrics> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get all activities
    const { data: activities } = await supabase
      .from('learning_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (!activities) {
      return this.emptyEngagementMetrics();
    }

    // Calculate session metrics
    const sessions = activities.filter(a => a.activity_type === 'session_end');
    const totalSessions = sessions.length;
    const totalSessionTime = sessions.reduce(
      (sum, s) => sum + ((s.duration_seconds || 0) / 60),
      0
    );
    const avgSessionDuration = totalSessions > 0
      ? totalSessionTime / totalSessions
      : 0;

    // Calculate video metrics
    const videoStarts = activities.filter(a => a.activity_type === 'video_start').length;
    const videoCompletes = activities.filter(a => a.activity_type === 'video_complete').length;
    const videoWatchTime = activities
      .filter(a => a.activity_type === 'video_complete')
      .reduce((sum, a) => sum + ((a.duration_seconds || 0) / 60), 0);

    // Forum participation
    const posts = activities.filter(a => a.activity_type === 'discussion_post').length;
    const replies = activities.filter(a => a.activity_type === 'discussion_reply').length;
    const forumScore = Math.min(100, (posts * 10 + replies * 5));

    // Submission rates
    const assignmentStarts = activities.filter(a => a.activity_type === 'assignment_start').length;
    const assignmentSubmits = activities.filter(a => a.activity_type === 'assignment_submit').length;
    const quizStarts = activities.filter(a => a.activity_type === 'quiz_start').length;
    const quizSubmits = activities.filter(a => a.activity_type === 'quiz_submit').length;

    // Content views and downloads
    const contentViews = activities.filter(a => a.activity_type === 'page_view').length;
    const downloads = activities.filter(a => a.activity_type === 'resource_download').length;

    // Days active
    const uniqueDays = new Set(
      activities.map(a => new Date(a.created_at).toDateString())
    );

    // Last 7 days breakdown
    const last7Days: { date: string; minutes: number; activities: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayActivities = activities.filter(a => {
        const actDate = new Date(a.created_at).toISOString().split('T')[0];
        return actDate === dateStr;
      });

      const dayMinutes = dayActivities
        .filter(a => a.activity_type === 'session_end')
        .reduce((sum, a) => sum + ((a.duration_seconds || 0) / 60), 0);

      last7Days.push({
        date: dateStr,
        minutes: Math.round(dayMinutes),
        activities: dayActivities.length
      });
    }

    return {
      total_time_spent_minutes: Math.round(totalSessionTime),
      average_session_duration_minutes: Math.round(avgSessionDuration),
      total_sessions: totalSessions,
      days_active: uniqueDays.size,
      content_views: contentViews,
      video_watch_time_minutes: Math.round(videoWatchTime),
      video_completion_rate: videoStarts > 0 ? (videoCompletes / videoStarts) * 100 : 0,
      forum_participation_score: forumScore,
      assignment_submission_rate: assignmentStarts > 0 ? (assignmentSubmits / assignmentStarts) * 100 : 0,
      quiz_attempt_rate: quizStarts > 0 ? (quizSubmits / quizStarts) * 100 : 0,
      resource_downloads: downloads,
      last_7_days: last7Days.reverse()
    };
  }

  private emptyEngagementMetrics(): EngagementMetrics {
    return {
      total_time_spent_minutes: 0,
      average_session_duration_minutes: 0,
      total_sessions: 0,
      days_active: 0,
      content_views: 0,
      video_watch_time_minutes: 0,
      video_completion_rate: 0,
      forum_participation_score: 0,
      assignment_submission_rate: 0,
      quiz_attempt_rate: 0,
      resource_downloads: 0,
      last_7_days: []
    };
  }

  // ==================== AT-RISK IDENTIFICATION ====================

  async getAtRiskIndicators(
    userId: string,
    courseId: string
  ): Promise<AtRiskIndicators> {
    const progress = await this.getStudentProgress(userId, courseId);
    const engagement = await this.getEngagementMetrics(userId, courseId);

    if (!progress) {
      return {
        is_at_risk: false,
        risk_score: 0,
        risk_factors: [],
        recommendations: [],
        last_calculated: new Date()
      };
    }

    const riskFactors: AtRiskIndicators['risk_factors'] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Factor 1: Inactivity
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(progress.last_activity).getTime()) / (24 * 60 * 60 * 1000)
    );

    if (daysSinceActivity > 14) {
      riskFactors.push({
        factor: 'Extended inactivity',
        severity: 'high',
        details: `No activity for ${daysSinceActivity} days`
      });
      riskScore += 30;
      recommendations.push('Consider sending a re-engagement email');
    } else if (daysSinceActivity > 7) {
      riskFactors.push({
        factor: 'Recent inactivity',
        severity: 'medium',
        details: `No activity for ${daysSinceActivity} days`
      });
      riskScore += 15;
      recommendations.push('Schedule a check-in with the student');
    }

    // Factor 2: Low progress
    const expectedProgress = this.calculateExpectedProgress(progress.enrolled_at);
    if (progress.progress_percentage < expectedProgress * 0.5) {
      riskFactors.push({
        factor: 'Significantly behind schedule',
        severity: 'high',
        details: `${progress.progress_percentage}% complete vs ${Math.round(expectedProgress)}% expected`
      });
      riskScore += 25;
      recommendations.push('Offer additional tutoring or support resources');
    } else if (progress.progress_percentage < expectedProgress * 0.75) {
      riskFactors.push({
        factor: 'Falling behind schedule',
        severity: 'medium',
        details: `${progress.progress_percentage}% complete vs ${Math.round(expectedProgress)}% expected`
      });
      riskScore += 12;
    }

    // Factor 3: Low quiz scores
    if (progress.average_quiz_score !== undefined && progress.average_quiz_score < 60) {
      riskFactors.push({
        factor: 'Low quiz performance',
        severity: 'high',
        details: `Average quiz score: ${progress.average_quiz_score.toFixed(1)}%`
      });
      riskScore += 20;
      recommendations.push('Review quiz questions and provide remedial content');
    } else if (progress.average_quiz_score !== undefined && progress.average_quiz_score < 70) {
      riskFactors.push({
        factor: 'Below average quiz performance',
        severity: 'medium',
        details: `Average quiz score: ${progress.average_quiz_score.toFixed(1)}%`
      });
      riskScore += 10;
    }

    // Factor 4: Missing assignments
    const assignmentCompletionRate =
      progress.total_assignments > 0
        ? (progress.assignments_completed / progress.total_assignments) * 100
        : 100;

    if (assignmentCompletionRate < 50) {
      riskFactors.push({
        factor: 'Missing multiple assignments',
        severity: 'high',
        details: `Only ${progress.assignments_completed}/${progress.total_assignments} assignments completed`
      });
      riskScore += 20;
      recommendations.push('Send assignment reminders');
    }

    // Factor 5: Low engagement
    if (engagement.total_sessions < 3 && daysSinceActivity <= 7) {
      riskFactors.push({
        factor: 'Low engagement',
        severity: 'medium',
        details: `Only ${engagement.total_sessions} sessions in the last 30 days`
      });
      riskScore += 10;
    }

    // Factor 6: Declining streak
    if (progress.longest_streak_days > 7 && progress.current_streak_days === 0) {
      riskFactors.push({
        factor: 'Lost learning streak',
        severity: 'low',
        details: `Had a ${progress.longest_streak_days} day streak, now at 0`
      });
      riskScore += 5;
      recommendations.push('Encourage student to restart their streak');
    }

    return {
      is_at_risk: riskScore >= 30,
      risk_score: Math.min(100, riskScore),
      risk_factors,
      recommendations,
      last_calculated: new Date()
    };
  }

  private calculateExpectedProgress(enrolledAt: Date): number {
    const daysSinceEnrollment = Math.floor(
      (Date.now() - new Date(enrolledAt).getTime()) / (24 * 60 * 60 * 1000)
    );
    // Assume 8-week course
    const expectedDays = 56;
    return Math.min(100, (daysSinceEnrollment / expectedDays) * 100);
  }

  async getAtRiskStudents(courseId: string): Promise<{
    user_id: string;
    user_name: string;
    risk_score: number;
    primary_factor: string;
  }[]> {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('user_id, user:profiles(full_name)')
      .eq('course_id', courseId);

    if (!enrollments) return [];

    const atRiskStudents: {
      user_id: string;
      user_name: string;
      risk_score: number;
      primary_factor: string;
    }[] = [];

    for (const enrollment of enrollments) {
      const indicators = await this.getAtRiskIndicators(enrollment.user_id, courseId);

      if (indicators.is_at_risk) {
        atRiskStudents.push({
          user_id: enrollment.user_id,
          user_name: (enrollment.user as any)?.full_name || 'Unknown',
          risk_score: indicators.risk_score,
          primary_factor: indicators.risk_factors[0]?.factor || 'Unknown'
        });
      }
    }

    return atRiskStudents.sort((a, b) => b.risk_score - a.risk_score);
  }

  // ==================== COMPLETION PREDICTION ====================

  async getCompletionPrediction(
    userId: string,
    courseId: string
  ): Promise<CompletionPrediction> {
    const progress = await this.getStudentProgress(userId, courseId);
    const engagement = await this.getEngagementMetrics(userId, courseId);

    if (!progress) {
      return {
        predicted_completion_date: null,
        confidence: 0,
        likely_to_complete: false,
        estimated_remaining_hours: 0,
        current_pace_hours_per_week: 0,
        required_pace_hours_per_week: 0
      };
    }

    // Get course estimated hours
    const { data: course } = await supabase
      .from('courses')
      .select('estimated_hours')
      .eq('id', courseId)
      .single();

    const estimatedTotalHours = course?.estimated_hours || 40;
    const completedHours = (progress.progress_percentage / 100) * estimatedTotalHours;
    const remainingHours = estimatedTotalHours - completedHours;

    // Calculate current pace (hours per week based on last 4 weeks)
    const weeksEnrolled = Math.max(
      1,
      Math.floor(
        (Date.now() - new Date(progress.enrolled_at).getTime()) / (7 * 24 * 60 * 60 * 1000)
      )
    );
    const currentPace = weeksEnrolled > 0
      ? (engagement.total_time_spent_minutes / 60) / Math.min(weeksEnrolled, 4)
      : 0;

    // Estimate weeks to complete at current pace
    const weeksToComplete = currentPace > 0 ? remainingHours / currentPace : Infinity;

    // Calculate predicted completion date
    let predictedDate: Date | null = null;
    if (weeksToComplete < 52) {
      predictedDate = new Date();
      predictedDate.setDate(predictedDate.getDate() + weeksToComplete * 7);
    }

    // Calculate required pace (assuming 12-week target)
    const remainingWeeks = 12 - Math.min(weeksEnrolled, 12);
    const requiredPace = remainingWeeks > 0 ? remainingHours / remainingWeeks : 0;

    // Calculate confidence
    let confidence = 70; // Base confidence
    if (progress.status === 'inactive') confidence -= 30;
    if (currentPace < requiredPace * 0.5) confidence -= 20;
    if (progress.average_quiz_score && progress.average_quiz_score < 60) confidence -= 10;
    if (progress.current_streak_days >= 7) confidence += 10;
    confidence = Math.max(0, Math.min(100, confidence));

    return {
      predicted_completion_date: predictedDate,
      confidence,
      likely_to_complete: currentPace >= requiredPace * 0.7,
      estimated_remaining_hours: Math.round(remainingHours),
      current_pace_hours_per_week: Math.round(currentPace * 10) / 10,
      required_pace_hours_per_week: Math.round(requiredPace * 10) / 10
    };
  }

  // ==================== LEARNING PATTERNS ====================

  async getLearningPatterns(
    userId: string,
    courseId?: string
  ): Promise<LearningPattern> {
    let query = supabase
      .from('learning_activities')
      .select('*')
      .eq('user_id', userId);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data: activities } = await query;

    if (!activities || activities.length === 0) {
      return this.emptyLearningPattern();
    }

    // Calculate preferred study times
    const hourCounts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourCounts[i] = 0;

    activities.forEach(a => {
      const hour = new Date(a.created_at).getHours();
      hourCounts[hour]++;
    });

    const preferredTimes = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), activity_count: count }))
      .sort((a, b) => b.activity_count - a.activity_count);

    // Calculate preferred days
    const dayCounts: Record<string, number> = {
      Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0,
      Thursday: 0, Friday: 0, Saturday: 0
    };
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    activities.forEach(a => {
      const day = days[new Date(a.created_at).getDay()];
      dayCounts[day]++;
    });

    const preferredDays = Object.entries(dayCounts)
      .map(([day, count]) => ({ day, activity_count: count }))
      .sort((a, b) => b.activity_count - a.activity_count);

    // Calculate session length
    const sessions = activities.filter(a => a.activity_type === 'session_end');
    const avgSessionLength = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + ((s.duration_seconds || 0) / 60), 0) / sessions.length
      : 0;

    // Calculate content preferences
    const contentTypes: Record<string, number> = {};
    activities.forEach(a => {
      if (a.content_type) {
        contentTypes[a.content_type] = (contentTypes[a.content_type] || 0) + 1;
      }
    });

    const totalContent = Object.values(contentTypes).reduce((a, b) => a + b, 0);
    const contentPreferences = Object.entries(contentTypes)
      .map(([type, count]) => ({
        type,
        engagement_score: Math.round((count / totalContent) * 100)
      }))
      .sort((a, b) => b.engagement_score - a.engagement_score);

    // Calculate learning velocity
    const firstActivity = new Date(activities[activities.length - 1].created_at);
    const lastActivity = new Date(activities[0].created_at);
    const daysActive = Math.max(1, Math.floor(
      (lastActivity.getTime() - firstActivity.getTime()) / (24 * 60 * 60 * 1000)
    ));
    const activitiesPerDay = activities.length / daysActive;

    let velocity: LearningPattern['learning_velocity'] = 'moderate';
    if (activitiesPerDay > 10) velocity = 'fast';
    else if (activitiesPerDay < 3) velocity = 'slow';

    // Calculate consistency (based on regular activity days)
    const uniqueDays = new Set(
      activities.map(a => new Date(a.created_at).toDateString())
    );
    const consistency = Math.min(100, Math.round((uniqueDays.size / daysActive) * 100));

    return {
      preferred_study_times: preferredTimes,
      preferred_study_days: preferredDays,
      average_session_length_minutes: Math.round(avgSessionLength),
      content_preferences: contentPreferences,
      learning_velocity: velocity,
      consistency_score: consistency
    };
  }

  private emptyLearningPattern(): LearningPattern {
    return {
      preferred_study_times: [],
      preferred_study_days: [],
      average_session_length_minutes: 0,
      content_preferences: [],
      learning_velocity: 'moderate',
      consistency_score: 0
    };
  }

  // ==================== COURSE ANALYTICS ====================

  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    // Get enrollment counts
    const { count: totalEnrollments } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    // Get active students (activity in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { data: activeIds } = await supabase
      .from('learning_activities')
      .select('user_id')
      .eq('course_id', courseId)
      .gte('created_at', sevenDaysAgo.toISOString());

    const activeStudents = new Set(activeIds?.map(a => a.user_id)).size;

    // Get completion data
    const { data: completions } = await supabase
      .from('course_completions')
      .select('*')
      .eq('course_id', courseId);

    const completionRate = totalEnrollments && totalEnrollments > 0
      ? ((completions?.length || 0) / totalEnrollments) * 100
      : 0;

    // Get average progress
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('progress_percentage')
      .eq('course_id', courseId);

    const avgProgress = enrollments && enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / enrollments.length
      : 0;

    // Get completion times
    const completionTimes = completions?.map(c => {
      const start = new Date(c.enrolled_at);
      const end = new Date(c.completed_at);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }) || [];

    const avgTimeToComplete = completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

    // Get quiz stats
    const { data: quizAttempts } = await supabase
      .from('quiz_attempts')
      .select('percentage')
      .eq('course_id', courseId)
      .eq('status', 'graded');

    const avgQuizScore = quizAttempts && quizAttempts.length > 0
      ? quizAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / quizAttempts.length
      : 0;

    // Get drop-off points
    const { data: modules } = await supabase
      .from('modules')
      .select('id, title, order')
      .eq('course_id', courseId)
      .order('order', { ascending: true });

    const dropOffPoints: CourseAnalytics['drop_off_points'] = [];
    for (const module of modules || []) {
      const { count: started } = await supabase
        .from('module_progress')
        .select('*', { count: 'exact', head: true })
        .eq('module_id', module.id);

      const { count: completed } = await supabase
        .from('module_completions')
        .select('*', { count: 'exact', head: true })
        .eq('module_id', module.id);

      const dropOffRate = started && started > 0
        ? ((started - (completed || 0)) / started) * 100
        : 0;

      if (dropOffRate > 20) {
        dropOffPoints.push({
          module_id: module.id,
          module_title: module.title,
          drop_off_rate: Math.round(dropOffRate)
        });
      }
    }

    // Get engagement by day
    const { data: dailyActivities } = await supabase
      .from('learning_activities')
      .select('created_at, user_id, duration_seconds')
      .eq('course_id', courseId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const engagementByDay: Map<string, { students: Set<string>; minutes: number }> = new Map();
    dailyActivities?.forEach(a => {
      const day = new Date(a.created_at).toISOString().split('T')[0];
      const current = engagementByDay.get(day) || { students: new Set(), minutes: 0 };
      current.students.add(a.user_id);
      current.minutes += (a.duration_seconds || 0) / 60;
      engagementByDay.set(day, current);
    });

    const engagementArray = Array.from(engagementByDay.entries())
      .map(([day, data]) => ({
        day,
        active_students: data.students.size,
        total_time_minutes: Math.round(data.minutes)
      }))
      .sort((a, b) => a.day.localeCompare(b.day));

    // Get ratings
    const { data: ratings } = await supabase
      .from('course_ratings')
      .select('rating')
      .eq('course_id', courseId);

    const ratingAverage = ratings && ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : undefined;

    return {
      course_id: courseId,
      total_enrollments: totalEnrollments || 0,
      active_students: activeStudents,
      completion_rate: Math.round(completionRate * 10) / 10,
      average_progress: Math.round(avgProgress),
      average_time_to_complete_hours: Math.round(avgTimeToComplete),
      average_quiz_score: Math.round(avgQuizScore * 10) / 10,
      drop_off_points: dropOffPoints,
      engagement_by_day: engagementArray,
      rating_average: ratingAverage ? Math.round(ratingAverage * 10) / 10 : undefined,
      rating_count: ratings?.length
    };
  }

  // ==================== LEADERBOARD ====================

  async getLeaderboard(
    courseId?: string,
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
    let query = supabase
      .from('user_stats')
      .select(`
        user_id,
        total_points,
        badges_count,
        courses_completed,
        current_streak,
        user:profiles(full_name, avatar_url)
      `);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query
      .order('total_points', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((entry, index) => ({
      rank: index + 1,
      user_id: entry.user_id,
      user_name: (entry.user as any)?.full_name || 'Anonymous',
      avatar_url: (entry.user as any)?.avatar_url,
      points: entry.total_points || 0,
      badges_count: entry.badges_count || 0,
      courses_completed: entry.courses_completed || 0,
      current_streak: entry.current_streak || 0
    }));
  }

  async getUserRank(userId: string, courseId?: string): Promise<number> {
    // Count users with more points
    let query = supabase
      .from('user_stats')
      .select('user_id, total_points');

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data } = await query;
    if (!data) return 0;

    const userStats = data.find(d => d.user_id === userId);
    if (!userStats) return data.length + 1;

    const rank = data.filter(d => (d.total_points || 0) > (userStats.total_points || 0)).length + 1;
    return rank;
  }
}

// Export singleton instance
export const studentAnalyticsService = new StudentAnalyticsService();

// Export convenience functions
export const trackActivity = (activity: Partial<LearningActivity>) =>
  studentAnalyticsService.trackActivity(activity);
export const getStudentProgress = (userId: string, courseId: string) =>
  studentAnalyticsService.getStudentProgress(userId, courseId);
export const getAtRiskStudents = (courseId: string) =>
  studentAnalyticsService.getAtRiskStudents(courseId);
export const getCourseAnalytics = (courseId: string) =>
  studentAnalyticsService.getCourseAnalytics(courseId);
