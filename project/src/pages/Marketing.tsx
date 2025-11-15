import { Mail } from 'lucide-react';

export default function Marketing() {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Marketing</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-600">Marketing automation coming soon</p>
      </div>
    </div>
  );
}
