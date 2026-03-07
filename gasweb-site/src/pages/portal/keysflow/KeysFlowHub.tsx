import { Link } from 'react-router-dom';
import { Home, Users, FileText, Wrench, ArrowRight } from 'lucide-react';

const FEATURES = [
  { slug: 'properties', label: 'Properties', description: 'Manage property listings, details, and availability.', icon: Home, color: 'bg-blue-50', textColor: 'text-blue-600' },
  { slug: 'tenants', label: 'Tenants', description: 'Track tenant information, contacts, and history.', icon: Users, color: 'bg-green-50', textColor: 'text-green-600' },
  { slug: 'leases', label: 'Leases', description: 'Manage lease agreements, renewals, and rent schedules.', icon: FileText, color: 'bg-purple-50', textColor: 'text-purple-600' },
  { slug: 'maintenance', label: 'Maintenance', description: 'Handle maintenance requests, work orders, and vendor coordination.', icon: Wrench, color: 'bg-orange-50', textColor: 'text-orange-600' },
] as const;

export default function KeysFlowHub() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">KeysFlow</h1>
        <p className="mt-1 text-sm text-slate-500">Property management — listings, tenants, leases, and maintenance.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
        {FEATURES.map(({ slug, label, description, icon: Icon, color, textColor }) => (
          <Link key={slug} to={`/portal/keysflow/${slug}`}
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
