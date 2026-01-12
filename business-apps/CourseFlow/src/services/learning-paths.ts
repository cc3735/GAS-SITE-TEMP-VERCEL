/**
 * Learning Paths Service
 *
 * Learning path and progression management including:
 * - Course prerequisites and sequences
 * - Learning path creation and management
 * - Progress tracking through paths
 * - Completion certificates
 * - Badges and achievements
 * - Milestones and checkpoints
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { jsPDF } from 'jspdf';

const supabase = createClientComponentClient();

// Types
export interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  estimated_hours?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface LearningPath {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  estimated_hours?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  courses: LearningPathCourse[];
  milestones?: Milestone[];
  badge_id?: string;
  certificate_template_id?: string;
  is_published: boolean;
  enrollment_count?: number;
  completion_count?: number;
  created_at: Date;
  updated_at: Date;
}

export interface LearningPathCourse {
  id: string;
  course_id: string;
  course?: Course;
  order: number;
  is_required: boolean;
  unlock_after_days?: number; // Drip content
  prerequisites?: string[]; // Course IDs that must be completed first
}

export interface Milestone {
  id: string;
  learning_path_id: string;
  title: string;
  description?: string;
  course_ids: string[]; // Courses that must be completed
  badge_id?: string;
  points?: number;
  order: number;
}

export interface LearningPathEnrollment {
  id: string;
  user_id: string;
  learning_path_id: string;
  enrolled_at: Date;
  started_at?: Date;
  completed_at?: Date;
  progress_percentage: number;
  current_course_id?: string;
  completed_courses: string[];
  earned_milestones: string[];
  earned_badges: string[];
  certificate_id?: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'paused';
}

export interface Badge {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  image_url: string;
  criteria: string;
  points?: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  created_at: Date;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  badge?: Badge;
  earned_at: Date;
  learning_path_id?: string;
  milestone_id?: string;
  course_id?: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  learning_path_id?: string;
  course_id?: string;
  title: string;
  recipient_name: string;
  completion_date: Date;
  certificate_number: string;
  pdf_url?: string;
  verification_url?: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface CertificateTemplate {
  id: string;
  organization_id: string;
  name: string;
  type: 'path' | 'course';
  logo_url?: string;
  signature_url?: string;
  signer_name?: string;
  signer_title?: string;
  background_url?: string;
  accent_color?: string;
  text_template?: string;
  created_at: Date;
}

export interface CoursePrerequisite {
  course_id: string;
  prerequisite_course_id: string;
  is_required: boolean;
  minimum_score?: number;
}

export class LearningPathsService {
  // ==================== LEARNING PATH CRUD ====================

  async createLearningPath(data: Partial<LearningPath>): Promise<LearningPath> {
    const path: Partial<LearningPath> = {
      ...data,
      courses: data.courses || [],
      milestones: data.milestones || [],
      is_published: false,
      enrollment_count: 0,
      completion_count: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Calculate estimated hours from courses
    if (path.courses && path.courses.length > 0) {
      const courseIds = path.courses.map(c => c.course_id);
      const { data: courses } = await supabase
        .from('courses')
        .select('estimated_hours')
        .in('id', courseIds);

      path.estimated_hours = courses?.reduce(
        (sum, c) => sum + (c.estimated_hours || 0),
        0
      ) || 0;
    }

    const { data: result, error } = await supabase
      .from('learning_paths')
      .insert(path)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async getLearningPath(id: string): Promise<LearningPath | null> {
    const { data, error } = await supabase
      .from('learning_paths')
      .select(`
        *,
        courses:learning_path_courses(
          *,
          course:courses(*)
        ),
        milestones:learning_path_milestones(*),
        badge:badges(*)
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async listLearningPaths(
    organizationId: string,
    options?: {
      isPublished?: boolean;
      difficulty?: LearningPath['difficulty'];
      tags?: string[];
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ paths: LearningPath[]; total: number }> {
    let query = supabase
      .from('learning_paths')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId);

    if (options?.isPublished !== undefined) {
      query = query.eq('is_published', options.isPublished);
    }
    if (options?.difficulty) {
      query = query.eq('difficulty', options.difficulty);
    }
    if (options?.tags && options.tags.length > 0) {
      query = query.overlaps('tags', options.tags);
    }
    if (options?.search) {
      query = query.or(
        `title.ilike.%${options.search}%,description.ilike.%${options.search}%`
      );
    }

    query = query
      .order('created_at', { ascending: false })
      .range(
        options?.offset || 0,
        (options?.offset || 0) + (options?.limit || 20) - 1
      );

    const { data, error, count } = await query;
    if (error) throw error;

    return { paths: data || [], total: count || 0 };
  }

  async updateLearningPath(
    id: string,
    data: Partial<LearningPath>
  ): Promise<LearningPath> {
    const { data: result, error } = await supabase
      .from('learning_paths')
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

  async publishLearningPath(id: string): Promise<LearningPath> {
    const path = await this.getLearningPath(id);
    if (!path) throw new Error('Learning path not found');

    if (!path.courses || path.courses.length === 0) {
      throw new Error('Learning path must have at least one course');
    }

    return this.updateLearningPath(id, { is_published: true });
  }

  // ==================== PATH COURSES ====================

  async addCourseToPath(
    pathId: string,
    data: Partial<LearningPathCourse>
  ): Promise<LearningPathCourse> {
    // Get current max order
    const { data: existing } = await supabase
      .from('learning_path_courses')
      .select('order')
      .eq('learning_path_id', pathId)
      .order('order', { ascending: false })
      .limit(1);

    const maxOrder = existing?.[0]?.order || 0;

    const course: Partial<LearningPathCourse> & { learning_path_id: string } = {
      ...data,
      learning_path_id: pathId,
      order: data.order ?? maxOrder + 1,
      is_required: data.is_required ?? true
    };

    const { data: result, error } = await supabase
      .from('learning_path_courses')
      .insert(course)
      .select('*, course:courses(*)')
      .single();

    if (error) throw error;

    // Update path estimated hours
    await this.updatePathEstimatedHours(pathId);

    return result;
  }

  async removeCourseFromPath(pathId: string, courseId: string): Promise<void> {
    const { error } = await supabase
      .from('learning_path_courses')
      .delete()
      .eq('learning_path_id', pathId)
      .eq('course_id', courseId);

    if (error) throw error;

    await this.updatePathEstimatedHours(pathId);
  }

  async reorderPathCourses(
    pathId: string,
    courseIds: string[]
  ): Promise<void> {
    for (let i = 0; i < courseIds.length; i++) {
      await supabase
        .from('learning_path_courses')
        .update({ order: i + 1 })
        .eq('learning_path_id', pathId)
        .eq('course_id', courseIds[i]);
    }
  }

  private async updatePathEstimatedHours(pathId: string): Promise<void> {
    const { data: pathCourses } = await supabase
      .from('learning_path_courses')
      .select('course:courses(estimated_hours)')
      .eq('learning_path_id', pathId);

    const totalHours = pathCourses?.reduce(
      (sum, pc) => sum + ((pc.course as any)?.estimated_hours || 0),
      0
    ) || 0;

    await supabase
      .from('learning_paths')
      .update({ estimated_hours: totalHours })
      .eq('id', pathId);
  }

  // ==================== MILESTONES ====================

  async addMilestone(
    pathId: string,
    data: Partial<Milestone>
  ): Promise<Milestone> {
    const { data: existing } = await supabase
      .from('learning_path_milestones')
      .select('order')
      .eq('learning_path_id', pathId)
      .order('order', { ascending: false })
      .limit(1);

    const maxOrder = existing?.[0]?.order || 0;

    const milestone: Partial<Milestone> & { learning_path_id: string } = {
      ...data,
      learning_path_id: pathId,
      order: data.order ?? maxOrder + 1,
      course_ids: data.course_ids || []
    };

    const { data: result, error } = await supabase
      .from('learning_path_milestones')
      .insert(milestone)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async updateMilestone(
    milestoneId: string,
    data: Partial<Milestone>
  ): Promise<Milestone> {
    const { data: result, error } = await supabase
      .from('learning_path_milestones')
      .update(data)
      .eq('id', milestoneId)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async deleteMilestone(milestoneId: string): Promise<void> {
    const { error } = await supabase
      .from('learning_path_milestones')
      .delete()
      .eq('id', milestoneId);

    if (error) throw error;
  }

  // ==================== ENROLLMENT ====================

  async enrollInPath(
    userId: string,
    pathId: string
  ): Promise<LearningPathEnrollment> {
    // Check if already enrolled
    const { data: existing } = await supabase
      .from('learning_path_enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('learning_path_id', pathId)
      .single();

    if (existing) {
      return existing;
    }

    const path = await this.getLearningPath(pathId);
    if (!path) throw new Error('Learning path not found');

    if (!path.is_published) {
      throw new Error('Cannot enroll in unpublished path');
    }

    // Find first course
    const firstCourse = path.courses?.sort((a, b) => a.order - b.order)[0];

    const enrollment: Partial<LearningPathEnrollment> = {
      user_id: userId,
      learning_path_id: pathId,
      enrolled_at: new Date(),
      progress_percentage: 0,
      current_course_id: firstCourse?.course_id,
      completed_courses: [],
      earned_milestones: [],
      earned_badges: [],
      status: 'enrolled'
    };

    const { data: result, error } = await supabase
      .from('learning_path_enrollments')
      .insert(enrollment)
      .select()
      .single();

    if (error) throw error;

    // Update enrollment count
    await supabase.rpc('increment_path_enrollment_count', { path_id: pathId });

    // Also enroll in first course if not already enrolled
    if (firstCourse?.course_id) {
      await this.enrollInCourseIfNeeded(userId, firstCourse.course_id);
    }

    return result;
  }

  async getEnrollment(
    userId: string,
    pathId: string
  ): Promise<LearningPathEnrollment | null> {
    const { data, error } = await supabase
      .from('learning_path_enrollments')
      .select('*, learning_path:learning_paths(*)')
      .eq('user_id', userId)
      .eq('learning_path_id', pathId)
      .single();

    if (error) return null;
    return data;
  }

  async getUserEnrollments(userId: string): Promise<LearningPathEnrollment[]> {
    const { data, error } = await supabase
      .from('learning_path_enrollments')
      .select('*, learning_path:learning_paths(title, thumbnail_url)')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateEnrollmentProgress(
    enrollmentId: string,
    completedCourseId: string
  ): Promise<LearningPathEnrollment> {
    const { data: enrollment } = await supabase
      .from('learning_path_enrollments')
      .select('*, learning_path:learning_paths(*)')
      .eq('id', enrollmentId)
      .single();

    if (!enrollment) throw new Error('Enrollment not found');

    const path = await this.getLearningPath(enrollment.learning_path_id);
    if (!path) throw new Error('Learning path not found');

    // Add to completed courses
    const completedCourses = [...new Set([...enrollment.completed_courses, completedCourseId])];

    // Calculate progress
    const requiredCourses = path.courses?.filter(c => c.is_required) || [];
    const completedRequired = requiredCourses.filter(c =>
      completedCourses.includes(c.course_id)
    ).length;
    const progress = requiredCourses.length > 0
      ? (completedRequired / requiredCourses.length) * 100
      : 0;

    // Check milestones
    const earnedMilestones = [...enrollment.earned_milestones];
    const earnedBadges = [...enrollment.earned_badges];

    for (const milestone of path.milestones || []) {
      if (
        !earnedMilestones.includes(milestone.id) &&
        milestone.course_ids.every(id => completedCourses.includes(id))
      ) {
        earnedMilestones.push(milestone.id);

        // Award milestone badge if exists
        if (milestone.badge_id && !earnedBadges.includes(milestone.badge_id)) {
          earnedBadges.push(milestone.badge_id);
          await this.awardBadge(enrollment.user_id, milestone.badge_id, {
            learning_path_id: path.id,
            milestone_id: milestone.id
          });
        }
      }
    }

    // Find next course
    const sortedCourses = path.courses?.sort((a, b) => a.order - b.order) || [];
    const nextCourse = sortedCourses.find(c => !completedCourses.includes(c.course_id));

    // Check if path is completed
    const isCompleted = progress >= 100;
    let certificateId: string | undefined;

    if (isCompleted && !enrollment.certificate_id) {
      // Generate certificate
      const cert = await this.generateCertificate(enrollment.user_id, path.id);
      certificateId = cert.id;

      // Award path completion badge if exists
      if (path.badge_id && !earnedBadges.includes(path.badge_id)) {
        earnedBadges.push(path.badge_id);
        await this.awardBadge(enrollment.user_id, path.badge_id, {
          learning_path_id: path.id
        });
      }

      // Update completion count
      await supabase.rpc('increment_path_completion_count', { path_id: path.id });
    }

    const { data: result, error } = await supabase
      .from('learning_path_enrollments')
      .update({
        progress_percentage: Math.round(progress),
        completed_courses: completedCourses,
        earned_milestones: earnedMilestones,
        earned_badges: earnedBadges,
        current_course_id: nextCourse?.course_id,
        status: isCompleted ? 'completed' : 'in_progress',
        started_at: enrollment.started_at || new Date(),
        completed_at: isCompleted ? new Date() : undefined,
        certificate_id: certificateId || enrollment.certificate_id
      })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (error) throw error;

    // Enroll in next course if needed
    if (nextCourse?.course_id) {
      // Check drip content
      if (nextCourse.unlock_after_days) {
        const enrolledDate = new Date(enrollment.enrolled_at);
        const unlockDate = new Date(enrolledDate);
        unlockDate.setDate(unlockDate.getDate() + nextCourse.unlock_after_days);

        if (new Date() >= unlockDate) {
          await this.enrollInCourseIfNeeded(enrollment.user_id, nextCourse.course_id);
        }
      } else {
        await this.enrollInCourseIfNeeded(enrollment.user_id, nextCourse.course_id);
      }
    }

    return result;
  }

  private async enrollInCourseIfNeeded(
    userId: string,
    courseId: string
  ): Promise<void> {
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (!existing) {
      await supabase
        .from('enrollments')
        .insert({
          user_id: userId,
          course_id: courseId,
          enrolled_at: new Date()
        });
    }
  }

  // ==================== PREREQUISITES ====================

  async setCoursePrerequisites(
    courseId: string,
    prerequisites: CoursePrerequisite[]
  ): Promise<void> {
    // Delete existing prerequisites
    await supabase
      .from('course_prerequisites')
      .delete()
      .eq('course_id', courseId);

    // Insert new prerequisites
    if (prerequisites.length > 0) {
      const { error } = await supabase
        .from('course_prerequisites')
        .insert(prerequisites.map(p => ({ ...p, course_id: courseId })));

      if (error) throw error;
    }
  }

  async getCoursePrerequisites(courseId: string): Promise<CoursePrerequisite[]> {
    const { data, error } = await supabase
      .from('course_prerequisites')
      .select('*, prerequisite:courses!prerequisite_course_id(*)')
      .eq('course_id', courseId);

    if (error) throw error;
    return data || [];
  }

  async checkPrerequisitesMet(
    userId: string,
    courseId: string
  ): Promise<{
    met: boolean;
    missing: { course: Course; required: boolean; minimumScore?: number }[];
  }> {
    const prerequisites = await this.getCoursePrerequisites(courseId);

    if (prerequisites.length === 0) {
      return { met: true, missing: [] };
    }

    const missing: { course: Course; required: boolean; minimumScore?: number }[] = [];

    for (const prereq of prerequisites) {
      const { data: completion } = await supabase
        .from('course_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', prereq.prerequisite_course_id)
        .single();

      const isMet = completion && (
        !prereq.minimum_score ||
        (completion.final_score || 0) >= prereq.minimum_score
      );

      if (!isMet) {
        missing.push({
          course: (prereq as any).prerequisite,
          required: prereq.is_required,
          minimumScore: prereq.minimum_score
        });
      }
    }

    const requiredMissing = missing.filter(m => m.required);

    return {
      met: requiredMissing.length === 0,
      missing
    };
  }

  // ==================== BADGES ====================

  async createBadge(data: Partial<Badge>): Promise<Badge> {
    const badge: Partial<Badge> = {
      ...data,
      rarity: data.rarity || 'common',
      created_at: new Date()
    };

    const { data: result, error } = await supabase
      .from('badges')
      .insert(badge)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async getBadge(id: string): Promise<Badge | null> {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async listBadges(organizationId: string): Promise<Badge[]> {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('organization_id', organizationId)
      .order('rarity', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async awardBadge(
    userId: string,
    badgeId: string,
    context?: {
      learning_path_id?: string;
      milestone_id?: string;
      course_id?: string;
    }
  ): Promise<UserBadge> {
    // Check if already earned
    const { data: existing } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
      .single();

    if (existing) return existing;

    const { data: result, error } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId,
        earned_at: new Date(),
        ...context
      })
      .select('*, badge:badges(*)')
      .single();

    if (error) throw error;
    return result;
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const { data, error } = await supabase
      .from('user_badges')
      .select('*, badge:badges(*)')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ==================== CERTIFICATES ====================

  async createCertificateTemplate(
    data: Partial<CertificateTemplate>
  ): Promise<CertificateTemplate> {
    const template: Partial<CertificateTemplate> = {
      ...data,
      created_at: new Date()
    };

    const { data: result, error } = await supabase
      .from('certificate_templates')
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async generateCertificate(
    userId: string,
    pathId: string
  ): Promise<Certificate> {
    // Get user info
    const { data: user } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    const path = await this.getLearningPath(pathId);
    if (!path) throw new Error('Learning path not found');

    // Generate certificate number
    const certNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const certificate: Partial<Certificate> = {
      user_id: userId,
      learning_path_id: pathId,
      title: path.title,
      recipient_name: user?.full_name || 'Student',
      completion_date: new Date(),
      certificate_number: certNumber,
      verification_url: `/certificates/verify/${certNumber}`,
      created_at: new Date()
    };

    const { data: result, error } = await supabase
      .from('certificates')
      .insert(certificate)
      .select()
      .single();

    if (error) throw error;

    // Generate PDF (async, don't wait)
    this.generateCertificatePDF(result.id).catch(console.error);

    return result;
  }

  async generateCertificatePDF(certificateId: string): Promise<string> {
    const { data: cert } = await supabase
      .from('certificates')
      .select('*, learning_path:learning_paths(*)')
      .eq('id', certificateId)
      .single();

    if (!cert) throw new Error('Certificate not found');

    // Create PDF using jsPDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Set up certificate design
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Border
    doc.setDrawColor(0, 100, 150);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Title
    doc.setFontSize(36);
    doc.setTextColor(0, 80, 130);
    doc.text('Certificate of Completion', pageWidth / 2, 50, { align: 'center' });

    // Recipient
    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80);
    doc.text('This certifies that', pageWidth / 2, 75, { align: 'center' });

    doc.setFontSize(28);
    doc.setTextColor(0, 0, 0);
    doc.text(cert.recipient_name, pageWidth / 2, 90, { align: 'center' });

    // Course/Path
    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80);
    doc.text('has successfully completed', pageWidth / 2, 105, { align: 'center' });

    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text(cert.title, pageWidth / 2, 120, { align: 'center' });

    // Date
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    const completionDate = new Date(cert.completion_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Completed on ${completionDate}`, pageWidth / 2, 145, { align: 'center' });

    // Certificate number
    doc.setFontSize(10);
    doc.text(`Certificate #: ${cert.certificate_number}`, pageWidth / 2, 160, { align: 'center' });
    doc.text(`Verify at: ${cert.verification_url}`, pageWidth / 2, 168, { align: 'center' });

    // Convert to base64 and upload
    const pdfBase64 = doc.output('datauristring');
    const pdfBlob = doc.output('blob');

    // Upload to storage
    const { data: uploadResult, error: uploadError } = await supabase
      .storage
      .from('certificates')
      .upload(`${certificateId}.pdf`, pdfBlob, {
        contentType: 'application/pdf'
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('certificates')
      .getPublicUrl(`${certificateId}.pdf`);

    // Update certificate with PDF URL
    await supabase
      .from('certificates')
      .update({ pdf_url: urlData.publicUrl })
      .eq('id', certificateId);

    return urlData.publicUrl;
  }

  async getCertificate(id: string): Promise<Certificate | null> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*, learning_path:learning_paths(title)')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async verifyCertificate(certNumber: string): Promise<Certificate | null> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*, learning_path:learning_paths(title)')
      .eq('certificate_number', certNumber)
      .single();

    if (error) return null;
    return data;
  }

  async getUserCertificates(userId: string): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*, learning_path:learning_paths(title)')
      .eq('user_id', userId)
      .order('completion_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ==================== CONTENT DRIP ====================

  async getAvailableCourses(
    userId: string,
    pathId: string
  ): Promise<{
    available: LearningPathCourse[];
    locked: { course: LearningPathCourse; unlocksAt: Date }[];
  }> {
    const enrollment = await this.getEnrollment(userId, pathId);
    if (!enrollment) throw new Error('Not enrolled in this path');

    const path = await this.getLearningPath(pathId);
    if (!path) throw new Error('Path not found');

    const enrolledDate = new Date(enrollment.enrolled_at);
    const available: LearningPathCourse[] = [];
    const locked: { course: LearningPathCourse; unlocksAt: Date }[] = [];

    for (const course of path.courses || []) {
      // Check prerequisites
      if (course.prerequisites && course.prerequisites.length > 0) {
        const prereqsMet = course.prerequisites.every(
          prereqId => enrollment.completed_courses.includes(prereqId)
        );
        if (!prereqsMet) {
          // Calculate when it would unlock based on prereqs
          locked.push({
            course,
            unlocksAt: new Date() // Needs prereqs
          });
          continue;
        }
      }

      // Check drip unlock
      if (course.unlock_after_days) {
        const unlockDate = new Date(enrolledDate);
        unlockDate.setDate(unlockDate.getDate() + course.unlock_after_days);

        if (new Date() < unlockDate) {
          locked.push({ course, unlocksAt: unlockDate });
          continue;
        }
      }

      available.push(course);
    }

    return { available, locked };
  }
}

// Export singleton instance
export const learningPathsService = new LearningPathsService();

// Export convenience functions
export const createLearningPath = (data: Partial<LearningPath>) =>
  learningPathsService.createLearningPath(data);
export const getLearningPath = (id: string) =>
  learningPathsService.getLearningPath(id);
export const enrollInPath = (userId: string, pathId: string) =>
  learningPathsService.enrollInPath(userId, pathId);
export const awardBadge = (userId: string, badgeId: string, context?: any) =>
  learningPathsService.awardBadge(userId, badgeId, context);
