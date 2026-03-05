import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="section-container section-padding">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: March 5, 2026</p>

        <div className="prose prose-slate max-w-none space-y-8">
          <p className="text-lg text-slate-600">
            Global Automation Solutions ("GAS," "we," "us," or "our") is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you
            visit our website at <strong>gasweb.info</strong>, use our services, or communicate with us, including
            via SMS/text messaging.
          </p>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">1. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <h3 className="text-lg font-semibold text-slate-800 mt-4">Personal Information</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Name and business name</li>
              <li>Email address</li>
              <li>Phone number (including mobile number)</li>
              <li>Mailing address</li>
              <li>Payment and billing information</li>
              <li>Business details provided during onboarding</li>
            </ul>
            <h3 className="text-lg font-semibold text-slate-800 mt-4">Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>IP address and browser type</li>
              <li>Device information and operating system</li>
              <li>Pages visited, time spent, and navigation patterns</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide, maintain, and improve our AI automation services</li>
              <li>Process transactions and manage your account</li>
              <li>Send transactional communications (service updates, account alerts, appointment reminders)</li>
              <li>Send marketing and promotional communications (with your consent)</li>
              <li>Provide customer support via email, phone, or SMS</li>
              <li>Analyze usage patterns to improve our platform</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">3. SMS/Text Messaging</h2>
            <p>
              When you provide your mobile phone number and consent to receive text messages from Global Automation
              Solutions, we may send you SMS/MMS messages for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Transactional messages:</strong> Service updates, account notifications, appointment reminders, delivery confirmations, and two-factor authentication codes</li>
              <li><strong>Marketing messages:</strong> Promotional offers, product announcements, special deals, and newsletters</li>
              <li><strong>Customer support:</strong> Responses to inquiries, support follow-ups, and conversational assistance</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-800 mt-4">Consent & Opt-In</h3>
            <p>
              You may provide consent to receive SMS messages from us through one or more of the following methods:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Submitting a form on our website that includes your phone number and SMS consent</li>
              <li>Providing your phone number and verbal or written consent during client onboarding</li>
              <li>Providing verbal consent during a phone call or in-person meeting</li>
            </ul>
            <p className="mt-2">
              By opting in, you confirm that you are the owner or authorized user of the mobile phone number
              provided, and that you agree to receive text messages from Global Automation Solutions at that number.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-4">Opt-Out</h3>
            <p>
              You may opt out of receiving SMS messages at any time by replying <strong>STOP</strong> to any
              message you receive from us. After opting out, you will receive a final confirmation message and
              will no longer receive SMS messages from us unless you opt in again. You may also contact us at{' '}
              <a href="mailto:contact@gasweb.info" className="text-primary-600 hover:underline">contact@gasweb.info</a>{' '}
              to request removal from our SMS list.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-4">Help</h3>
            <p>
              For assistance, reply <strong>HELP</strong> to any message or contact us at{' '}
              <a href="mailto:contact@gasweb.info" className="text-primary-600 hover:underline">contact@gasweb.info</a>.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-4">Message Frequency & Rates</h3>
            <p>
              Message frequency varies based on your interaction with our services. Message and data rates may
              apply depending on your mobile carrier and plan. We are not responsible for any charges incurred
              from your carrier for receiving text messages.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-4">No Sharing of Mobile Information</h3>
            <p>
              We do not sell, rent, loan, trade, lease, or otherwise transfer for profit any phone numbers or
              personal information collected through our SMS program to any third party for their marketing or
              promotional purposes. Your mobile information will not be shared with third parties or affiliates
              for marketing or promotional purposes.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-4">Carrier Disclaimer</h3>
            <p>
              Carriers are not liable for delayed or undelivered messages. T-Mobile is not liable for delayed
              or undelivered messages.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">4. Third-Party Services</h2>
            <p>We use trusted third-party services to operate our platform:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Supabase:</strong> Database hosting and user authentication</li>
              <li><strong>Twilio:</strong> SMS/text messaging delivery</li>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>Google:</strong> Authentication (Google Sign-In) and analytics</li>
              <li><strong>Vercel:</strong> Website hosting and deployment</li>
            </ul>
            <p className="mt-2">
              These providers have their own privacy policies governing the use of your information. We only share
              information with these services as necessary to provide our services to you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">5. Cookies & Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your experience, analyze site traffic, and
              understand usage patterns. You can control cookie preferences through your browser settings.
              Disabling cookies may affect the functionality of certain features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide
              our services. We may also retain information as required by law, to resolve disputes, or to enforce
              our agreements. When your data is no longer needed, we will securely delete or anonymize it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">7. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt out of marketing communications and SMS messages</li>
              <li>Request a copy of your data in a portable format</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:contact@gasweb.info" className="text-primary-600 hover:underline">contact@gasweb.info</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">8. Security</h2>
            <p>
              We implement industry-standard security measures to protect your information, including encryption
              in transit and at rest, secure authentication, access controls, and regular security reviews.
              However, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">9. Children's Privacy</h2>
            <p>
              Our services are not directed to individuals under the age of 13. We do not knowingly collect
              personal information from children under 13. If we learn that we have collected information from
              a child under 13, we will promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by
              posting the updated policy on our website and updating the "Last updated" date. Your continued
              use of our services after any changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">11. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy, please contact us:
            </p>
            <ul className="list-none space-y-1 mt-2">
              <li><strong>Global Automation Solutions</strong></li>
              <li>Email: <a href="mailto:contact@gasweb.info" className="text-primary-600 hover:underline">contact@gasweb.info</a></li>
              <li>Website: <Link to="/contact" className="text-primary-600 hover:underline">gasweb.info/contact</Link></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
