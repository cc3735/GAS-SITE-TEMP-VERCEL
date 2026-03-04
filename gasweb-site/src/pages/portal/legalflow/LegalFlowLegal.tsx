import { useState } from 'react';
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
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'business',
    name: 'Business Formation',
    icon: Building,
    description: 'LLC, Corporation, DBA',
    color: 'bg-blue-50',
    textColor: 'text-blue-600',
    templates: ['LLC Formation', 'Corporation', 'DBA Registration', 'Partnership Agreement'],
  },
  {
    id: 'estate',
    name: 'Estate Planning',
    icon: ScrollText,
    description: 'Wills, Trusts, POA',
    color: 'bg-purple-50',
    textColor: 'text-purple-600',
    templates: ['Last Will & Testament', 'Living Trust', 'Power of Attorney', 'Living Will'],
  },
  {
    id: 'contracts',
    name: 'Contracts',
    icon: FileCheck,
    description: 'NDAs, Agreements',
    color: 'bg-green-50',
    textColor: 'text-green-600',
    templates: ['NDA', 'Employment Agreement', 'Contractor Agreement', 'Service Agreement'],
  },
  {
    id: 'personal',
    name: 'Personal Legal',
    icon: FileText,
    description: 'Name Change, Affidavits',
    color: 'bg-orange-50',
    textColor: 'text-orange-600',
    templates: ['Name Change Petition', 'Affidavit', 'Bill of Sale', 'Promissory Note'],
  },
];

export default function LegalFlowLegal() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleCategoryClick = (categoryName: string) => {
    alert(`AI-powered ${categoryName} document creation coming soon.`);
  };

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
          onClick={() => alert('AI document creation coming soon.')}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Document
        </button>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.name)}
              className="bg-white rounded-2xl border border-slate-200 p-6 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div
                className={`w-10 h-10 ${cat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
              >
                <Icon className={`w-5 h-5 ${cat.textColor}`} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{cat.name}</h3>
              <p className="text-sm text-slate-500 mb-3">{cat.description}</p>
              <div className="flex flex-wrap gap-1">
                {cat.templates.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                  >
                    {t}
                  </span>
                ))}
                {cat.templates.length > 2 && (
                  <span className="text-xs text-slate-400">
                    +{cat.templates.length - 2} more
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

        <div className="p-12 text-center">
          <Scale className="mx-auto w-10 h-10 text-slate-300" />
          <p className="mt-3 font-medium text-slate-700">No Documents Yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Create your first legal document using our AI-powered templates.
          </p>
          <button
            onClick={() => alert('AI document creation coming soon.')}
            className="mt-5 btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Document
          </button>
        </div>
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
          onClick={() => alert('AI document creation coming soon.')}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          Try AI Document Creator
        </button>
      </div>
    </div>
  );
}
