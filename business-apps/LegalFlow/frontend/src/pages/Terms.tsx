import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export default function Terms() {
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
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Terms of Service</h1>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground mb-6">
              Welcome to LegalFlow. By using our services, you agree to these terms.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using LegalFlow ("Service"), you agree to be bound by 
              these Terms of Service and our Privacy Policy. If you disagree with 
              any part of the terms, you may not access the Service.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">2. Description of Service</h2>
            <p>LegalFlow provides:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Tax preparation and e-filing assistance</li>
              <li>Legal document preparation and generation</li>
              <li>Court filing automation tools</li>
              <li>Child support calculation tools</li>
              <li>AI-powered document customization</li>
            </ul>
            <p className="mt-4">
              LegalFlow is a document preparation service. We are NOT a law firm and 
              do not provide legal or tax advice. See our{' '}
              <Link to="/disclaimer" className="text-primary">Disclaimer</Link> for 
              important limitations.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. Account Registration</h2>
            <p>To use our Service, you must:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Be at least 18 years of age</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. Subscription and Payments</h2>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">Billing</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscriptions are billed in advance on a monthly or annual basis</li>
              <li>Payment is processed securely through Stripe</li>
              <li>Prices may change with 30 days' notice</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">Refunds</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscription fees are non-refundable once billed</li>
              <li>One-time purchases may be refunded within 30 days if documents have not been downloaded or filed</li>
              <li>E-filed tax returns cannot be refunded after submission</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">Cancellation</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>You may cancel your subscription at any time</li>
              <li>Access continues until the end of your current billing period</li>
              <li>Your data will be retained for 90 days after cancellation</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">5. Acceptable Use</h2>
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Use the Service for any illegal purpose</li>
              <li>Submit false or misleading information</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper working of the Service</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Share your account credentials with others</li>
              <li>Use automated systems (bots) without permission</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">6. Your Responsibilities</h2>
            <p>When using LegalFlow, you are responsible for:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Providing accurate and complete information</li>
              <li>Reviewing all documents before signing or filing</li>
              <li>Understanding the legal implications of documents you create</li>
              <li>Meeting all deadlines for filings and payments</li>
              <li>Maintaining your own copies of all documents</li>
              <li>Seeking professional advice for complex situations</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">7. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are 
              owned by LegalFlow and are protected by copyright, trademark, and other 
              intellectual property laws.
            </p>
            <p className="mt-4">
              Documents you create using our Service are your property. You grant us 
              a limited license to store and process your documents solely for the 
              purpose of providing the Service.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">8. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES 
              OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Documents will be accepted by courts or government agencies</li>
              <li>Tax calculations will be error-free</li>
              <li>AI-generated content will be accurate or complete</li>
              <li>The Service will be uninterrupted or secure</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, LEGALFLOW SHALL NOT BE LIABLE 
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, 
              INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Loss of profits or revenue</li>
              <li>Loss of data</li>
              <li>Legal penalties or fines</li>
              <li>Missed deadlines or opportunities</li>
            </ul>
            <p className="mt-4">
              Our total liability shall not exceed the amount paid by you for the 
              Service in the twelve (12) months preceding the claim.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless LegalFlow and its officers, 
              directors, employees, and agents from any claims, damages, or expenses 
              arising from your use of the Service or violation of these Terms.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">11. Governing Law</h2>
            <p>
              These Terms shall be governed by the laws of the State of California, 
              without regard to its conflict of law provisions. Any disputes shall 
              be resolved in the state or federal courts located in San Francisco County.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">12. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify 
              you of material changes by email or through the Service. Your continued 
              use of the Service after changes constitutes acceptance of the new Terms.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">13. Contact Us</h2>
            <p>
              If you have questions about these Terms, please contact us at:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Email: <a href="mailto:legal@legalflow.com" className="text-primary">legal@legalflow.com</a></li>
              <li>Mail: LegalFlow Legal Team, 123 Main Street, Suite 100, San Francisco, CA 94105</li>
            </ul>

            <div className="mt-8 p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                <strong>Last Updated:</strong> December 2024
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                By using LegalFlow, you acknowledge that you have read and understood 
                these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

