import { Link } from 'react-router-dom';
import { Scale, BookOpen, Truck, Building2, Key, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const services = [
  {
    id: 'legalflow',
    name: 'LegalFlow',
    description: 'AI-powered legal documents, tax filing, and legal filing automation.',
    icon: Scale,
    color: 'bg-blue-600',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    url: 'http://localhost:5173',
    available: true,
  },
  {
    id: 'courseflow',
    name: 'CourseFlow',
    description: 'Create, manage, and sell online courses to your audience.',
    icon: BookOpen,
    color: 'bg-emerald-600',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    url: '#',
    available: false,
  },
  {
    id: 'foodtruck',
    name: 'FoodTruck',
    description: 'Ordering, scheduling, and operations for food truck businesses.',
    icon: Truck,
    color: 'bg-orange-600',
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    url: '#',
    available: false,
  },
  {
    id: 'construction',
    name: 'BuildFlow',
    description: 'Project management and client portal for construction businesses.',
    icon: Building2,
    color: 'bg-yellow-600',
    lightColor: 'bg-yellow-50',
    textColor: 'text-yellow-600',
    url: '#',
    available: false,
  },
  {
    id: 'realestate',
    name: 'KeysFlow',
    description: 'Real estate automation — listings, leads, and document workflows.',
    icon: Key,
    color: 'bg-purple-600',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    url: '#',
    available: false,
  },
];

export default function Portal() {
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.email || 'there';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="GAS" className="h-10 w-auto" />
          <span className="font-semibold text-slate-900 hidden sm:block">GAS Portal</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
            <User className="w-4 h-4" />
            <span>{user?.email}</span>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Welcome, {typeof displayName === 'string' ? displayName.split(' ')[0] : 'there'}</h1>
          <p className="mt-2 text-slate-600">Select a service to get started.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            const card = (
              <div
                className={`bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 transition-all duration-200 ${
                  service.available
                    ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <div className={`w-12 h-12 ${service.lightColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${service.textColor}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold text-slate-900">{service.name}</h2>
                    {!service.available && (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Coming soon</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{service.description}</p>
                </div>
                {service.available && (
                  <div className={`text-sm font-medium ${service.textColor} flex items-center gap-1`}>
                    Open app →
                  </div>
                )}
              </div>
            );

            return service.available ? (
              <a key={service.id} href={service.url} target="_blank" rel="noopener noreferrer">
                {card}
              </a>
            ) : (
              <div key={service.id}>{card}</div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
