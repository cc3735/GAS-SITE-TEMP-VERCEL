import { Link } from 'react-router-dom';
import { BookOpen, Users, BarChart3, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    slug: 'courses',
    label: 'Course Creation',
    description: 'Create and manage your own courses with modules, lessons, and quizzes.',
    icon: BookOpen,
    color: 'bg-indigo-50',
    textColor: 'text-indigo-600',
  },
  {
    slug: 'students',
    label: 'Student Management',
    description: 'Track enrollments, progress, completions, and student analytics.',
    icon: Users,
    color: 'bg-green-50',
    textColor: 'text-green-600',
  },
  {
    slug: 'analytics',
    label: 'Course Analytics',
    description: 'View engagement metrics, completion rates, and revenue reports.',
    icon: BarChart3,
    color: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
] as const;

export default function CourseFlowHub() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">CourseFlow</h1>
        <p className="mt-1 text-sm text-slate-500">
          Build and sell your own online courses. Create content, manage students, and track performance.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map(({ slug, label, description, icon: Icon, color, textColor }) => (
          <Link key={slug} to={`/portal/courseflow/${slug}`}
            className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${textColor}`} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900">{label}</h2>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
            <div className={`flex items-center gap-1.5 text-sm font-medium ${textColor}`}>
              Open <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
