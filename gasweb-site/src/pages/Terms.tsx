import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="section-container section-padding">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: March 5, 2026</p>

        <div className="prose prose-slate max-w-none space-y-8">
          <p className="text-lg text-slate-600">
            These Terms of Service ("Terms") govern your use of the website, platform, and services provided by
            Global Automation Solutions ("GAS," "we," "us," or "our") at <strong>gasweb.info</strong>. By accessing
            or using our services, you agree to be bound by these Terms.
          </p>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing our website or using our services, you acknowledge that you have read, understood, and
              agree to be bound by these Terms and our{' '}
              <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>. If you do
              not agree to these Terms, you may not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">2. Description of Services</h2>
            <p>
              Global Automation Solutions provides AI-powered automation services to businesses, including but
              not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>AI automation consulting and implementation</li>
              <li>Client portal access for managing automation workflows</li>
              <li>Business applications (LegalFlow, FinanceFlow, SocialFlow, and others)</li>
              <li>Educational resources and courses on AI and automation</li>
              <li>Customer support and communication services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">3. Account Registration</h2>
            <p>
              To access certain features, you may need to create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access to your account</li>
              <li>Accept responsibility for all activity that occurs under your account</li>
            </ul>
            <p className="mt-2">
              We reserve the right to suspend or terminate accounts that violate these Terms or contain
              inaccurate information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">4. SMS/Text Messaging Terms</h2>
            <p>
              By providing your mobile phone number and consenting to receive text messages from Global Automation
              Solutions, you agree to the following:
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-4">Consent</h3>
            <p>
              You consent to receive SMS/MMS messages from Global Automation Solutions at the mobile number you
              provide. Consent may be given through our website forms, during client onboarding, or verbally
              during a call or meeting. Consent is not a condition of purchasing any goods or services.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-4">Types of Messages</h3>
            <p>You may receive messages related to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Service updates, account notifications, and appointment reminders</li>
              <li>Marketing promotions, product announcements, and special offers</li>
              <li>Customer support responses and conversational assistance</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-800 mt-4">Opt-Out</h3>
            <p>
              You may opt out of receiving text messages at any time by replying <strong>STOP</strong> to any
              message. After sending STOP, you will receive a one-time confirmation message. No further messages
              will be sent unless you re-subscribe. You may also email us at{' '}
              <a href="mailto:contact@gasweb.info" className="text-primary-600 hover:underline">contact@gasweb.info</a>{' '}
              to opt out.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-4">Help</h3>
            <p>
              For help or support with our SMS program, reply <strong>HELP</strong> to any message or email us
              at <a href="mailto:contact@gasweb.info" className="text-primary-600 hover:underline">contact@gasweb.info</a>.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-4">Message Frequency & Rates</h3>
            <p>
              Message frequency varies based on your account activity and interactions with our services.
              Message and data rates may apply. Check with your mobile carrier for details about your messaging
              plan. We are not responsible for any charges from your carrier.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-4">Carrier Disclaimer</h3>
            <p>
              Carriers are not liable for delayed or undelivered messages. T-Mobile is not liable for delayed
              or undelivered messages.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-4">Privacy</h3>
            <p>
              Your mobile number and SMS consent information will not be sold, rented, or shared with third
              parties or affiliates for their marketing or promotional purposes. For full details, see our{' '}
              <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use our services for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of our platform</li>
              <li>Interfere with or disrupt the operation of our services</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Impersonate another person or entity</li>
              <li>Scrape, crawl, or use automated means to access our services without permission</li>
              <li>Use our services to send unsolicited communications (spam)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">6. Intellectual Property</h2>
            <p>
              All content, features, and functionality of our website and platform — including text, graphics,
              logos, software, and design — are owned by Global Automation Solutions and are protected by
              copyright, trademark, and other intellectual property laws. You may not reproduce, distribute,
              or create derivative works without our written consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">7. Payment Terms</h2>
            <p>
              If you purchase services from us, you agree to provide accurate payment information and authorize
              us to charge the applicable fees. All payments are processed securely through our third-party
              payment processor (Stripe). Refund policies will be communicated at the time of purchase or as
              outlined in your service agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Global Automation Solutions shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising out of or related to
              your use of our services. Our total liability for any claim arising from these Terms shall not
              exceed the amount you paid to us in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">9. Disclaimer of Warranties</h2>
            <p>
              Our services are provided "as is" and "as available" without warranties of any kind, either express
              or implied. We do not warrant that our services will be uninterrupted, error-free, or free of
              harmful components. We disclaim all warranties, including implied warranties of merchantability,
              fitness for a particular purpose, and non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">10. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Global Automation Solutions, its officers,
              directors, employees, and agents from any claims, damages, losses, or expenses (including
              reasonable attorneys' fees) arising out of your use of our services, violation of these Terms,
              or infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">11. Termination</h2>
            <p>
              We may suspend or terminate your access to our services at any time, with or without cause, and
              with or without notice. Upon termination, your right to use our services will immediately cease.
              Sections that by their nature should survive termination (including limitation of liability,
              indemnification, and governing law) will continue in effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United States.
              Any disputes arising from these Terms or your use of our services shall be resolved in the courts
              of competent jurisdiction within the United States.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">13. Changes to These Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material changes by
              posting the updated Terms on our website and updating the "Last updated" date. Your continued use
              of our services after any changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold text-slate-900">14. Contact Us</h2>
            <p>
              If you have questions about these Terms of Service, please contact us:
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
