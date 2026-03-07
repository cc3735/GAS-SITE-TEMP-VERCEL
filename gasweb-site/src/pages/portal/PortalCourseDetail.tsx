import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Award, Clock, ChevronRight, Lock, Crown,
  ClipboardCheck, CheckCircle, BarChart3, Play,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { enrollInCourse, loadProgress } from '../../lib/courseProgress';
import { createStripeCheckout, type PurchaseRequest } from '../../lib/payment';
import {
  CATALOG_MAP, CATEGORY_GRADIENT,
  type FullCourse,
} from '../../data/courseContent';
import { loadCourse } from '../../data/courses';
import LessonViewer from '../../components/courses/LessonViewer';
import ModuleQuiz from '../../components/courses/ModuleQuiz';

const TABS = ['Overview', 'Lessons', 'Quizzes', 'Assessment'] as const;
type Tab = typeof TABS[number];

export default function PortalCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [courseContent, setCourseContent] = useState<FullCourse | null>(null);
  const [contentLoading, setContentLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [assessmentPurchased, setAssessmentPurchased] = useState(false);
  const [isProSubscriber, setIsProSubscriber] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const catalogInfo = courseId ? CATALOG_MAP[courseId] : null;

  // Load course content dynamically
  useEffect(() => {
    if (!courseId) return;
    setContentLoading(true);
    loadCourse(courseId)
      .then((content) => setCourseContent(content))
      .catch(() => setCourseContent(null))
      .finally(() => setContentLoading(false));
  }, [courseId]);

  // Load user enrollment/purchase data + hydrate progress from Supabase
  useEffect(() => {
    if (!user || !courseId) return;
    Promise.all([
      supabase
        .from('education_progress')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', user.id),
      supabase
        .from('course_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', `${courseId}-assessment`)
        .eq('payment_status', 'completed')
        .limit(1),
      supabase
        .from('course_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_subscription', true)
        .eq('subscription_status', 'active')
        .limit(1),
      loadProgress(courseId, user.id),
    ]).then(([enrollRes, purchaseRes, proRes]) => {
      setIsEnrolled((enrollRes.data?.length ?? 0) > 0);
      setAssessmentPurchased((purchaseRes.data?.length ?? 0) > 0);
      setIsProSubscriber((proRes.data?.length ?? 0) > 0);
    });
  }, [user, courseId]);

  async function handleEnroll() {
    if (!user || !courseId) return;
    setEnrolling(true);
    await enrollInCourse(courseId, user.id);
    setIsEnrolled(true);
    setEnrolling(false);
  }

  async function handlePurchaseAssessment() {
    if (!user || !courseId || !catalogInfo) return;
    setPurchasing(true);
    const request: PurchaseRequest = {
      courseId: `${courseId}-assessment`,
      amount: catalogInfo.assessmentPrice,
      currency: 'USD',
      userEmail: user.email || '',
      userId: user.id,
      paymentMethod: 'stripe',
    };
    const result = await createStripeCheckout(request);
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
    } else {
      alert(result.error || 'Payment service not available yet.');
      setPurchasing(false);
    }
  }

  // Loading states
  if (contentLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!catalogInfo || !courseContent) {
    return (
      <div className="p-6 text-center py-16">
        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Course not found</h3>
        <Link to="/portal/courses" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          Back to courses
        </Link>
      </div>
    );
  }

  const gradient = CATEGORY_GRADIENT[catalogInfo.category] || 'from-primary-500 to-secondary-500';
  const hasAssessmentAccess = assessmentPurchased || isProSubscriber;
  const isFree = catalogInfo.coursePrice === 0;
  const totalLessons = courseContent.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  // Get progress from localStorage
  let completedLessons = 0;
  try {
    const raw = localStorage.getItem(`gas_course_progress_${courseId}`);
    if (raw) completedLessons = JSON.parse(raw).length;
  } catch { /* ignore */ }
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back link */}
      <Link to="/portal/courses" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to courses
      </Link>

      {/* Certification banner */}
      <div className="flex items-center gap-3 mb-4 py-3 px-4 bg-amber-50 border border-amber-200 rounded-xl">
        <Award className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Certification Prep:</span> This course prepares you for the{' '}
          <span className="font-semibold">{catalogInfo.certPrep}</span> certification exam.
        </p>
      </div>

      {/* Course Header */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <div className={`h-40 bg-gradient-to-br ${gradient} relative flex items-center justify-center`}>
          <BookOpen className="w-16 h-16 text-white/40" />
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{catalogInfo.title}</h1>
              <p className="text-slate-500">{catalogInfo.description}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{catalogInfo.duration}</span>
                <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{totalLessons} lessons</span>
                <span className="flex items-center gap-1"><BarChart3 className="w-4 h-4" />{courseContent.modules.length} modules</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isProSubscriber && (
                <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 text-sm font-medium rounded-full">
                  <Crown className="w-3.5 h-3.5" /> Pro
                </span>
              )}
              {isEnrolled && (
                <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full">Enrolled</span>
              )}
            </div>
          </div>

          {/* Enroll button if not enrolled */}
          {!isEnrolled && (
            <div className="mt-4">
              {isFree || isProSubscriber ? (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {enrolling ? 'Enrolling...' : isFree ? 'Enroll Now — Free' : 'Enroll Now'}
                </button>
              ) : (
                <p className="text-sm text-slate-500">Purchase this course from the catalog to enroll.</p>
              )}
            </div>
          )}

          {/* Progress bar */}
          {isEnrolled && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600 font-medium">Progress</span>
                <span className="text-slate-500">{completedLessons}/{totalLessons} lessons completed</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab === 'Overview' && <BookOpen className="w-4 h-4" />}
            {tab === 'Lessons' && <Play className="w-4 h-4" />}
            {tab === 'Quizzes' && <CheckCircle className="w-4 h-4" />}
            {tab === 'Assessment' && <ClipboardCheck className="w-4 h-4" />}
            {tab}
            {tab === 'Assessment' && !hasAssessmentAccess && <Lock className="w-3 h-3 text-slate-400" />}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          {/* Instructor */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Instructor</h2>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary-600">
                  {courseContent.instructorName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <p className="font-medium text-slate-900">{courseContent.instructorName}</p>
                <p className="text-sm text-slate-500 mt-1">{courseContent.instructorBio}</p>
              </div>
            </div>
          </div>

          {/* Learning Outcomes */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">What You'll Learn</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {courseContent.learningOutcomes.map((outcome, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-700">{outcome}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Module list */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Course Curriculum</h2>
            <div className="space-y-3">
              {courseContent.modules.map((mod, mi) => (
                <div key={mod.id} className="border border-slate-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">Module {mi + 1}: {mod.title}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{mod.description}</p>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0 ml-3">
                      {mod.lessons.length} lessons · {mod.quiz.length} quiz questions
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mod.lessons.map((l) => (
                      <span key={l.id} className="text-xs px-2 py-1 bg-slate-50 text-slate-600 rounded">
                        {l.title}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certification Path */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Certification Path</h2>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{catalogInfo.certPrep}</p>
                <p className="text-sm text-slate-500 mt-1">
                  Complete all lessons and pass the assessment to validate your knowledge.
                  This course prepares you for the official {catalogInfo.certPrep} certification exam.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Lessons' && (
        isEnrolled ? (
          <LessonViewer course={courseContent} userId={user?.id} />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Enroll to access lessons</h3>
            <p className="text-slate-500 text-sm mb-4">
              {isFree ? 'This is a free course — enroll now to start learning.' : 'Purchase this course to access all lessons.'}
            </p>
            {(isFree || isProSubscriber) && (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {enrolling ? 'Enrolling...' : 'Enroll Now'}
              </button>
            )}
          </div>
        )
      )}

      {activeTab === 'Quizzes' && (
        isEnrolled ? (
          <ModuleQuiz courseId={courseId!} modules={courseContent.modules} userId={user?.id} />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Enroll to access quizzes</h3>
            <p className="text-slate-500 text-sm">Complete lessons and test your knowledge with module quizzes.</p>
          </div>
        )
      )}

      {activeTab === 'Assessment' && (
        hasAssessmentAccess ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Certification Assessment</h2>
                  <p className="text-sm text-slate-500">Validates your readiness for {catalogInfo.certPrep}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 space-y-2">
                <p>The assessment will be available once course content is published. It will include:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>Multiple choice and scenario-based questions</li>
                  <li>Timed exam simulation</li>
                  <li>Detailed score breakdown by topic area</li>
                  <li>Certificate of completion upon passing (80%+ score)</li>
                </ul>
              </div>
            </div>
            {isProSubscriber && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <Crown className="w-4 h-4 text-amber-600" />
                <p className="text-sm text-amber-800 font-medium">Included with your Pro subscription</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Assessment Locked</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-2">
              Purchase the assessment to test your knowledge and earn a certificate.
              This assessment prepares you for the {catalogInfo.certPrep} certification.
            </p>
            <p className="text-2xl font-bold text-slate-900 mb-4">${catalogInfo.assessmentPrice}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handlePurchaseAssessment}
                disabled={purchasing}
                className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {purchasing ? 'Processing...' : `Purchase Assessment — $${catalogInfo.assessmentPrice}`}
              </button>
              <p className="text-xs text-slate-400 self-center">
                Or subscribe to <span className="font-medium text-amber-600">Pro ($29/mo)</span> for unlimited access
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
