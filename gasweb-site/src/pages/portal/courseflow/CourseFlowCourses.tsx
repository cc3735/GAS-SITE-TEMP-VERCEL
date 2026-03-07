import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen, Search, X, Loader2, Eye, EyeOff } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  modules: number;
  students: number;
  created_at: string;
}

export default function CourseFlowCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = () => {
    if (!form.title.trim()) return;
    setCourses(prev => [...prev, {
      id: crypto.randomUUID(),
      title: form.title,
      description: form.description,
      status: 'draft',
      modules: 0,
      students: 0,
      created_at: new Date().toISOString().split('T')[0],
    }]);
    setForm({ title: '', description: '' });
    setShowCreate(false);
  };

  const togglePublish = (id: string) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'published' ? 'draft' : 'published' } : c));
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'published': return 'bg-green-50 text-green-700';
      case 'draft': return 'bg-slate-100 text-slate-600';
      case 'archived': return 'bg-orange-50 text-orange-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link to="/portal/courseflow" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> CourseFlow
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Course Creation</h1>
            <p className="mt-1 text-sm text-slate-500">Create and manage your online courses.</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition">
            <Plus className="w-4 h-4" /> New Course
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(course => (
            <div key={course.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{course.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{course.description || 'No description'}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded capitalize ${statusColor(course.status)}`}>{course.status}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{course.modules} modules · {course.students} students</span>
                <button onClick={() => togglePublish(course.id)} className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium">
                  {course.status === 'published' ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</> : <><Eye className="w-3.5 h-3.5" /> Publish</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No courses yet. Create your first course to get started.</p>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Create Course</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Course Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Introduction to Marketing" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none" placeholder="Describe what students will learn..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleCreate} disabled={!form.title.trim()}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">Create Course</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
