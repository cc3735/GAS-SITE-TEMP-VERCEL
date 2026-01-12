/**
 * Quiz Engine Service
 *
 * Comprehensive quiz and assessment system including:
 * - Multiple question types (MCQ, short answer, matching, drag-drop, fill-in)
 * - Timed assessments
 * - Question pools and randomization
 * - Auto-grading with feedback
 * - Attempt tracking and analytics
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

// Types
export type QuestionType =
  | 'multiple_choice'
  | 'multiple_select'
  | 'true_false'
  | 'short_answer'
  | 'long_answer'
  | 'matching'
  | 'ordering'
  | 'fill_in_blank'
  | 'numeric';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
  feedback?: string;
  matchPair?: string; // For matching questions
  order?: number; // For ordering questions
}

export interface Question {
  id: string;
  quiz_id?: string;
  pool_id?: string;
  type: QuestionType;
  text: string;
  explanation?: string;
  points: number;
  options?: QuestionOption[];
  correctAnswer?: string | string[] | number; // For short answer, numeric
  answerTolerance?: number; // For numeric answers
  caseSensitive?: boolean;
  partialCredit?: boolean;
  hint?: string;
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    caption?: string;
  };
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  created_at: Date;
  updated_at: Date;
}

export interface QuestionPool {
  id: string;
  course_id: string;
  name: string;
  description?: string;
  tags?: string[];
  question_count?: number;
  created_at: Date;
}

export interface Quiz {
  id: string;
  course_id: string;
  module_id?: string;
  title: string;
  description?: string;
  instructions?: string;
  quiz_type: 'practice' | 'graded' | 'survey';
  time_limit_minutes?: number;
  passing_score?: number; // Percentage
  max_attempts?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_correct_answers?: 'never' | 'after_submission' | 'after_due_date';
  show_feedback?: 'never' | 'after_each_question' | 'after_submission';
  questions?: Question[];
  question_pool_config?: {
    pool_id: string;
    count: number;
    tags?: string[];
    difficulty?: Question['difficulty'];
  }[];
  total_points?: number;
  is_published: boolean;
  available_from?: Date;
  available_until?: Date;
  due_date?: Date;
  late_submission_policy?: 'none' | 'penalty' | 'allow';
  late_penalty_percent?: number;
  created_at: Date;
  updated_at: Date;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  started_at: Date;
  submitted_at?: Date;
  time_spent_seconds?: number;
  score?: number;
  percentage?: number;
  passed?: boolean;
  answers: QuizAnswer[];
  feedback?: string;
  graded_by?: string;
  graded_at?: Date;
  status: 'in_progress' | 'submitted' | 'graded';
  attempt_number: number;
}

export interface QuizAnswer {
  question_id: string;
  answer: string | string[] | number;
  is_correct?: boolean;
  points_earned?: number;
  feedback?: string;
  answered_at?: Date;
}

export interface QuizStats {
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  averageTimeSpent: number;
  questionStats: {
    question_id: string;
    correctRate: number;
    averageTimeSpent: number;
  }[];
}

export class QuizEngineService {
  // ==================== QUIZ CRUD ====================

  async createQuiz(data: Partial<Quiz>): Promise<Quiz> {
    const quiz: Partial<Quiz> = {
      ...data,
      quiz_type: data.quiz_type || 'graded',
      is_published: false,
      shuffle_questions: data.shuffle_questions ?? false,
      shuffle_options: data.shuffle_options ?? false,
      show_correct_answers: data.show_correct_answers || 'after_submission',
      show_feedback: data.show_feedback || 'after_submission',
      total_points: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const { data: result, error } = await supabase
      .from('quizzes')
      .insert(quiz)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async getQuiz(id: string): Promise<Quiz | null> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*, questions(*)')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async listQuizzes(courseId: string): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateQuiz(id: string, data: Partial<Quiz>): Promise<Quiz> {
    const { data: result, error } = await supabase
      .from('quizzes')
      .update({
        ...data,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async publishQuiz(id: string): Promise<Quiz> {
    const quiz = await this.getQuiz(id);
    if (!quiz) throw new Error('Quiz not found');

    // Validate quiz has questions
    const questionCount = quiz.questions?.length || 0;
    const poolCount = quiz.question_pool_config?.reduce((sum, p) => sum + p.count, 0) || 0;

    if (questionCount === 0 && poolCount === 0) {
      throw new Error('Quiz must have at least one question');
    }

    return this.updateQuiz(id, { is_published: true });
  }

  async deleteQuiz(id: string): Promise<void> {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==================== QUESTIONS ====================

  async addQuestion(quizId: string, data: Partial<Question>): Promise<Question> {
    const question: Partial<Question> = {
      ...data,
      quiz_id: quizId,
      points: data.points || 1,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Generate unique IDs for options
    if (question.options) {
      question.options = question.options.map((opt, idx) => ({
        ...opt,
        id: opt.id || `opt-${Date.now()}-${idx}`
      }));
    }

    const { data: result, error } = await supabase
      .from('quiz_questions')
      .insert(question)
      .select()
      .single();

    if (error) throw error;

    // Update quiz total points
    await this.recalculateTotalPoints(quizId);

    return result;
  }

  async updateQuestion(questionId: string, data: Partial<Question>): Promise<Question> {
    const { data: result, error } = await supabase
      .from('quiz_questions')
      .update({
        ...data,
        updated_at: new Date()
      })
      .eq('id', questionId)
      .select()
      .single();

    if (error) throw error;

    // Update quiz total points if points changed
    if (data.points !== undefined && result.quiz_id) {
      await this.recalculateTotalPoints(result.quiz_id);
    }

    return result;
  }

  async deleteQuestion(questionId: string): Promise<void> {
    // Get question first to know quiz_id
    const { data: question } = await supabase
      .from('quiz_questions')
      .select('quiz_id')
      .eq('id', questionId)
      .single();

    const { error } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('id', questionId);

    if (error) throw error;

    // Update quiz total points
    if (question?.quiz_id) {
      await this.recalculateTotalPoints(question.quiz_id);
    }
  }

  async reorderQuestions(quizId: string, questionIds: string[]): Promise<void> {
    const updates = questionIds.map((id, index) => ({
      id,
      order: index + 1
    }));

    for (const update of updates) {
      await supabase
        .from('quiz_questions')
        .update({ order: update.order })
        .eq('id', update.id);
    }
  }

  private async recalculateTotalPoints(quizId: string): Promise<void> {
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('points')
      .eq('quiz_id', quizId);

    const totalPoints = questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0;

    await supabase
      .from('quizzes')
      .update({ total_points: totalPoints })
      .eq('id', quizId);
  }

  // ==================== QUESTION POOLS ====================

  async createQuestionPool(data: Partial<QuestionPool>): Promise<QuestionPool> {
    const pool: Partial<QuestionPool> = {
      ...data,
      question_count: 0,
      created_at: new Date()
    };

    const { data: result, error } = await supabase
      .from('question_pools')
      .insert(pool)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async addQuestionToPool(poolId: string, data: Partial<Question>): Promise<Question> {
    const question: Partial<Question> = {
      ...data,
      pool_id: poolId,
      points: data.points || 1,
      created_at: new Date(),
      updated_at: new Date()
    };

    const { data: result, error } = await supabase
      .from('quiz_questions')
      .insert(question)
      .select()
      .single();

    if (error) throw error;

    // Update pool question count
    await supabase.rpc('increment_pool_question_count', { p_id: poolId });

    return result;
  }

  async getRandomQuestionsFromPool(
    poolId: string,
    count: number,
    options?: {
      tags?: string[];
      difficulty?: Question['difficulty'];
      excludeIds?: string[];
    }
  ): Promise<Question[]> {
    let query = supabase
      .from('quiz_questions')
      .select('*')
      .eq('pool_id', poolId);

    if (options?.tags && options.tags.length > 0) {
      query = query.overlaps('tags', options.tags);
    }
    if (options?.difficulty) {
      query = query.eq('difficulty', options.difficulty);
    }
    if (options?.excludeIds && options.excludeIds.length > 0) {
      query = query.not('id', 'in', `(${options.excludeIds.join(',')})`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Shuffle and return requested count
    const shuffled = this.shuffleArray(data || []);
    return shuffled.slice(0, count);
  }

  // ==================== QUIZ ATTEMPTS ====================

  async startAttempt(quizId: string, userId: string): Promise<QuizAttempt> {
    const quiz = await this.getQuiz(quizId);
    if (!quiz) throw new Error('Quiz not found');

    // Check if quiz is available
    const now = new Date();
    if (quiz.available_from && new Date(quiz.available_from) > now) {
      throw new Error('Quiz is not yet available');
    }
    if (quiz.available_until && new Date(quiz.available_until) < now) {
      throw new Error('Quiz is no longer available');
    }

    // Check max attempts
    const { count: attemptCount } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId)
      .eq('user_id', userId);

    if (quiz.max_attempts && attemptCount && attemptCount >= quiz.max_attempts) {
      throw new Error('Maximum attempts reached');
    }

    // Check for existing in-progress attempt
    const { data: existingAttempt } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .single();

    if (existingAttempt) {
      return existingAttempt;
    }

    // Build questions for this attempt
    let questions = quiz.questions || [];

    // Add questions from pools
    if (quiz.question_pool_config && quiz.question_pool_config.length > 0) {
      for (const poolConfig of quiz.question_pool_config) {
        const poolQuestions = await this.getRandomQuestionsFromPool(
          poolConfig.pool_id,
          poolConfig.count,
          {
            tags: poolConfig.tags,
            difficulty: poolConfig.difficulty
          }
        );
        questions = [...questions, ...poolQuestions];
      }
    }

    // Shuffle questions if enabled
    if (quiz.shuffle_questions) {
      questions = this.shuffleArray(questions);
    }

    // Shuffle options if enabled
    if (quiz.shuffle_options) {
      questions = questions.map(q => ({
        ...q,
        options: q.options ? this.shuffleArray(q.options) : undefined
      }));
    }

    const attempt: Partial<QuizAttempt> = {
      quiz_id: quizId,
      user_id: userId,
      started_at: new Date(),
      status: 'in_progress',
      attempt_number: (attemptCount || 0) + 1,
      answers: []
    };

    const { data: result, error } = await supabase
      .from('quiz_attempts')
      .insert(attempt)
      .select()
      .single();

    if (error) throw error;

    // Store the questions for this attempt (snapshot)
    await supabase
      .from('attempt_questions')
      .insert({
        attempt_id: result.id,
        questions: questions
      });

    return result;
  }

  async getAttempt(attemptId: string): Promise<QuizAttempt | null> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*, quiz:quizzes(*)')
      .eq('id', attemptId)
      .single();

    if (error) return null;

    // Get questions for this attempt
    const { data: attemptQuestions } = await supabase
      .from('attempt_questions')
      .select('questions')
      .eq('attempt_id', attemptId)
      .single();

    return {
      ...data,
      questions: attemptQuestions?.questions
    };
  }

  async saveAnswer(
    attemptId: string,
    questionId: string,
    answer: string | string[] | number
  ): Promise<QuizAnswer> {
    const attempt = await this.getAttempt(attemptId);
    if (!attempt) throw new Error('Attempt not found');

    if (attempt.status !== 'in_progress') {
      throw new Error('Cannot modify submitted attempt');
    }

    const existingAnswerIndex = attempt.answers.findIndex(
      a => a.question_id === questionId
    );

    const newAnswer: QuizAnswer = {
      question_id: questionId,
      answer,
      answered_at: new Date()
    };

    let updatedAnswers: QuizAnswer[];
    if (existingAnswerIndex >= 0) {
      updatedAnswers = [...attempt.answers];
      updatedAnswers[existingAnswerIndex] = newAnswer;
    } else {
      updatedAnswers = [...attempt.answers, newAnswer];
    }

    await supabase
      .from('quiz_attempts')
      .update({ answers: updatedAnswers })
      .eq('id', attemptId);

    return newAnswer;
  }

  async submitAttempt(attemptId: string): Promise<QuizAttempt> {
    const attempt = await this.getAttempt(attemptId);
    if (!attempt) throw new Error('Attempt not found');

    if (attempt.status !== 'in_progress') {
      throw new Error('Attempt already submitted');
    }

    const quiz = await this.getQuiz(attempt.quiz_id);
    if (!quiz) throw new Error('Quiz not found');

    // Calculate time spent
    const timeSpent = Math.floor(
      (Date.now() - new Date(attempt.started_at).getTime()) / 1000
    );

    // Check time limit
    if (quiz.time_limit_minutes) {
      const maxTime = quiz.time_limit_minutes * 60;
      if (timeSpent > maxTime + 60) {
        // 1 minute grace period
        throw new Error('Time limit exceeded');
      }
    }

    // Get attempt questions
    const { data: attemptQuestions } = await supabase
      .from('attempt_questions')
      .select('questions')
      .eq('attempt_id', attemptId)
      .single();

    const questions: Question[] = attemptQuestions?.questions || [];

    // Grade the attempt
    const { gradedAnswers, score, percentage } = await this.gradeAttempt(
      attempt.answers,
      questions,
      quiz
    );

    // Check for late submission penalty
    let finalPercentage = percentage;
    if (quiz.due_date && new Date() > new Date(quiz.due_date)) {
      if (quiz.late_submission_policy === 'penalty' && quiz.late_penalty_percent) {
        finalPercentage = Math.max(0, percentage - quiz.late_penalty_percent);
      }
    }

    const passed = quiz.passing_score ? finalPercentage >= quiz.passing_score : true;

    const { data: result, error } = await supabase
      .from('quiz_attempts')
      .update({
        submitted_at: new Date(),
        time_spent_seconds: timeSpent,
        score,
        percentage: finalPercentage,
        passed,
        answers: gradedAnswers,
        status: 'graded'
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  private async gradeAttempt(
    answers: QuizAnswer[],
    questions: Question[],
    quiz: Quiz
  ): Promise<{ gradedAnswers: QuizAnswer[]; score: number; percentage: number }> {
    const gradedAnswers: QuizAnswer[] = [];
    let totalScore = 0;
    let totalPossible = 0;

    for (const question of questions) {
      totalPossible += question.points;
      const answer = answers.find(a => a.question_id === question.id);

      if (!answer) {
        gradedAnswers.push({
          question_id: question.id,
          answer: '',
          is_correct: false,
          points_earned: 0,
          feedback: quiz.show_feedback !== 'never' ? 'No answer provided' : undefined
        });
        continue;
      }

      const { isCorrect, pointsEarned, feedback } = this.gradeQuestion(
        question,
        answer.answer
      );

      totalScore += pointsEarned;

      gradedAnswers.push({
        ...answer,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        feedback: quiz.show_feedback !== 'never' ? feedback : undefined
      });
    }

    const percentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;

    return {
      gradedAnswers,
      score: totalScore,
      percentage: Math.round(percentage * 100) / 100
    };
  }

  private gradeQuestion(
    question: Question,
    answer: string | string[] | number
  ): { isCorrect: boolean; pointsEarned: number; feedback: string } {
    let isCorrect = false;
    let pointsEarned = 0;
    let feedback = '';

    switch (question.type) {
      case 'multiple_choice':
      case 'true_false': {
        const correctOption = question.options?.find(o => o.isCorrect);
        isCorrect = correctOption?.id === answer;
        pointsEarned = isCorrect ? question.points : 0;
        feedback = isCorrect
          ? 'Correct!'
          : correctOption?.feedback || question.explanation || 'Incorrect';
        break;
      }

      case 'multiple_select': {
        const correctIds = question.options
          ?.filter(o => o.isCorrect)
          .map(o => o.id) || [];
        const answerArray = Array.isArray(answer) ? answer : [answer];

        if (question.partialCredit) {
          const correctSelected = answerArray.filter(a => correctIds.includes(a)).length;
          const incorrectSelected = answerArray.filter(a => !correctIds.includes(a)).length;
          const ratio = (correctSelected - incorrectSelected) / correctIds.length;
          pointsEarned = Math.max(0, question.points * ratio);
          isCorrect = pointsEarned === question.points;
        } else {
          isCorrect =
            answerArray.length === correctIds.length &&
            answerArray.every(a => correctIds.includes(a));
          pointsEarned = isCorrect ? question.points : 0;
        }
        feedback = isCorrect ? 'Correct!' : question.explanation || 'Not all correct options selected';
        break;
      }

      case 'short_answer': {
        const correctAnswer = question.correctAnswer as string;
        const userAnswer = String(answer);
        isCorrect = question.caseSensitive
          ? userAnswer === correctAnswer
          : userAnswer.toLowerCase() === correctAnswer.toLowerCase();
        pointsEarned = isCorrect ? question.points : 0;
        feedback = isCorrect ? 'Correct!' : question.explanation || `Expected: ${correctAnswer}`;
        break;
      }

      case 'numeric': {
        const correctNum = question.correctAnswer as number;
        const userNum = Number(answer);
        const tolerance = question.answerTolerance || 0;
        isCorrect = Math.abs(userNum - correctNum) <= tolerance;
        pointsEarned = isCorrect ? question.points : 0;
        feedback = isCorrect ? 'Correct!' : question.explanation || `Expected: ${correctNum}`;
        break;
      }

      case 'matching': {
        const correctPairs = question.options?.reduce((acc, opt) => {
          if (opt.matchPair) acc[opt.id] = opt.matchPair;
          return acc;
        }, {} as Record<string, string>) || {};

        const answerPairs = typeof answer === 'string' ? JSON.parse(answer) : answer;
        let correctCount = 0;

        for (const [key, value] of Object.entries(answerPairs as Record<string, string>)) {
          if (correctPairs[key] === value) correctCount++;
        }

        const totalPairs = Object.keys(correctPairs).length;
        if (question.partialCredit) {
          pointsEarned = (correctCount / totalPairs) * question.points;
          isCorrect = correctCount === totalPairs;
        } else {
          isCorrect = correctCount === totalPairs;
          pointsEarned = isCorrect ? question.points : 0;
        }
        feedback = isCorrect ? 'All matched correctly!' : `${correctCount}/${totalPairs} correct`;
        break;
      }

      case 'ordering': {
        const correctOrder = question.options
          ?.sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(o => o.id) || [];
        const answerOrder = Array.isArray(answer) ? answer : JSON.parse(String(answer));

        isCorrect =
          answerOrder.length === correctOrder.length &&
          answerOrder.every((id: string, idx: number) => id === correctOrder[idx]);

        if (question.partialCredit && !isCorrect) {
          // Count correctly positioned items
          let correct = 0;
          for (let i = 0; i < answerOrder.length; i++) {
            if (answerOrder[i] === correctOrder[i]) correct++;
          }
          pointsEarned = (correct / correctOrder.length) * question.points;
        } else {
          pointsEarned = isCorrect ? question.points : 0;
        }
        feedback = isCorrect ? 'Correct order!' : question.explanation || 'Incorrect order';
        break;
      }

      case 'fill_in_blank': {
        // Answer format: { "blank1": "answer1", "blank2": "answer2" }
        const blanks = typeof answer === 'string' ? JSON.parse(answer) : answer;
        const correctBlanks = typeof question.correctAnswer === 'string'
          ? JSON.parse(question.correctAnswer)
          : question.correctAnswer;

        let correctCount = 0;
        const totalBlanks = Object.keys(correctBlanks as Record<string, string>).length;

        for (const [key, value] of Object.entries(blanks as Record<string, string>)) {
          const correct = (correctBlanks as Record<string, string>)[key];
          const match = question.caseSensitive
            ? value === correct
            : value.toLowerCase() === correct?.toLowerCase();
          if (match) correctCount++;
        }

        if (question.partialCredit) {
          pointsEarned = (correctCount / totalBlanks) * question.points;
          isCorrect = correctCount === totalBlanks;
        } else {
          isCorrect = correctCount === totalBlanks;
          pointsEarned = isCorrect ? question.points : 0;
        }
        feedback = isCorrect ? 'All blanks correct!' : `${correctCount}/${totalBlanks} correct`;
        break;
      }

      case 'long_answer':
        // Long answers require manual grading
        isCorrect = false;
        pointsEarned = 0;
        feedback = 'Pending manual review';
        break;
    }

    return { isCorrect, pointsEarned, feedback };
  }

  // ==================== ANALYTICS ====================

  async getQuizStats(quizId: string): Promise<QuizStats> {
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('status', 'graded');

    if (!attempts || attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        averageTimeSpent: 0,
        questionStats: []
      };
    }

    const totalAttempts = attempts.length;
    const averageScore =
      attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalAttempts;
    const passRate =
      (attempts.filter(a => a.passed).length / totalAttempts) * 100;
    const averageTimeSpent =
      attempts.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0) / totalAttempts;

    // Calculate per-question stats
    const questionStats: Map<string, { correct: number; total: number }> = new Map();

    for (const attempt of attempts) {
      for (const answer of attempt.answers) {
        const stats = questionStats.get(answer.question_id) || { correct: 0, total: 0 };
        stats.total++;
        if (answer.is_correct) stats.correct++;
        questionStats.set(answer.question_id, stats);
      }
    }

    return {
      totalAttempts,
      averageScore: Math.round(averageScore * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      averageTimeSpent: Math.round(averageTimeSpent),
      questionStats: Array.from(questionStats.entries()).map(([id, stats]) => ({
        question_id: id,
        correctRate: Math.round((stats.correct / stats.total) * 100 * 100) / 100,
        averageTimeSpent: 0 // Would need per-question timing to calculate
      }))
    };
  }

  async getUserAttempts(userId: string, quizId?: string): Promise<QuizAttempt[]> {
    let query = supabase
      .from('quiz_attempts')
      .select('*, quiz:quizzes(title, passing_score)')
      .eq('user_id', userId);

    if (quizId) {
      query = query.eq('quiz_id', quizId);
    }

    const { data, error } = await query.order('started_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getBestAttempt(userId: string, quizId: string): Promise<QuizAttempt | null> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .eq('status', 'graded')
      .order('percentage', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  }

  // ==================== UTILITIES ====================

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async getRemainingTime(attemptId: string): Promise<number | null> {
    const attempt = await this.getAttempt(attemptId);
    if (!attempt || attempt.status !== 'in_progress') return null;

    const quiz = await this.getQuiz(attempt.quiz_id);
    if (!quiz?.time_limit_minutes) return null;

    const elapsed = (Date.now() - new Date(attempt.started_at).getTime()) / 1000;
    const remaining = quiz.time_limit_minutes * 60 - elapsed;

    return Math.max(0, Math.floor(remaining));
  }

  async getQuizPreview(quizId: string): Promise<{
    title: string;
    description?: string;
    instructions?: string;
    questionCount: number;
    totalPoints: number;
    timeLimit?: number;
    passingScore?: number;
    maxAttempts?: number;
  }> {
    const quiz = await this.getQuiz(quizId);
    if (!quiz) throw new Error('Quiz not found');

    let questionCount = quiz.questions?.length || 0;
    if (quiz.question_pool_config) {
      questionCount += quiz.question_pool_config.reduce((sum, p) => sum + p.count, 0);
    }

    return {
      title: quiz.title,
      description: quiz.description,
      instructions: quiz.instructions,
      questionCount,
      totalPoints: quiz.total_points || 0,
      timeLimit: quiz.time_limit_minutes,
      passingScore: quiz.passing_score,
      maxAttempts: quiz.max_attempts
    };
  }
}

// Export singleton instance
export const quizEngineService = new QuizEngineService();

// Export convenience functions
export const createQuiz = (data: Partial<Quiz>) => quizEngineService.createQuiz(data);
export const getQuiz = (id: string) => quizEngineService.getQuiz(id);
export const addQuestion = (quizId: string, data: Partial<Question>) =>
  quizEngineService.addQuestion(quizId, data);
export const startAttempt = (quizId: string, userId: string) =>
  quizEngineService.startAttempt(quizId, userId);
export const submitAttempt = (attemptId: string) =>
  quizEngineService.submitAttempt(attemptId);
