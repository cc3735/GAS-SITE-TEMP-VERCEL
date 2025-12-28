import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { legalApi } from '@/lib/api';
import {
  Plus,
  Scale,
  FileText,
  Building,
  ScrollText,
  FileCheck,
  Clock,
  CheckCircle,
  ArrowRight,
  Search,
} from 'lucide-react';
import { useState } from 'react';

const documentCategories = [
  {
    id: 'business',
    name: 'Business Formation',
    icon: Building,
    description: 'LLC, Corporation, DBA',
    templates: ['LLC Formation', 'Corporation', 'DBA Registration', 'Partnership Agreement'],
  },
  {
    id: 'estate',
    name: 'Estate Planning',
    icon: ScrollText,
    description: 'Wills, Trusts, POA',
    templates: ['Last Will & Testament', 'Living Trust', 'Power of Attorney', 'Living Will'],
  },
  {
    id: 'contracts',
    name: 'Contracts',
    icon: FileCheck,
    description: 'NDAs, Agreements',
    templates: ['NDA', 'Employment Agreement', 'Contractor Agreement', 'Service Agreement'],
  },
  {
    id: 'personal',
    name: 'Personal Legal',
    icon: FileText,
    description: 'Name Change, Affidavits',
    templates: ['Name Change Petition', 'Affidavit', 'Bill of Sale', 'Promissory Note'],
  },
];

export default function LegalDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: documents, isLoading } = useQuery({
    queryKey: ['legalDocuments'],
    queryFn: async () => {
      const res = await legalApi.listDocuments({} as { category?: string; status?: string });
      return res.data?.documents || [];
    },
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      generated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      signed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      filed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  const filteredDocuments = documents?.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.documentType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Legal Documents</h1>
          <p className="text-muted-foreground">
            Create, manage, and sign legal documents with AI assistance
          </p>
        </div>
        <button
          onClick={() => navigate('/legal/new')}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          <Plus className="h-5 w-5" />
          New Document
        </button>
      </div>

      {/* Document Categories */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {documentCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => navigate(`/legal/new?category=${category.id}`)}
            className="rounded-xl border bg-card p-6 text-left hover:border-primary hover:shadow-md transition group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition">
              <category.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold mb-1">{category.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
            <div className="flex flex-wrap gap-1">
              {category.templates.slice(0, 2).map((template) => (
                <span
                  key={template}
                  className="text-xs bg-muted px-2 py-0.5 rounded"
                >
                  {template}
                </span>
              ))}
              {category.templates.length > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{category.templates.length - 2} more
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Search & Documents List */}
      <div className="rounded-xl border bg-card">
        <div className="border-b p-4 flex items-center gap-4">
          <h2 className="font-semibold">Your Documents</h2>
          <div className="flex-1 max-w-sm ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          </div>
        ) : filteredDocuments && filteredDocuments.length > 0 ? (
          <div className="divide-y">
            {filteredDocuments.map((doc) => (
              <Link
                key={doc.id}
                to={`/legal/${doc.id}`}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Scale className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.documentType.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(doc.status)}`}>
                    {doc.status === 'signed' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                  </span>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Scale className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No Documents Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first legal document using our AI-powered templates.
            </p>
            <button
              onClick={() => navigate('/legal/new')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              <Plus className="h-5 w-5" />
              Create Document
            </button>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="rounded-xl border bg-gradient-to-r from-primary/10 to-teal-500/10 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">AI-Powered Document Creation</h3>
            <p className="text-sm text-muted-foreground">
              Just describe what you need in plain English
            </p>
          </div>
        </div>
        <p className="text-muted-foreground mb-4">
          Try: "Create an NDA for my consulting business" or "I need a will leaving everything to my children"
        </p>
        <button
          onClick={() => navigate('/legal/new')}
          className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          Try AI Document Creator
        </button>
      </div>
    </div>
  );
}

