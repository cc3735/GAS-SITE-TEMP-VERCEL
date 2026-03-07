import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, Users, BookOpen } from 'lucide-react';

export default function CourseFlowAnalytics() {
  return (
    <div>
      <div className="mb-6">
        <Link to="/portal/courseflow" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> CourseFlow
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Course Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">View engagement metrics, completion rates, and revenue.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <p className="text-sm text-slate-500">Total Courses</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">0</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-500" />
            <p className="text-sm text-slate-500">Total Enrollments</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">0</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <p className="text-sm text-slate-500">Completion Rate</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">—</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <p className="text-sm text-slate-500">Revenue</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">$0</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Analytics Coming Soon</h3>
        <p className="text-slate-500 text-sm">
          Detailed charts and reports will appear here once you have active courses with enrolled students.
        </p>
      </div>
    </div>
  );
}
