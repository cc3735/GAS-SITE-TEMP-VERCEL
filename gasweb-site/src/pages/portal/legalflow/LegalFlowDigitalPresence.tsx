import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import {
  ArrowLeft,
  Globe,
  Mail,
  Monitor,
  Search,
  Check,
  ChevronRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';

type Step = 'domain' | 'email' | 'website';

const STEPS: { key: Step; label: string; icon: typeof Globe }[] = [
  { key: 'domain', label: 'Domain', icon: Globe },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'website', label: 'Website', icon: Monitor },
];

type EmailProvider = 'hostinger' | 'google' | 'zoho';

export default function LegalFlowDigitalPresence() {
  const [activeStep, setActiveStep] = useState<Step>('domain');
  const [domainQuery, setDomainQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [domainResult, setDomainResult] = useState<{ available: boolean; domain: string } | null>(null);
  const [domainRegistered, setDomainRegistered] = useState(false);
  const [emailProvider, setEmailProvider] = useState<EmailProvider | null>(null);
  const [websiteStarted, setWebsiteStarted] = useState(false);

  const handleDomainSearch = async () => {
    if (!domainQuery.trim()) return;
    setIsSearching(true);
    setDomainResult(null);
    const domain = domainQuery.includes('.') ? domainQuery : `${domainQuery}.com`;
    const { data, error } = await supabase.functions.invoke('hostinger', {
      body: { action: 'domain_search', domain },
    });
    if (error) {
      console.error('Hostinger search error:', error);
      setDomainResult({ available: false, domain });
    } else {
      setDomainResult({ available: data.available, domain: data.domain || domain });
    }
    setIsSearching(false);
  };

  const handleRegisterDomain = async () => {
    const { data, error } = await supabase.functions.invoke('hostinger', {
      body: { action: 'domain_register', domain: domainResult?.domain },
    });
    if (error) {
      console.error('Hostinger register error:', error);
    } else {
      console.log('Domain registered:', data);
      setDomainRegistered(true);
    }
  };

  const handleSetupWebsite = async () => {
    const { data, error } = await supabase.functions.invoke('hostinger', {
      body: { action: 'hosting_provision', domain: domainResult?.domain },
    });
    if (error) {
      console.error('Hostinger hosting error:', error);
    } else {
      console.log('Hosting provisioned:', data);
      setWebsiteStarted(true);
    }
  };

  const stepIdx = STEPS.findIndex((s) => s.key === activeStep);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/portal/legalflow"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> LegalFlow
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Digital Presence Setup</h1>
        <p className="mt-1 text-sm text-slate-500">
          Get your business online — register a domain, set up email, and launch your website.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = step.key === activeStep;
          const isCompleted = i < stepIdx;
          return (
            <div key={step.key} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="w-4 h-4 text-slate-300" />}
              <button
                onClick={() => setActiveStep(step.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
                    : isCompleted
                    ? 'bg-green-50 text-green-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                {step.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        {/* ── Domain Step ────────────────────────────────────── */}
        {activeStep === 'domain' && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Register a Domain</h2>
            <p className="text-sm text-slate-500 mb-6">
              Search for an available domain name and register it via Hostinger.
            </p>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={domainQuery}
                onChange={(e) => setDomainQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDomainSearch()}
                placeholder="mybusiness.com"
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleDomainSearch}
                disabled={isSearching || !domainQuery.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </button>
            </div>

            {domainResult && (
              <div className={`p-4 rounded-xl border ${domainResult.available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${domainResult.available ? 'text-green-800' : 'text-red-800'}`}>
                      {domainResult.domain}
                    </p>
                    <p className={`text-sm mt-0.5 ${domainResult.available ? 'text-green-600' : 'text-red-600'}`}>
                      {domainResult.available ? 'Available for registration' : 'Already taken — try another name'}
                    </p>
                  </div>
                  {domainResult.available && !domainRegistered && (
                    <button onClick={handleRegisterDomain} className="btn-primary text-sm">
                      Register
                    </button>
                  )}
                  {domainRegistered && (
                    <span className="inline-flex items-center gap-1 text-green-700 font-medium text-sm">
                      <Check className="w-4 h-4" /> Registered
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveStep('email')}
                className="btn-primary flex items-center gap-2"
              >
                Next: Email <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Email Step ─────────────────────────────────────── */}
        {activeStep === 'email' && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Business Email Setup</h2>
            <p className="text-sm text-slate-500 mb-6">
              Choose an email provider for your business domain. Google Workspace is optional.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  id: 'hostinger' as EmailProvider,
                  name: 'Hostinger Email',
                  desc: 'Included with your hosting plan. Simple business email.',
                  badge: 'Included',
                },
                {
                  id: 'google' as EmailProvider,
                  name: 'Google Workspace',
                  desc: 'Gmail, Drive, Docs, Sheets — full productivity suite.',
                  badge: 'Optional',
                },
                {
                  id: 'zoho' as EmailProvider,
                  name: 'Zoho Mail',
                  desc: 'Professional email with calendar and contacts. Free tier available.',
                  badge: 'Free Tier',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setEmailProvider(opt.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-colors ${
                    emailProvider === opt.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900 text-sm">{opt.name}</span>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{opt.desc}</p>
                </button>
              ))}
            </div>

            {emailProvider === 'google' && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                <p className="font-medium mb-1">Google Workspace Setup</p>
                <p>
                  You'll be redirected to Google Workspace to complete setup. We'll configure the DNS
                  MX records automatically via Hostinger.
                </p>
                <a
                  href="https://workspace.google.com/business/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-blue-700 font-medium hover:underline"
                >
                  Go to Google Workspace <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {emailProvider === 'hostinger' && (
              <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-xl text-sm text-teal-800">
                <p className="font-medium mb-1">Hostinger Email</p>
                <p>
                  Email will be provisioned with your hosting plan. DNS records are configured automatically.
                </p>
              </div>
            )}

            {emailProvider === 'zoho' && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-800">
                <p className="font-medium mb-1">Zoho Mail</p>
                <p>
                  Sign up for Zoho Mail and we'll configure the MX records via Hostinger DNS.
                </p>
                <a
                  href="https://www.zoho.com/mail/zohomail-pricing.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-orange-700 font-medium hover:underline"
                >
                  Go to Zoho Mail <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveStep('website')}
                className="btn-primary flex items-center gap-2"
              >
                Next: Website <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Website Step ───────────────────────────────────── */}
        {activeStep === 'website' && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Website Hosting</h2>
            <p className="text-sm text-slate-500 mb-6">
              Set up web hosting via Hostinger so your business has a live website.
            </p>

            {!websiteStarted ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 text-center">
                <Monitor className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-4">
                  We'll provision a hosting environment on Hostinger and point your domain to it.
                </p>
                <button onClick={handleSetupWebsite} className="btn-primary">
                  Set Up Hosting
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-green-200 bg-green-50 text-center">
                <Check className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <p className="font-medium text-green-800">Hosting setup initiated</p>
                <p className="text-sm text-green-600 mt-1">
                  Your hosting environment is being provisioned. DNS propagation may take up to 24 hours.
                </p>
              </div>
            )}

            <div className="mt-8 p-4 bg-slate-50 rounded-xl">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">What happens next?</h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                  Hosting environment is created on Hostinger
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                  DNS A/CNAME records are configured for your domain
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                  SSL certificate is provisioned automatically
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                  A GAS team member will reach out to design your website
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
