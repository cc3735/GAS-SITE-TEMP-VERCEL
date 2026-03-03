import { Share2 } from 'lucide-react';

export default function Social() {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Share2 className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Social Media</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-600">Social media management coming soon</p>
      </div>
    </div>
  );
}
