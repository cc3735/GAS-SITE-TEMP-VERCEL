# CourseFlow LMS - Improvements Guide

## Overview

This guide covers the enhanced features added to the CourseFlow Learning Management System:

1. **Quiz Engine** - Multiple question types, timed assessments, auto-grading, question pools
2. **Learning Paths** - Course prerequisites, sequences, certificates, badges, milestones
3. **Student Analytics** - Progress tracking, engagement metrics, at-risk identification, predictions

---

## Table of Contents

1. [Quiz Engine](#quiz-engine)
2. [Learning Paths](#learning-paths)
3. [Student Analytics](#student-analytics)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)

---

## Quiz Engine

### Features

- Multiple question types (MCQ, true/false, matching, ordering, fill-in-blank, numeric)
- Timed assessments with auto-submit
- Question pools and randomization
- Partial credit scoring
- Auto-grading with detailed feedback
- Attempt tracking and analytics
- Late submission policies

### Question Types

| Type | Description | Auto-Graded |
|------|-------------|-------------|
| `multiple_choice` | Single answer from options | Yes |
| `multiple_select` | Multiple answers from options | Yes |
| `true_false` | True or False | Yes |
| `short_answer` | Text response | Yes |
| `long_answer` | Essay response | No (manual) |
| `matching` | Match pairs | Yes |
| `ordering` | Put items in order | Yes |
| `fill_in_blank` | Complete the sentence | Yes |
| `numeric` | Numerical answer with tolerance | Yes |

### Creating a Quiz

```typescript
import { quizEngineService } from './services/quiz-engine';

const quiz = await quizEngineService.createQuiz({
  course_id: 'course-123',
  title: 'Module 1 Assessment',
  description: 'Test your understanding of the basics',
  quiz_type: 'graded',
  time_limit_minutes: 30,
  passing_score: 70,
  max_attempts: 3,
  shuffle_questions: true,
  shuffle_options: true,
  show_correct_answers: 'after_submission',
  show_feedback: 'after_submission'
});
```

### Adding Questions

```typescript
// Multiple Choice
await quizEngineService.addQuestion(quiz.id, {
  type: 'multiple_choice',
  text: 'What is the capital of France?',
  points: 1,
  options: [
    { id: 'a', text: 'London', isCorrect: false },
    { id: 'b', text: 'Paris', isCorrect: true, feedback: 'Correct!' },
    { id: 'c', text: 'Berlin', isCorrect: false },
    { id: 'd', text: 'Madrid', isCorrect: false }
  ],
  explanation: 'Paris is the capital of France.',
  difficulty: 'easy'
});

// Multiple Select (partial credit)
await quizEngineService.addQuestion(quiz.id, {
  type: 'multiple_select',
  text: 'Select all prime numbers:',
  points: 2,
  partialCredit: true,
  options: [
    { id: 'a', text: '2', isCorrect: true },
    { id: 'b', text: '3', isCorrect: true },
    { id: 'c', text: '4', isCorrect: false },
    { id: 'd', text: '5', isCorrect: true }
  ]
});

// Matching
await quizEngineService.addQuestion(quiz.id, {
  type: 'matching',
  text: 'Match the country with its capital:',
  points: 3,
  partialCredit: true,
  options: [
    { id: 'france', text: 'France', matchPair: 'paris' },
    { id: 'germany', text: 'Germany', matchPair: 'berlin' },
    { id: 'spain', text: 'Spain', matchPair: 'madrid' }
  ]
});

// Ordering
await quizEngineService.addQuestion(quiz.id, {
  type: 'ordering',
  text: 'Put these events in chronological order:',
  points: 2,
  options: [
    { id: 'a', text: 'World War I', order: 1 },
    { id: 'b', text: 'World War II', order: 2 },
    { id: 'c', text: 'Cold War', order: 3 }
  ]
});

// Numeric with tolerance
await quizEngineService.addQuestion(quiz.id, {
  type: 'numeric',
  text: 'What is the value of pi to 2 decimal places?',
  points: 1,
  correctAnswer: 3.14,
  answerTolerance: 0.01
});

// Fill in the blanks
await quizEngineService.addQuestion(quiz.id, {
  type: 'fill_in_blank',
  text: 'The chemical formula for water is {blank1}. It consists of {blank2} hydrogen atoms.',
  points: 2,
  correctAnswer: {
    blank1: 'H2O',
    blank2: '2'
  },
  caseSensitive: false
});
```

### Question Pools

```typescript
// Create question pool
const pool = await quizEngineService.createQuestionPool({
  course_id: 'course-123',
  name: 'Chapter 1 Questions',
  description: 'Questions covering chapter 1 material',
  tags: ['chapter1', 'basics']
});

// Add questions to pool
await quizEngineService.addQuestionToPool(pool.id, {
  type: 'multiple_choice',
  text: 'Pool question...',
  points: 1,
  difficulty: 'medium',
  tags: ['chapter1'],
  options: [...]
});

// Configure quiz to pull from pool
await quizEngineService.updateQuiz(quiz.id, {
  question_pool_config: [
    {
      pool_id: pool.id,
      count: 10,  // Pull 10 random questions
      tags: ['chapter1'],
      difficulty: 'medium'
    }
  ]
});
```

### Taking a Quiz

```typescript
// Start attempt
const attempt = await quizEngineService.startAttempt(quiz.id, userId);

// Save answers as user progresses
await quizEngineService.saveAnswer(attempt.id, 'question-1', 'b');
await quizEngineService.saveAnswer(attempt.id, 'question-2', ['a', 'b', 'd']);
await quizEngineService.saveAnswer(attempt.id, 'question-3', 3.14);

// Check remaining time
const remaining = await quizEngineService.getRemainingTime(attempt.id);
// Returns seconds remaining or null if no time limit

// Submit attempt
const result = await quizEngineService.submitAttempt(attempt.id);
// Result includes:
// - score: total points earned
// - percentage: percentage score
// - passed: boolean based on passing_score
// - answers: graded answers with feedback
```

### Quiz Analytics

```typescript
const stats = await quizEngineService.getQuizStats(quiz.id);
// Returns:
// - totalAttempts
// - averageScore
// - passRate
// - averageTimeSpent
// - questionStats: per-question correct rate
```

---

## Learning Paths

### Features

- Course sequences with prerequisites
- Milestones and checkpoints
- Drip content (scheduled unlocks)
- Badges and achievements
- Completion certificates (auto-generated PDF)
- Progress tracking across paths

### Creating a Learning Path

```typescript
import { learningPathsService } from './services/learning-paths';

const path = await learningPathsService.createLearningPath({
  organization_id: 'org-123',
  title: 'Full Stack Developer Track',
  description: 'Complete path to become a full stack developer',
  difficulty: 'intermediate',
  tags: ['programming', 'web development']
});
```

### Adding Courses

```typescript
// Add courses with order and prerequisites
await learningPathsService.addCourseToPath(path.id, {
  course_id: 'html-basics',
  order: 1,
  is_required: true
});

await learningPathsService.addCourseToPath(path.id, {
  course_id: 'css-fundamentals',
  order: 2,
  is_required: true,
  prerequisites: ['html-basics']  // Must complete HTML first
});

await learningPathsService.addCourseToPath(path.id, {
  course_id: 'javascript-basics',
  order: 3,
  is_required: true,
  prerequisites: ['html-basics', 'css-fundamentals']
});

// Drip content - unlocks after 7 days
await learningPathsService.addCourseToPath(path.id, {
  course_id: 'advanced-javascript',
  order: 4,
  is_required: true,
  unlock_after_days: 7
});
```

### Milestones

```typescript
// Add milestone when multiple courses completed
await learningPathsService.addMilestone(path.id, {
  title: 'Frontend Fundamentals Complete',
  description: 'Completed HTML, CSS, and JavaScript basics',
  course_ids: ['html-basics', 'css-fundamentals', 'javascript-basics'],
  badge_id: 'frontend-badge',
  points: 100,
  order: 1
});
```

### Badges

```typescript
// Create badge
const badge = await learningPathsService.createBadge({
  organization_id: 'org-123',
  name: 'Frontend Expert',
  description: 'Completed all frontend fundamentals',
  image_url: 'https://example.com/badges/frontend.png',
  criteria: 'Complete HTML, CSS, and JavaScript courses',
  points: 50,
  rarity: 'uncommon'
});

// Award badge manually
await learningPathsService.awardBadge(userId, badge.id, {
  learning_path_id: path.id
});

// Get user badges
const badges = await learningPathsService.getUserBadges(userId);
```

### Enrollment and Progress

```typescript
// Enroll in learning path
const enrollment = await learningPathsService.enrollInPath(userId, path.id);

// Update progress when course completed
await learningPathsService.updateEnrollmentProgress(
  enrollment.id,
  'html-basics'  // Completed course ID
);

// Get available courses (considering prerequisites and drip)
const { available, locked } = await learningPathsService.getAvailableCourses(
  userId,
  path.id
);
// available: courses user can access
// locked: courses with unlock dates
```

### Certificates

```typescript
// Certificate is auto-generated when path completed
// Can also generate manually:
const cert = await learningPathsService.generateCertificate(userId, path.id);

// Verify certificate
const verified = await learningPathsService.verifyCertificate('CERT-ABC123');

// Get user certificates
const certs = await learningPathsService.getUserCertificates(userId);
```

### Course Prerequisites

```typescript
// Set prerequisites for individual courses
await learningPathsService.setCoursePrerequisites('advanced-react', [
  {
    course_id: 'advanced-react',
    prerequisite_course_id: 'react-basics',
    is_required: true,
    minimum_score: 70  // Optional: minimum quiz/course score
  }
]);

// Check if prerequisites met
const { met, missing } = await learningPathsService.checkPrerequisitesMet(
  userId,
  'advanced-react'
);
```

---

## Student Analytics

### Features

- Individual progress tracking
- Engagement metrics (time spent, sessions, participation)
- At-risk student identification
- Completion predictions
- Learning patterns analysis
- Course analytics
- Leaderboards

### Tracking Activity

```typescript
import { studentAnalyticsService } from './services/student-analytics';

// Track various activities
await studentAnalyticsService.trackActivity({
  user_id: userId,
  course_id: courseId,
  activity_type: 'page_view',
  content_id: 'module-1-lesson-3',
  content_type: 'lesson'
});

await studentAnalyticsService.trackActivity({
  user_id: userId,
  course_id: courseId,
  activity_type: 'video_complete',
  content_id: 'video-123',
  duration_seconds: 600
});

await studentAnalyticsService.trackActivity({
  user_id: userId,
  course_id: courseId,
  activity_type: 'session_end',
  duration_seconds: 3600  // 1 hour session
});
```

### Student Progress

```typescript
const progress = await studentAnalyticsService.getStudentProgress(userId, courseId);
// Returns:
// - progress_percentage
// - time_spent_minutes
// - modules_completed / total_modules
// - assignments_completed / total_assignments
// - quizzes_completed / total_quizzes
// - average_quiz_score
// - discussion_posts / replies
// - current_streak_days / longest_streak_days
// - status: 'active' | 'inactive' | 'at_risk' | 'completed'
```

### Engagement Metrics

```typescript
const engagement = await studentAnalyticsService.getEngagementMetrics(userId, courseId);
// Returns:
// - total_time_spent_minutes
// - average_session_duration_minutes
// - total_sessions
// - days_active
// - content_views
// - video_watch_time_minutes
// - video_completion_rate
// - forum_participation_score
// - assignment_submission_rate
// - quiz_attempt_rate
// - resource_downloads
// - last_7_days: daily breakdown
```

### At-Risk Identification

```typescript
// Check individual student
const indicators = await studentAnalyticsService.getAtRiskIndicators(userId, courseId);
// Returns:
// - is_at_risk: boolean
// - risk_score: 0-100
// - risk_factors: [{ factor, severity, details }]
// - recommendations: string[]

// Get all at-risk students in course
const atRisk = await studentAnalyticsService.getAtRiskStudents(courseId);
// Returns sorted by risk_score (highest first)
```

### Risk Factors

| Factor | Severity | Points |
|--------|----------|--------|
| No activity 14+ days | High | +30 |
| No activity 7-14 days | Medium | +15 |
| Progress <50% expected | High | +25 |
| Progress <75% expected | Medium | +12 |
| Quiz score <60% | High | +20 |
| Quiz score <70% | Medium | +10 |
| Missing >50% assignments | High | +20 |
| <3 sessions in 30 days | Medium | +10 |
| Lost learning streak | Low | +5 |

### Completion Predictions

```typescript
const prediction = await studentAnalyticsService.getCompletionPrediction(userId, courseId);
// Returns:
// - predicted_completion_date: Date | null
// - confidence: 0-100
// - likely_to_complete: boolean
// - estimated_remaining_hours
// - current_pace_hours_per_week
// - required_pace_hours_per_week
```

### Learning Patterns

```typescript
const patterns = await studentAnalyticsService.getLearningPatterns(userId, courseId);
// Returns:
// - preferred_study_times: [{ hour, activity_count }]
// - preferred_study_days: [{ day, activity_count }]
// - average_session_length_minutes
// - content_preferences: [{ type, engagement_score }]
// - learning_velocity: 'slow' | 'moderate' | 'fast'
// - consistency_score: 0-100
```

### Course Analytics (Instructor View)

```typescript
const analytics = await studentAnalyticsService.getCourseAnalytics(courseId);
// Returns:
// - total_enrollments
// - active_students
// - completion_rate
// - average_progress
// - average_time_to_complete_hours
// - average_quiz_score
// - drop_off_points: [{ module_id, title, drop_off_rate }]
// - engagement_by_day: [{ day, active_students, total_time_minutes }]
// - rating_average / rating_count
```

### Leaderboards

```typescript
// Get global or course leaderboard
const leaders = await studentAnalyticsService.getLeaderboard(courseId, 10);
// Returns top 10:
// - rank, user_id, user_name, avatar_url
// - points, badges_count, courses_completed, current_streak

// Get user's rank
const rank = await studentAnalyticsService.getUserRank(userId, courseId);
```

---

## API Reference

### Quiz Engine

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quizzes` | Create quiz |
| GET | `/api/quizzes/:id` | Get quiz |
| GET | `/api/courses/:courseId/quizzes` | List quizzes |
| PUT | `/api/quizzes/:id` | Update quiz |
| POST | `/api/quizzes/:id/publish` | Publish quiz |
| DELETE | `/api/quizzes/:id` | Delete quiz |
| POST | `/api/quizzes/:id/questions` | Add question |
| PUT | `/api/questions/:id` | Update question |
| DELETE | `/api/questions/:id` | Delete question |
| POST | `/api/quizzes/:id/attempts` | Start attempt |
| GET | `/api/attempts/:id` | Get attempt |
| POST | `/api/attempts/:id/answers` | Save answer |
| POST | `/api/attempts/:id/submit` | Submit attempt |
| GET | `/api/quizzes/:id/stats` | Quiz stats |

### Learning Paths

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/learning-paths` | Create path |
| GET | `/api/learning-paths/:id` | Get path |
| GET | `/api/learning-paths` | List paths |
| PUT | `/api/learning-paths/:id` | Update path |
| POST | `/api/learning-paths/:id/publish` | Publish path |
| POST | `/api/learning-paths/:id/courses` | Add course |
| DELETE | `/api/learning-paths/:id/courses/:courseId` | Remove course |
| POST | `/api/learning-paths/:id/milestones` | Add milestone |
| POST | `/api/learning-paths/:id/enroll` | Enroll user |
| GET | `/api/learning-paths/:id/enrollment` | Get enrollment |
| POST | `/api/enrollments/:id/progress` | Update progress |
| POST | `/api/badges` | Create badge |
| GET | `/api/users/:id/badges` | User badges |
| GET | `/api/users/:id/certificates` | User certificates |
| GET | `/api/certificates/verify/:number` | Verify cert |

### Student Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analytics/activity` | Track activity |
| GET | `/api/analytics/progress/:userId/:courseId` | Student progress |
| GET | `/api/analytics/engagement/:userId/:courseId` | Engagement metrics |
| GET | `/api/analytics/risk/:userId/:courseId` | At-risk indicators |
| GET | `/api/analytics/risk/course/:courseId` | At-risk students |
| GET | `/api/analytics/prediction/:userId/:courseId` | Completion prediction |
| GET | `/api/analytics/patterns/:userId` | Learning patterns |
| GET | `/api/analytics/course/:courseId` | Course analytics |
| GET | `/api/analytics/leaderboard` | Global leaderboard |
| GET | `/api/analytics/leaderboard/:courseId` | Course leaderboard |
| GET | `/api/analytics/rank/:userId` | User rank |

---

## Database Schema

### New Tables

```sql
-- Quizzes
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  module_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  quiz_type VARCHAR(50) DEFAULT 'graded',
  time_limit_minutes INTEGER,
  passing_score INTEGER,
  max_attempts INTEGER,
  shuffle_questions BOOLEAN DEFAULT FALSE,
  shuffle_options BOOLEAN DEFAULT FALSE,
  show_correct_answers VARCHAR(50) DEFAULT 'after_submission',
  show_feedback VARCHAR(50) DEFAULT 'after_submission',
  question_pool_config JSONB,
  total_points INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  late_submission_policy VARCHAR(50),
  late_penalty_percent INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Questions
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id),
  pool_id UUID,
  type VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  options JSONB,
  correct_answer JSONB,
  answer_tolerance DECIMAL,
  case_sensitive BOOLEAN DEFAULT FALSE,
  partial_credit BOOLEAN DEFAULT FALSE,
  hint TEXT,
  media JSONB,
  tags TEXT[],
  difficulty VARCHAR(20),
  "order" INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Question Pools
CREATE TABLE question_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tags TEXT[],
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Attempts
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id),
  user_id UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  score DECIMAL,
  percentage DECIMAL,
  passed BOOLEAN,
  answers JSONB DEFAULT '[]',
  feedback TEXT,
  graded_by UUID,
  graded_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'in_progress',
  attempt_number INTEGER DEFAULT 1
);

-- Attempt Questions (snapshot)
CREATE TABLE attempt_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES quiz_attempts(id),
  questions JSONB NOT NULL
);

-- Learning Paths
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  estimated_hours INTEGER,
  difficulty VARCHAR(20),
  tags TEXT[],
  badge_id UUID,
  certificate_template_id UUID,
  is_published BOOLEAN DEFAULT FALSE,
  enrollment_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Path Courses
CREATE TABLE learning_path_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id),
  "order" INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  unlock_after_days INTEGER,
  prerequisites UUID[]
);

-- Learning Path Milestones
CREATE TABLE learning_path_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  course_ids UUID[] NOT NULL,
  badge_id UUID,
  points INTEGER,
  "order" INTEGER NOT NULL
);

-- Learning Path Enrollments
CREATE TABLE learning_path_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  learning_path_id UUID REFERENCES learning_paths(id),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress_percentage INTEGER DEFAULT 0,
  current_course_id UUID,
  completed_courses UUID[] DEFAULT '{}',
  earned_milestones UUID[] DEFAULT '{}',
  earned_badges UUID[] DEFAULT '{}',
  certificate_id UUID,
  status VARCHAR(50) DEFAULT 'enrolled',
  UNIQUE(user_id, learning_path_id)
);

-- Badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  criteria TEXT,
  points INTEGER DEFAULT 0,
  rarity VARCHAR(20) DEFAULT 'common',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  badge_id UUID REFERENCES badges(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  learning_path_id UUID,
  milestone_id UUID,
  course_id UUID,
  UNIQUE(user_id, badge_id)
);

-- Certificates
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  learning_path_id UUID,
  course_id UUID,
  title VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  completion_date TIMESTAMPTZ NOT NULL,
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  pdf_url TEXT,
  verification_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Prerequisites
CREATE TABLE course_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  prerequisite_course_id UUID REFERENCES courses(id),
  is_required BOOLEAN DEFAULT TRUE,
  minimum_score INTEGER
);

-- Learning Activities
CREATE TABLE learning_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  course_id UUID REFERENCES courses(id),
  activity_type VARCHAR(50) NOT NULL,
  content_id UUID,
  content_type VARCHAR(50),
  duration_seconds INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Stats (materialized for leaderboards)
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  total_points INTEGER DEFAULT 0,
  badges_count INTEGER DEFAULT 0,
  courses_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_pool ON quiz_questions(pool_id);
CREATE INDEX idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX idx_lp_courses_path ON learning_path_courses(learning_path_id);
CREATE INDEX idx_lp_enrollments_user ON learning_path_enrollments(user_id);
CREATE INDEX idx_learning_activities_user_course ON learning_activities(user_id, course_id);
CREATE INDEX idx_learning_activities_created ON learning_activities(created_at);
CREATE INDEX idx_user_stats_points ON user_stats(total_points DESC);
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-01-12 | Quiz engine, learning paths, student analytics |
| 1.0.0 | Initial | Courses, assignments, discussions, live sessions |
