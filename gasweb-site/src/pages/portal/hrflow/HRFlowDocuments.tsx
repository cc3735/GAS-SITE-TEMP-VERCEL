import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Upload, Search, Download, Trash2, Plus, X, Loader2 } from 'lucide-react';

interface HRDocument {
  id: string;
  name: string;
  category: string;
  uploaded_at: string;
  size: string;
}

const CATEGORIES = ['Employee Handbook', 'Policies', 'Offer Letters', 'Tax Forms', 'Benefits', 'Other'];

export default function HRFlowDocuments() {
  const [documents, setDocuments] = useState<HRDocument[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: '', category: 'Other' });

  const filtered = documents.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || d.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleUpload = () => {
    if (!uploadForm.name.trim()) return;
    setDocuments(prev => [...prev, {
      id: crypto.randomUUID(),
      name: uploadForm.name,
      category: uploadForm.category,
      uploaded_at: new Date().toISOString().split('T')[0],
      size: '—',
    }]);
    setUploadForm({ name: '', category: 'Other' });
    setShowUpload(false);
  };

  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div>
      <div className="mb-6">
        <Link to="/portal/hrflow" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> HRFlow
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Documents & Policies</h1>
            <p className="mt-1 text-sm text-slate-500">Store and manage HR documents, handbooks, and policies.</p>
          </div>
          <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition">
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Document List */}
      {filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {filtered.map(doc => (
            <div key={doc.id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                  <p className="text-xs text-slate-500">{doc.category} · Uploaded {doc.uploaded_at}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-slate-400 hover:text-primary-600"><Download className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(doc.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">{search || categoryFilter !== 'all' ? 'No documents match your filter.' : 'No documents yet. Upload your first HR document.'}</p>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Upload Document</h2>
              <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Document Name *</label>
                <input type="text" value={uploadForm.name} onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Employee Handbook 2026" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select value={uploadForm.category} onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Drag and drop or click to upload</p>
                <p className="text-xs text-slate-400 mt-1">PDF, DOCX, or TXT up to 10MB</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowUpload(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleUpload} disabled={!uploadForm.name.trim()}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
