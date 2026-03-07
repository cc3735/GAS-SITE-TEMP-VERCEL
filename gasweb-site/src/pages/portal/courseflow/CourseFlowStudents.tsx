import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Search, GraduationCap } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  enrolled_courses: number;
  completed: number;
  last_active: string;
}

export default function CourseFlowStudents() {
  const [students] = useState<Student[]>([]);
  const [search, setSearch] = useState('');

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <Link to="/portal/courseflow" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> CourseFlow
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Student Management</h1>
        <p className="mt-1 text-sm text-slate-500">Track enrollments, progress, and completions.</p>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Total Students</p>
          <p className="text-2xl font-bold text-slate-900">{students.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Active This Week</p>
          <p className="text-2xl font-bold text-slate-900">0</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Completions</p>
          <p className="text-2xl font-bold text-slate-900">0</p>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {filtered.map(student => (
            <div key={student.id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                  {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{student.name}</p>
                  <p className="text-xs text-slate-500">{student.email}</p>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {student.enrolled_courses} courses · {student.completed} completed
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No students enrolled yet. Students will appear here once they enroll in your courses.</p>
        </div>
      )}
    </div>
  );
}
