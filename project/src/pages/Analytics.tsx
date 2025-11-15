import { BarChart3 } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-600">Analytics dashboard coming soon</p>
      </div>
    </div>
  );
}
