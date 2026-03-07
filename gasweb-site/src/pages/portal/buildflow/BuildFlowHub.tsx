import { Link } from 'react-router-dom';
import { Calculator, Package, HardHat, ClipboardCheck, ArrowRight } from 'lucide-react';

const FEATURES = [
  { slug: 'estimates', label: 'Estimates & Bids', description: 'Create project estimates, track bids, and manage proposals.', icon: Calculator, color: 'bg-amber-50', textColor: 'text-amber-600' },
  { slug: 'materials', label: 'Materials', description: 'Track building materials, costs, and supplier orders.', icon: Package, color: 'bg-blue-50', textColor: 'text-blue-600' },
  { slug: 'contractors', label: 'Contractors', description: 'Manage subcontractors, crews, and assignments.', icon: HardHat, color: 'bg-green-50', textColor: 'text-green-600' },
  { slug: 'permits', label: 'Permits & Inspections', description: 'Track permits, schedule inspections, and manage compliance.', icon: ClipboardCheck, color: 'bg-purple-50', textColor: 'text-purple-600' },
] as const;

export default function BuildFlowHub() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">BuildFlow</h1>
        <p className="mt-1 text-sm text-slate-500">Manage construction projects — estimates, materials, contractors, and permits.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
        {FEATURES.map(({ slug, label, description, icon: Icon, color, textColor }) => (
          <Link key={slug} to={`/portal/buildflow/${slug}`}
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
