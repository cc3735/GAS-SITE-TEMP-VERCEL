import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Clock, Search, ChevronRight, Award, Crown, CheckCircle2, Filter,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { createStripeCheckout, type PurchaseRequest } from '../../lib/payment';
import {
  CATALOG,
  CATEGORIES,
  DIFFICULTIES,
  CATEGORY_COLORS,
  DIFFICULTY_COLORS,
  CATEGORY_GRADIENT,
  PRO_PRICE,
  type CatalogCourse,
} from '../../data/courseContent';

type TabKey = 'browse' | 'my';

export default function PortalCourses() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('browse');
  const [category, setCategory] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [isProSubscriber, setIsProSubscriber] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadUserData();
  }, [user]);

  async function loadUserData() {
    setIsLoading(true);
    const [enrollRes, purchaseRes, subRes] = await Promise.all([
      supabase
        .from('courseflow_enrollments')
        .select('course_id')
        .eq('user_id', user!.id)
        .eq('status', 'active'),
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
    setEnrolledIds(new Set((enrollRes.data ?? []).map((r) => r.course_id)));
    setPurchasedIds(new Set((purchaseRes.data ?? []).map((r) => r.course_id)));
    setIsProSubscriber((subRes.data?.length ?? 0) > 0);
    setIsLoading(false);
  }

  async function handleEnroll(courseId: string) {
    if (!user) return;
    setEnrolling(courseId);
    await supabase.from('courseflow_enrollments').insert({
      course_id: courseId,
      user_id: user.id,
      enrolled_by: user.id,
      status: 'active',
    });
    await loadUserData();
    setEnrolling(null);
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

  const filtered = CATALOG.filter((c) => {
    if (activeTab === 'my') return enrolledIds.has(c.id);
    const matchCat = category === 'all' || c.category === category;
    const matchDiff = difficulty === 'All' || c.difficulty === difficulty;
    const matchSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.certPrep.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchDiff && matchSearch;
  });

  const myCount = CATALOG.filter((c) => enrolledIds.has(c.id)).length;

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

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'browse' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Browse Courses
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'my' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Courses
            {myCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">{myCount}</span>
            )}
          </button>
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
            {activeTab === 'my' ? 'No enrolled courses yet' : 'No courses found'}
          </h3>
          <p className="text-slate-500 max-w-md mx-auto">
            {activeTab === 'my'
              ? 'Browse available courses and enroll to start learning.'
              : 'Try different filters or search terms.'}
          </p>
          {activeTab === 'my' && (
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
            const isPurchased = purchasedIds.has(course.id) || isProSubscriber;
            const isFree = course.coursePrice === 0;
            const canAccess = isFree || isPurchased;

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
                      Continue Learning <ChevronRight className="w-4 h-4" />
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
