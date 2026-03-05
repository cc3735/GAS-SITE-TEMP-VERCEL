import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Scale,
  Save,
  Trash2,
  Loader2,
  Clock,
  CheckCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import legalFlowApi, { type LegalDocument } from '../../../lib/legalFlowApi';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'generated', label: 'Generated' },
];

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'text-slate-700', bg: 'bg-slate-100', icon: FileText },
  generated: { label: 'Generated', color: 'text-blue-700', bg: 'bg-blue-100', icon: Clock },
  signed: { label: 'Signed', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  filed: { label: 'Filed', color: 'text-purple-700', bg: 'bg-purple-100', icon: CheckCircle },
};

export default function LegalFlowDocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('draft');

  useEffect(() => {
    if (!id) return;
    legalFlowApi.documents.get(id).then((res) => {
      if (res.success && res.data) {
        const doc = res.data as LegalDocument;
        setDocument(doc);
        setTitle(doc.title);
        setStatus(doc.status);
      } else {
        setError(res.error?.message ?? 'Document not found');
      }
      setIsLoading(false);
    }).catch(() => {
      setError('Failed to load document');
      setIsLoading(false);
    });
  }, [id]);

  const isLocked = document?.status === 'signed' || document?.status === 'filed';

  const handleSave = async () => {
    if (!id || isLocked) return;
    setIsSaving(true);
    setSaveMessage(null);
    const res = await legalFlowApi.documents.update(id, { title, status } as Partial<LegalDocument>);
    setIsSaving(false);
    if (res.success) {
      setSaveMessage('Document saved successfully.');
      // Update local state with response
      if (res.data) {
        setDocument((prev) => prev ? { ...prev, ...res.data } : prev);
      }
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage(res.error?.message ?? 'Failed to save.');
    }
  };

  const handleDelete = async () => {
    if (!id || isLocked) return;
    if (!window.confirm('Are you sure you want to delete this document? This cannot be undone.')) return;
    setIsDeleting(true);
    const res = await legalFlowApi.documents.delete(id);
    if (res.success) {
      navigate('/portal/legalflow/legal');
    } else {
      setIsDeleting(false);
      alert(res.error?.message ?? 'Failed to delete document.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Link
            to="/portal/legalflow/legal"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Legal Documents
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <AlertTriangle className="mx-auto w-10 h-10 text-slate-300" />
          <p className="mt-3 font-medium text-slate-700">Document Not Found</p>
          <p className="mt-1 text-sm text-slate-500">{error ?? 'This document may have been deleted.'}</p>
          <Link
            to="/portal/legalflow/legal"
            className="mt-5 inline-flex items-center gap-2 btn-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Documents
          </Link>
        </div>
      </div>
    );
  }

  const badge = STATUS_BADGE[document.status] ?? STATUS_BADGE.draft;
  const BadgeIcon = badge.icon;

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
        <Link
          to="/portal/legalflow/legal"
          className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          Legal Documents
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
          {document.title}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
            <Scale className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{document.title}</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {document.documentType.replace(/_/g, ' ')} &middot;{' '}
              {document.documentCategory.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${badge.bg} ${badge.color}`}
        >
          <BadgeIcon className="w-4 h-4" />
          {badge.label}
        </span>
      </div>

      {isLocked && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            This document has been {document.status} and cannot be edited or deleted.
          </p>
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Document Details</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="doc-title" className="block text-sm font-medium text-slate-700 mb-1">
              Title
            </label>
            <input
              id="doc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLocked}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="doc-status" className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                id="doc-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isLocked}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Document Type
              </label>
              <p className="px-4 py-2 text-sm text-slate-600 bg-slate-50 rounded-lg border border-slate-200">
                {document.documentType.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Created
              </label>
              <p className="px-4 py-2 text-sm text-slate-600 bg-slate-50 rounded-lg border border-slate-200">
                {new Date(document.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Last Updated
              </label>
              <p className="px-4 py-2 text-sm text-slate-600 bg-slate-50 rounded-lg border border-slate-200">
                {new Date(document.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleDelete}
          disabled={isLocked || isDeleting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Delete Document
        </button>

        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-sm text-slate-500">{saveMessage}</span>
          )}
          <button
            onClick={handleSave}
            disabled={isLocked || isSaving}
            className="inline-flex items-center gap-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
