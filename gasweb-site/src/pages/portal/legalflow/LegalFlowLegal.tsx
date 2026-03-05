import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  ScrollText,
  FileCheck,
  FileText,
  Scale,
  Plus,
  Search,
  Clock,
  CheckCircle,
  ArrowRight,
  Loader2,
  Trash2,
} from 'lucide-react';
import legalFlowApi, {
  type LegalDocument,
  type LegalTemplate,
} from '../../../lib/legalFlowApi';

const CATEGORIES = [
  {
    id: 'business',
    name: 'Business Formation',
    icon: Building,
    description: 'LLC, Corporation, DBA',
    color: 'bg-blue-50',
    textColor: 'text-blue-600',
    fallbackTemplates: ['LLC Formation', 'Corporation', 'DBA Registration', 'Partnership Agreement'],
  },
  {
    id: 'estate_planning',
    name: 'Estate Planning',
    icon: ScrollText,
    description: 'Wills, Trusts, POA',
    color: 'bg-purple-50',
    textColor: 'text-purple-600',
    fallbackTemplates: ['Last Will & Testament', 'Living Trust', 'Power of Attorney', 'Living Will'],
  },
  {
    id: 'contract',
    name: 'Contracts',
    icon: FileCheck,
    description: 'NDAs, Agreements',
    color: 'bg-green-50',
    textColor: 'text-green-600',
    fallbackTemplates: ['NDA', 'Employment Agreement', 'Contractor Agreement', 'Service Agreement'],
  },
  {
    id: 'personal',
    name: 'Personal Legal',
    icon: FileText,
    description: 'Name Change, Affidavits',
    color: 'bg-orange-50',
    textColor: 'text-orange-600',
    fallbackTemplates: ['Name Change Petition', 'Affidavit', 'Bill of Sale', 'Promissory Note'],
  },
];

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'text-slate-700', bg: 'bg-slate-100', icon: FileText },
  generated: { label: 'Generated', color: 'text-blue-700', bg: 'bg-blue-100', icon: Clock },
  signed: { label: 'Signed', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  filed: { label: 'Filed', color: 'text-purple-700', bg: 'bg-purple-100', icon: CheckCircle },
};

export default function LegalFlowLegal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [templates, setTemplates] = useState<LegalTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      legalFlowApi.documents.list(),
      legalFlowApi.templates.list(),
    ]).then(([docRes, tmplRes]) => {
      if (docRes.success && docRes.data) setDocuments(docRes.data.documents ?? []);
      if (tmplRes.success && tmplRes.data) setTemplates(tmplRes.data.templates ?? []);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const getTemplatesForCategory = (categoryId: string) => {
    const fromApi = templates.filter(
      (t) => t.category?.toLowerCase() === categoryId,
    );
    if (fromApi.length > 0) return fromApi.map((t) => t.name);
    return CATEGORIES.find((c) => c.id === categoryId)?.fallbackTemplates ?? [];
  };

  const handleCategoryClick = async (categoryId: string) => {
    const categoryTemplates = templates.filter(
      (t) => t.category?.toLowerCase() === categoryId,
    );
    if (categoryTemplates.length > 0) {
      // Use first template to create a document
      const tmpl = categoryTemplates[0];
      setCreating(true);
      const res = await legalFlowApi.documents.create({
        documentType: tmpl.name.toLowerCase().replace(/\s+/g, '_'),
        documentCategory: categoryId,
        title: `New ${tmpl.name}`,
        templateId: tmpl.id,
      });
      setCreating(false);
      if (res.success && res.data) {
        // Re-fetch documents
        const docRes = await legalFlowApi.documents.list();
        if (docRes.success && docRes.data) setDocuments(docRes.data.documents ?? []);
      } else {
        alert(res.error?.message ?? 'Could not create document. Make sure the LegalFlow backend is running.');
      }
    } else {
      alert(`AI-powered ${CATEGORIES.find((c) => c.id === categoryId)?.name} document creation coming soon.`);
    }
  };

  const handleNewDocument = async () => {
    if (templates.length > 0) {
      const tmpl = templates[0];
      setCreating(true);
      const res = await legalFlowApi.documents.create({
        documentType: tmpl.name.toLowerCase().replace(/\s+/g, '_'),
        documentCategory: tmpl.category || 'general',
        title: `New ${tmpl.name}`,
        templateId: tmpl.id,
      });
      setCreating(false);
      if (res.success && res.data) {
        const docRes = await legalFlowApi.documents.list();
        if (docRes.success && docRes.data) setDocuments(docRes.data.documents ?? []);
      } else {
        alert(res.error?.message ?? 'Could not create document. Make sure the LegalFlow backend is running.');
      }
    } else {
      alert('AI document creation coming soon.');
    }
  };

  const filteredDocs = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.documentType.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          to="/portal/legalflow"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          LegalFlow
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-900">Legal Documents</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Legal Documents</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, manage, and sign legal documents with AI assistance.
          </p>
        </div>
        <button
          onClick={handleNewDocument}
          disabled={creating}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          New Document
        </button>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const catTemplates = getTemplatesForCategory(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              disabled={creating}
              className="bg-white rounded-2xl border border-slate-200 p-6 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group disabled:opacity-50"
            >
              <div
                className={`w-10 h-10 ${cat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
              >
                <Icon className={`w-5 h-5 ${cat.textColor}`} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{cat.name}</h3>
              <p className="text-sm text-slate-500 mb-3">{cat.description}</p>
              <div className="flex flex-wrap gap-1">
                {catTemplates.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                  >
                    {t}
                  </span>
                ))}
                {catTemplates.length > 2 && (
                  <span className="text-xs text-slate-400">
                    +{catTemplates.length - 2} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Documents list */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="border-b border-slate-200 p-4 flex items-center gap-4">
          <h2 className="font-semibold text-slate-900">Your Documents</h2>
          <div className="flex-1 max-w-sm ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredDocs.map((doc) => {
              const badge = STATUS_BADGE[doc.status] ?? STATUS_BADGE.draft;
              const BadgeIcon = badge.icon;
              const canDelete = doc.status !== 'signed' && doc.status !== 'filed';
              return (
                <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <Link
                    to={`/portal/legalflow/legal/${doc.id}`}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                      <Scale className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{doc.title}</p>
                      <p className="text-sm text-slate-500">
                        {doc.documentType.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.bg} ${badge.color}`}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      {badge.label}
                    </span>
                    {canDelete && (
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          if (!window.confirm(`Delete "${doc.title}"?`)) return;
                          const res = await legalFlowApi.documents.delete(doc.id);
                          if (res.success) {
                            setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
                          } else {
                            alert(res.error?.message ?? 'Failed to delete.');
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <Link to={`/portal/legalflow/legal/${doc.id}`}>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Scale className="mx-auto w-10 h-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">No Documents Yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Create your first legal document using our AI-powered templates.
            </p>
            <button
              onClick={handleNewDocument}
              disabled={creating}
              className="mt-5 btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Document
            </button>
          </div>
        )}
      </div>

      {/* AI Feature Banner */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50 p-6">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">AI-Powered Document Creation</h3>
            <p className="text-sm text-slate-500">
              Just describe what you need in plain English
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Try: "Create an NDA for my consulting business" or "I need a will leaving everything
          to my children"
        </p>
        <button
          onClick={handleNewDocument}
          disabled={creating}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          Try AI Document Creator
        </button>
      </div>
    </div>
  );
}
