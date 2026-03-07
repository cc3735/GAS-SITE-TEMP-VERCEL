import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import {
  ArrowLeft,
  Upload,
  Send,
  Eye,
  CheckCircle2,
  Download,
  Clock,
  FileText,
  Plus,
  X,
  Loader2,
} from 'lucide-react';

type SigningStatus = 'draft' | 'sent' | 'viewed' | 'signed';

interface SigningRequest {
  id: string;
  documentName: string;
  signers: string[];
  status: SigningStatus;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<SigningStatus, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  draft: { label: 'Draft', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100' },
  sent: { label: 'Sent', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
  viewed: { label: 'Viewed', icon: Eye, color: 'text-amber-600', bg: 'bg-amber-50' },
  signed: { label: 'Signed', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
};

// Demo data — will be replaced by Zoho Sign API calls
const DEMO_REQUESTS: SigningRequest[] = [
  {
    id: '1',
    documentName: 'Operating Agreement — Acme LLC',
    signers: ['alice@example.com', 'bob@example.com'],
    status: 'signed',
    createdAt: '2025-12-10',
    updatedAt: '2025-12-12',
  },
  {
    id: '2',
    documentName: 'NDA — Vendor Partnership',
    signers: ['vendor@partner.co'],
    status: 'viewed',
    createdAt: '2026-01-05',
    updatedAt: '2026-01-06',
  },
  {
    id: '3',
    documentName: 'Trademark Assignment',
    signers: ['legal@gasweb.info'],
    status: 'sent',
    createdAt: '2026-02-20',
    updatedAt: '2026-02-20',
  },
];

export default function LegalFlowSigning() {
  const [requests] = useState<SigningRequest[]>(DEMO_REQUESTS);
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [signerEmails, setSignerEmails] = useState<string[]>(['']);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAddSigner = () => setSignerEmails([...signerEmails, '']);
  const handleRemoveSigner = (idx: number) =>
    setSignerEmails(signerEmails.filter((_, i) => i !== idx));
  const handleSignerChange = (idx: number, value: string) => {
    const updated = [...signerEmails];
    updated[idx] = value;
    setSignerEmails(updated);
  };

  const handleSend = async () => {
    if (!file || sending) return;
    setSending(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke('zoho-sign', {
        body: { action: 'send_document', file_name: file.name, signers: signerEmails.filter((e) => e.trim()) },
      });
      if (error) {
        setErrorMsg('Failed to send document for signing. Please try again or contact support.');
      } else {
        setSuccessMsg('Document sent for signing successfully.');
        setShowUpload(false);
        setFile(null);
        setSignerEmails(['']);
      }
    } catch {
      setErrorMsg('Unable to connect to signing service. Please try again later.');
    }
    setSending(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <Link
            to="/portal/legalflow"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> LegalFlow
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Document Signing</h1>
          <p className="mt-1 text-sm text-slate-500">
            Send documents for e-signature via Zoho Sign. Track status and download signed copies.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {/* Error/Success Banners */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{errorMsg}</p>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-green-700">{successMsg}</p>
          <button onClick={() => setSuccessMsg(null)} className="text-green-400 hover:text-green-600 ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload / Send panel */}
      {showUpload && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Send for Signature</h2>
            <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* File upload */}
          <label className="block mb-4">
            <span className="text-sm font-medium text-slate-700">Document (PDF)</span>
            <div className="mt-1 flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors">
                <Upload className="w-4 h-4" />
                {file ? file.name : 'Choose file'}
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </label>

          {/* Signers */}
          <div className="mb-4">
            <span className="text-sm font-medium text-slate-700">Signer(s)</span>
            <div className="mt-1 space-y-2">
              {signerEmails.map((email, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleSignerChange(idx, e.target.value)}
                    placeholder="signer@example.com"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {signerEmails.length > 1 && (
                    <button
                      onClick={() => handleRemoveSigner(idx)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddSigner}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + Add signer
              </button>
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={!file || signerEmails.every((e) => !e.trim())}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" /> Send for Signature
          </button>
        </div>
      )}

      {/* Request list */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Signing Requests</h2>
        </div>

        {requests.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            No signing requests yet. Click "New Request" to get started.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((req) => {
              const cfg = STATUS_CONFIG[req.status];
              const StatusIcon = cfg.icon;
              return (
                <div key={req.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{req.documentName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      To: {req.signers.join(', ')} &middot; Updated {req.updatedAt}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </span>
                  {req.status === 'signed' && (
                    <button className="text-slate-400 hover:text-slate-600" title="Download signed PDF">
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
