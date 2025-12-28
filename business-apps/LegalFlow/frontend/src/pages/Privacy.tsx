import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export default function Privacy() {
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
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground mb-6">
              Your privacy is critically important to us. This policy describes how we collect, 
              use, and protect your personal information.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">Personal Information</h3>
            <p>When you use LegalFlow, we may collect:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Name, email address, and phone number</li>
              <li>Date of birth and Social Security Number (encrypted at rest)</li>
              <li>Address and contact information</li>
              <li>Financial information for tax preparation</li>
              <li>Family information for legal documents</li>
              <li>Payment information (processed by Stripe)</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">Usage Information</h3>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Device information and browser type</li>
              <li>IP address and location data</li>
              <li>Pages visited and features used</li>
              <li>Time spent on the platform</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Provide document preparation and filing services</li>
              <li>Process tax returns and legal documents</li>
              <li>Calculate child support estimates</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send service-related communications</li>
              <li>Improve our platform and services</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. Data Security</h2>
            <p>We implement industry-standard security measures:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Encryption:</strong> All sensitive data is encrypted using AES-256 encryption at rest and TLS 1.3 in transit</li>
              <li><strong>Access Controls:</strong> Role-based access control (RBAC) limits data access to authorized personnel</li>
              <li><strong>Authentication:</strong> Multi-factor authentication (MFA) available for all accounts</li>
              <li><strong>Monitoring:</strong> Continuous security monitoring and audit logging</li>
              <li><strong>Compliance:</strong> SOC 2 Type II certification (in progress)</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. Data Retention</h2>
            <p>We retain your data for as long as necessary to provide our services:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Tax Returns:</strong> 7 years (IRS retention requirement)</li>
              <li><strong>Legal Documents:</strong> Until you delete them or close your account</li>
              <li><strong>Account Information:</strong> Until account deletion</li>
              <li><strong>Payment Records:</strong> 7 years (financial record requirements)</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">5. Third-Party Services</h2>
            <p>We share data with trusted third parties only as necessary:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Supabase:</strong> Database and authentication</li>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>OpenAI:</strong> AI-powered features (anonymized prompts)</li>
              <li><strong>IRS (when filing):</strong> Tax return submission</li>
              <li><strong>State courts (when filing):</strong> Legal document submission</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Access:</strong> Request a copy of your data</li>
              <li><strong>Correction:</strong> Update inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</li>
              <li><strong>Portability:</strong> Export your data in a standard format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">7. AI and Data Processing</h2>
            <p>When using AI-powered features:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Prompts sent to AI are anonymized and do not include your name or SSN</li>
              <li>AI outputs are generated based on your inputs but are not stored by AI providers</li>
              <li>We do not use your personal data to train AI models</li>
              <li>You can opt out of AI features and use manual document preparation</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">8. Children's Privacy</h2>
            <p>
              LegalFlow is not intended for use by individuals under 18 years of age. 
              We do not knowingly collect personal information from children. If you 
              believe a child has provided us with personal information, please contact us.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">9. California Privacy Rights</h2>
            <p>
              California residents have additional rights under the CCPA, including 
              the right to know what personal information is collected, the right to 
              deletion, and the right to opt out of the sale of personal information. 
              We do not sell personal information.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you 
              of any material changes by email or through our platform. Your continued 
              use of our services after changes constitutes acceptance of the updated policy.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">11. Contact Us</h2>
            <p>
              If you have questions about this privacy policy or your data:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Email: <a href="mailto:privacy@legalflow.com" className="text-primary">privacy@legalflow.com</a></li>
              <li>Mail: LegalFlow Privacy Team, 123 Main Street, Suite 100, San Francisco, CA 94105</li>
            </ul>

            <div className="mt-8 p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                <strong>Last Updated:</strong> December 2024
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

