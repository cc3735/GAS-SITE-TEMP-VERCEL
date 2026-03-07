import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen, Clock, Search, ChevronRight, Award, Crown, Filter,
  Play, Trophy, Route, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { enrollInCourse } from '../../lib/courseProgress';
import { createStripeCheckout, type PurchaseRequest } from '../../lib/payment';
import {
  CATALOG,
  CATALOG_MAP,
  CATEGORIES,
  DIFFICULTIES,
  CATEGORY_COLORS,
  DIFFICULTY_COLORS,
  CATEGORY_GRADIENT,
  LEARNING_PATHS,
  PRO_PRICE,
  type CatalogCourse,
} from '../../data/courseContent';

type TabKey = 'browse' | 'in-progress' | 'completed';

interface ProgressInfo {
  completed: number;
  total: number;
}

export default function PortalCourses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>('browse');
  const [category, setCategory] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [isProSubscriber, setIsProSubscriber] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, ProgressInfo>>({});

  useEffect(() => {
    if (!user) return;
    loadUserData();
  }, [user]);

  // Handle purchase success redirect
  useEffect(() => {
    if (!user) return;
    const purchaseSuccess = searchParams.get('purchase');
    const courseId = searchParams.get('course_id');
    if (purchaseSuccess === 'success' && courseId) {
      setSearchParams({});
      enrollInCourse(courseId, user.id).then(() => {
        loadUserData();
        navigate(`/portal/courses/${courseId}`);
      });
    }
  }, [user, searchParams]);

  async function loadUserData() {
    setIsLoading(true);
    const [progressRes, purchaseRes, subRes] = await Promise.all([
      supabase
        .from('education_progress')
        .select('course_id, status, progress')
        .eq('user_id', user!.id),
      supabase
        .from('course_purchases')
        .select('course_id')
        .eq('user_id', user!.id)
        .eq('payment_status', 'completed'),
      supabase
        .from('course_purchases')
        .select('id')
        .eq('user_id', user!.id)
        .eq('is_subscription', true)
        .eq('subscription_status', 'active')
        .limit(1),
    ]);

    const enrolled = new Set<string>();
    const completed = new Set<string>();
    const pMap: Record<string, ProgressInfo> = {};

    for (const row of progressRes.data ?? []) {
      enrolled.add(row.course_id);
      if (row.status === 'completed') {
        completed.add(row.course_id);
      }
      const p = row.progress as { completed_lessons?: string[]; total_lessons?: number } | null;
      if (p?.total_lessons) {
        pMap[row.course_id] = {
          completed: p.completed_lessons?.length ?? 0,
          total: p.total_lessons,
        };
      }
    }

    // Also load localStorage summaries for courses without DB progress yet
    enrolled.forEach((id) => {
      if (!pMap[id]) {
        try {
          const raw = localStorage.getItem(`gas_course_summary_${id}`);
          if (raw) pMap[id] = JSON.parse(raw);
        } catch { /* ignore */ }
      }
    });

    setEnrolledIds(enrolled);
    setCompletedIds(completed);
    setProgressMap(pMap);
    setPurchasedIds(new Set((purchaseRes.data ?? []).map((r) => r.course_id)));
    setIsProSubscriber((subRes.data?.length ?? 0) > 0);
    setIsLoading(false);
  }

  async function handleEnroll(courseId: string) {
    if (!user) return;
    setEnrolling(courseId);
    await enrollInCourse(courseId, user.id);
    await loadUserData();
    setEnrolling(null);
    navigate(`/portal/courses/${courseId}`);
  }

  async function handlePurchase(course: CatalogCourse) {
    if (!user) return;
    setPurchasing(course.id);
    const request: PurchaseRequest = {
      courseId: course.id,
      amount: course.coursePrice,
      currency: 'USD',
      userEmail: user.email || '',
      userId: user.id,
      paymentMethod: 'stripe',
    };
    const result = await createStripeCheckout(request);
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
    } else {
      alert(result.error || 'Payment service not available yet. Please try again later.');
      setPurchasing(null);
    }
  }

  async function handleProSubscribe() {
    if (!user) return;
    setPurchasing('pro');
    const request: PurchaseRequest = {
      courseId: 'pro-subscription',
      amount: PRO_PRICE,
      currency: 'USD',
      userEmail: user.email || '',
      userId: user.id,
      paymentMethod: 'stripe',
      isSubscription: true,
    };
    const result = await createStripeCheckout(request);
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
    } else {
      alert(result.error || 'Payment service not available yet. Please try again later.');
      setPurchasing('');
    }
  }

  const inProgressIds = new Set(
    [...enrolledIds].filter((id) => !completedIds.has(id))
  );

  const filtered = CATALOG.filter((c) => {
    if (activeTab === 'in-progress') return inProgressIds.has(c.id);
    if (activeTab === 'completed') return completedIds.has(c.id);
    const matchCat = category === 'all' || c.category === category;
    const matchDiff = difficulty === 'All' || c.difficulty === difficulty;
    const matchSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.certPrep.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchDiff && matchSearch;
  });

  const inProgressCount = inProgressIds.size;
  const completedCount = completedIds.size;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Education Hub</h1>
        <p className="text-slate-500 mt-1">
          Master AI, cybersecurity, and cloud computing. Prepare for industry certifications.
        </p>
      </div>

      {/* Pro Banner */}
      {!isProSubscriber && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">Pro Subscription</p>
              <p className="text-sm text-white/80">
                ${PRO_PRICE}/mo — Unlimited access to all courses & assessments
              </p>
            </div>
          </div>
          <button
            onClick={handleProSubscribe}
            disabled={purchasing === 'pro'}
            className="px-5 py-2 bg-white text-amber-700 text-sm font-semibold rounded-lg hover:bg-amber-50 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            {purchasing === 'pro' ? 'Processing...' : 'Subscribe to Pro'}
          </button>
        </div>
      )}

      {isProSubscriber && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Crown className="w-5 h-5 text-amber-600" />
          <p className="text-sm font-medium text-amber-800">
            Pro Subscriber — All courses and assessments are included in your plan.
          </p>
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          <TabButton active={activeTab === 'browse'} onClick={() => setActiveTab('browse')}>
            Browse Courses
          </TabButton>
          <TabButton active={activeTab === 'in-progress'} onClick={() => setActiveTab('in-progress')}>
            In Progress
            {inProgressCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">{inProgressCount}</span>
            )}
          </TabButton>
          <TabButton active={activeTab === 'completed'} onClick={() => setActiveTab('completed')}>
            Completed
            {completedCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{completedCount}</span>
            )}
          </TabButton>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses or certifications..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Filters (browse only) */}
      {activeTab === 'browse' && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  category === cat.key
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                  difficulty === d
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Learning Paths (browse tab, no search active) */}
      {activeTab === 'browse' && !search && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Route className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-slate-900">Learning Paths</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {LEARNING_PATHS.map((path) => {
              const pathCourses = path.courses.map((id) => CATALOG_MAP[id]).filter(Boolean);
              const pathCompletedCount = path.courses.filter((id) => completedIds.has(id)).length;
              const pathEnrolledCount = path.courses.filter((id) => enrolledIds.has(id)).length;
              const isStarted = pathEnrolledCount > 0;
              const isComplete = pathCompletedCount === path.courses.length;
              const nextCourseId = path.courses.find((id) => !completedIds.has(id));

              return (
                <div key={path.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className={`h-2 -mx-5 -mt-5 mb-4 rounded-t-xl bg-gradient-to-r ${CATEGORY_GRADIENT[path.category]}`} />
                  <h3 className="font-semibold text-slate-900 mb-1">{path.title}</h3>
                  <p className="text-sm text-slate-500 mb-4">{path.description}</p>

                  {/* Course steps */}
                  <div className="space-y-2 mb-4">
                    {pathCourses.map((course, idx) => {
                      const isDone = completedIds.has(course.id);
                      const isActive = enrolledIds.has(course.id) && !isDone;
                      return (
                        <div key={course.id} className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                            isDone
                              ? 'bg-green-500 text-white'
                              : isActive
                                ? 'bg-primary-500 text-white'
                                : 'bg-slate-200 text-slate-500'
                          }`}>
                            {isDone ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                          </div>
                          <Link
                            to={`/portal/courses/${course.id}`}
                            className="text-sm text-slate-700 hover:text-primary-600 truncate transition-colors"
                          >
                            {course.title}
                          </Link>
                          {course.coursePrice === 0 && (
                            <span className="text-xs text-green-600 font-medium flex-shrink-0">Free</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-400">
                      {isComplete ? (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <Trophy className="w-3.5 h-3.5" /> Completed
                        </span>
                      ) : (
                        <span>{pathCompletedCount}/{path.courses.length} courses · ~{path.estimatedWeeks} weeks</span>
                      )}
                    </div>
                    {!isComplete && nextCourseId && (
                      <Link
                        to={`/portal/courses/${nextCourseId}`}
                        className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        {isStarted ? 'Continue' : 'Start Path'}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Loading courses...</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {activeTab === 'in-progress' ? 'No courses in progress' : activeTab === 'completed' ? 'No completed courses yet' : 'No courses found'}
          </h3>
          <p className="text-slate-500 max-w-md mx-auto">
            {activeTab === 'in-progress'
              ? 'Enroll in a course to start learning.'
              : activeTab === 'completed'
                ? 'Complete your enrolled courses to see them here.'
                : 'Try different filters or search terms.'}
          </p>
          {activeTab !== 'browse' && (
            <button onClick={() => setActiveTab('browse')} className="mt-4 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
              Browse Courses
            </button>
          )}
        </div>
      )}

      {/* Course Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => {
            const isEnrolled = enrolledIds.has(course.id);
            const isCompleted = completedIds.has(course.id);
            const isPurchased = purchasedIds.has(course.id) || isProSubscriber;
            const isFree = course.coursePrice === 0;
            const canAccess = isFree || isPurchased;
            const progress = progressMap[course.id];
            const pct = progress && progress.total > 0
              ? Math.round((progress.completed / progress.total) * 100)
              : 0;

            return (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                <div className={`h-3 bg-gradient-to-r ${CATEGORY_GRADIENT[course.category]}`} />

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${CATEGORY_COLORS[course.category]}`}>
                      {course.category === 'ai' ? 'AI & Automation' : course.category === 'security' ? 'Cybersecurity' : 'Cloud & IT'}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${DIFFICULTY_COLORS[course.difficulty]}`}>
                      {course.difficulty}
                    </span>
                    {isCompleted && (
                      <span className="ml-auto flex items-center gap-1 text-xs font-medium text-green-600">
                        <Trophy className="w-3 h-3" /> Done
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2 flex-1">{course.description}</p>

                  <div className="flex items-center gap-1.5 mb-3 py-2 px-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <Award className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-xs text-amber-800">
                      <span className="font-medium">Prepares for:</span> {course.certPrep}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />{course.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />{course.topics.length} modules
                    </span>
                  </div>

                  {/* Progress bar for enrolled courses */}
                  {isEnrolled && progress && progress.total > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{progress.completed}/{progress.total} lessons</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-primary-600'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4 text-sm">
                    {isFree ? (
                      <span className="font-semibold text-green-600">Free Course</span>
                    ) : isProSubscriber ? (
                      <span className="flex items-center gap-1 font-medium text-amber-700">
                        <Crown className="w-3.5 h-3.5" />Included with Pro
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-900">${course.coursePrice}</span>
                    )}
                    <span className="text-slate-300">|</span>
                    {isProSubscriber ? (
                      <span className="text-xs text-amber-600">Assessment included</span>
                    ) : (
                      <span className="text-xs text-slate-500">Assessment: ${course.assessmentPrice}</span>
                    )}
                  </div>

                  {isEnrolled ? (
                    <Link
                      to={`/portal/courses/${course.id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-700 text-sm font-medium rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      {isCompleted ? (
                        <>Review Course <ChevronRight className="w-4 h-4" /></>
                      ) : (
                        <>Continue Learning <Play className="w-4 h-4" /></>
                      )}
                    </Link>
                  ) : canAccess ? (
                    <button
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrolling === course.id}
                      className="w-full px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                      {enrolling === course.id ? 'Enrolling...' : 'Enroll Now — Free'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchase(course)}
                      disabled={purchasing === course.id}
                      className="w-full px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                      {purchasing === course.id ? 'Processing...' : `Purchase Course — $${course.coursePrice}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  );
}
