import { Link } from 'react-router-dom';
import { ArrowRight, Check, FileText, Scale, Calculator, Shield, Zap, Users } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-navy-950 text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 font-bold text-lg">
                LF
              </div>
              <span className="text-xl font-semibold">LegalFlow</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a>
              <Link to="/child-support" className="text-gray-300 hover:text-white transition">
                Child Support Calculator
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-gray-300 hover:text-white transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-teal-500 px-4 py-2 font-medium text-navy-950 hover:bg-teal-400 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-transparent to-transparent" />
        
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-sm text-teal-400 mb-8">
              <Zap className="h-4 w-4" />
              AI-Powered Legal & Tax Platform
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Your Legal & Tax<br />
              <span className="bg-gradient-to-r from-teal-400 to-teal-200 bg-clip-text text-transparent">
                Simplified
              </span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-xl text-gray-400 mb-10">
              File your taxes, create legal documents, and handle court filings—all in one place. 
              AI-powered assistance helps you every step of the way.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="flex items-center gap-2 rounded-lg bg-teal-500 px-8 py-4 text-lg font-semibold text-navy-950 hover:bg-teal-400 transition"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/child-support"
                className="flex items-center gap-2 rounded-lg border border-white/20 px-8 py-4 text-lg font-semibold hover:bg-white/5 transition"
              >
                Try Child Support Calculator
              </Link>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              No credit card required • Free tier available
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-navy-900/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need, One Platform
            </h2>
            <p className="text-xl text-gray-400">
              Comprehensive tools for tax filing, legal documents, and court filings
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/10 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 mb-6">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Tax Filing</h3>
              <p className="text-gray-400 mb-4">
                AI-guided tax preparation for federal and state returns. Simple interface, maximum refund.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  All common tax forms
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  Real-time refund estimates
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  E-file supported
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/10 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 mb-6">
                <Scale className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Legal Documents</h3>
              <p className="text-gray-400 mb-4">
                Create wills, LLCs, contracts, and more. AI customization makes it simple.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  100+ templates
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  AI document review
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  E-signatures included
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/10 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 mb-6">
                <Calculator className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Legal Filings</h3>
              <p className="text-gray-400 mb-4">
                Automate court filings for divorce, custody, child support, and more.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  Child support calculator
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  Court form generation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  Filing checklists
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-16 border-y border-white/10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-teal-400 mb-2">256-bit</div>
              <div className="text-sm text-gray-400">SSL Encryption</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-teal-400 mb-2">50+</div>
              <div className="text-sm text-gray-400">States Supported</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-teal-400 mb-2">100k+</div>
              <div className="text-sm text-gray-400">Documents Created</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-teal-400 mb-2">4.9★</div>
              <div className="text-sm text-gray-400">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-400">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h3 className="text-lg font-semibold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-gray-400">/mo</span></div>
              <ul className="space-y-3 mb-8 text-gray-400">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  Simple tax returns
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  View legal templates
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  5 child support calcs/mo
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full rounded-lg border border-white/20 py-3 text-center font-medium hover:bg-white/5 transition"
              >
                Get Started
              </Link>
            </div>

            {/* Premium */}
            <div className="rounded-2xl border-2 border-teal-500 bg-teal-500/10 p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-4 py-1 text-sm font-medium text-navy-950">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold mb-2">Premium</h3>
              <div className="text-4xl font-bold mb-6">$49<span className="text-lg text-gray-400">/mo</span></div>
              <ul className="space-y-3 mb-8 text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  All tax forms & schedules
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  Unlimited legal documents
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  Unlimited calculations
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  Advanced AI features
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  Audit protection
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full rounded-lg bg-teal-500 py-3 text-center font-medium text-navy-950 hover:bg-teal-400 transition"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h3 className="text-lg font-semibold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-6">$99<span className="text-lg text-gray-400">/return</span></div>
              <ul className="space-y-3 mb-8 text-gray-400">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  Everything in Premium
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  Business tax returns
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  Expert review
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  Attorney consultation
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full rounded-lg border border-white/20 py-3 text-center font-medium hover:bg-white/5 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-teal-600 to-teal-500">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-navy-950 mb-6">
            Ready to Simplify Your Legal & Tax Needs?
          </h2>
          <p className="text-xl text-navy-900 mb-8">
            Join thousands of users who trust LegalFlow for their important documents.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-navy-950 px-8 py-4 text-lg font-semibold text-white hover:bg-navy-900 transition"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 font-bold text-navy-950">
                LF
              </div>
              <span className="font-semibold">LegalFlow</span>
            </div>
            
            <p className="text-sm text-gray-400 text-center">
              ⚠️ LegalFlow provides document preparation services only. This is not legal or tax advice.
            </p>
            
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

