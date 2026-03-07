import { Link } from 'react-router-dom';
import { Users, Clock, FileText, ArrowRight, LayoutGrid } from 'lucide-react';

const FEATURES = [
  {
    slug: 'employees',
    label: 'Employee Directory',
    description: 'Manage your team, roles, departments, and contact information.',
    icon: Users,
    color: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    slug: 'time-tracking',
    label: 'Time Tracking',
    description: 'Track hours, manage timesheets, and monitor attendance.',
    icon: Clock,
    color: 'bg-green-50',
    textColor: 'text-green-600',
  },
  {
    slug: 'documents',
    label: 'Documents & Policies',
    description: 'Store employee handbooks, policies, offer letters, and HR forms.',
    icon: FileText,
    color: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
] as const;

export default function HRFlowHub() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">HRFlow</h1>
        <p className="mt-1 text-sm text-slate-500">
          Human resources tools for managing your team. Select a section to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map(({ slug, label, description, icon: Icon, color, textColor }) => (
          <Link
            key={slug}
            to={`/portal/hrflow/${slug}`}
            className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
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
