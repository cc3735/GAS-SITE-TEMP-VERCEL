import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="rounded-xl border bg-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold">Important Legal Disclaimer</h1>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground mb-6">
              Please read this disclaimer carefully before using LegalFlow's services.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">1. Not Legal or Tax Advice</h2>
            <p>
              LegalFlow is a <strong>document preparation service</strong> and 
              <strong>educational platform</strong>. We are NOT a law firm, and our 
              employees are NOT attorneys, accountants, or tax professionals. We do not 
              provide legal advice, tax advice, or representation.
            </p>
            <p>
              The information provided through our platform is for general informational 
              purposes only and should not be construed as legal, tax, or financial advice. 
              Every individual's situation is unique, and the law varies by jurisdiction.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">2. No Attorney-Client Relationship</h2>
            <p>
              Use of LegalFlow does not create an attorney-client relationship, an 
              accountant-client relationship, or any other professional-client relationship. 
              Communications through our platform are not protected by attorney-client 
              privilege.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. Limitations of Document Preparation</h2>
            <p>
              Our document preparation services are designed to assist you in completing 
              standard legal and tax forms based on information you provide. We:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Cannot guarantee that documents are appropriate for your specific situation</li>
              <li>Cannot advise you on which forms or filings are correct for your needs</li>
              <li>Cannot represent you in court or before any government agency</li>
              <li>Cannot interpret laws or regulations for your specific circumstances</li>
              <li>Cannot guarantee acceptance by courts or government agencies</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. Tax Filing Disclaimer</h2>
            <p>
              LegalFlow's tax preparation tools provide estimates and form preparation 
              assistance. We strongly recommend:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Consulting a licensed CPA or tax professional for complex tax situations</li>
              <li>Reviewing all information before filing with the IRS or state tax authorities</li>
              <li>Maintaining your own records of all tax-related documents</li>
            </ul>
            <p className="mt-4">
              We are not responsible for any penalties, interest, or additional taxes that 
              may result from errors or omissions in your tax returns.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">5. Child Support Calculator</h2>
            <p>
              Our child support calculator provides <strong>estimates only</strong> based 
              on publicly available state guidelines. Actual child support amounts are 
              determined by courts and may differ significantly based on:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Judicial discretion</li>
              <li>Specific facts of your case</li>
              <li>Recent changes to state laws</li>
              <li>Factors not captured in our calculator</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">6. Legal Filing Automation</h2>
            <p>
              Our legal filing automation tools assist with document preparation for 
              common pro se (self-represented) filings. By using these tools, you 
              acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>You are representing yourself (pro se) in any legal proceedings</li>
              <li>Complex cases should be reviewed by a licensed attorney</li>
              <li>Court requirements vary by jurisdiction and may change</li>
              <li>Filing deadlines and procedures are your responsibility</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">7. AI-Generated Content</h2>
            <p>
              Our platform uses artificial intelligence to assist with document 
              generation and customization. AI-generated content:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>May contain errors or inaccuracies</li>
              <li>Should be reviewed carefully before use</li>
              <li>May not reflect the most current laws or regulations</li>
              <li>Is not a substitute for professional legal or tax review</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">8. When to Seek Professional Help</h2>
            <p>
              We strongly recommend consulting a licensed attorney or tax professional for:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Complex legal matters or disputes</li>
              <li>Situations involving significant assets or liabilities</li>
              <li>Cases involving domestic violence or abuse</li>
              <li>Bankruptcy or debt resolution</li>
              <li>Criminal matters</li>
              <li>Business formation for complex entities</li>
              <li>Estate planning for high-net-worth individuals</li>
              <li>Any situation where you feel uncertain</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">9. Unauthorized Practice of Law</h2>
            <p>
              LegalFlow strictly adheres to laws prohibiting the unauthorized practice 
              of law. We provide document preparation services and general information 
              only. If you have questions about whether our services are appropriate 
              for your situation, please consult a licensed attorney.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">10. Acceptance of Terms</h2>
            <p>
              By using LegalFlow's services, you acknowledge that you have read, 
              understood, and agree to this disclaimer. You understand that our 
              services are not a substitute for professional legal or tax advice.
            </p>

            <div className="mt-8 p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                <strong>Last Updated:</strong> December 2024
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                If you have questions about this disclaimer, please contact us at 
                <a href="mailto:legal@legalflow.com" className="text-primary ml-1">
                  legal@legalflow.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

