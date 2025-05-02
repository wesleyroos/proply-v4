import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-blue max-w-none">
            <p className="text-lg text-gray-600 mb-8">
              Last updated: May 2, 2025
            </p>

            <section className="mb-8">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing and using Proply's services, you agree to be bound by these Terms of Service
                and all applicable laws and regulations. If you do not agree with any of these terms, you are
                prohibited from using or accessing this site.
              </p>
            </section>

            <section className="mb-8">
              <h2>2. Services Description</h2>
              <p>
                Proply provides property analysis and investment insights through our platform. Our services include:
              </p>
              <ul>
                <li>Property analysis and valuation tools</li>
                <li>Investment metrics calculation</li>
                <li>Market insights and comparisons</li>
                <li>Risk Assessment and reporting</li>
                <li>Deal Score analysis</li>
                <li>API access for enterprise clients</li>
              </ul>
              <p className="mt-4">
                We strive to provide accurate and reliable information, but we make no representations or warranties
                about the completeness, reliability, or accuracy of this information. Any reliance on information
                provided through our platform is strictly at your own risk.
              </p>
            </section>

            <section className="mb-8">
              <h2>3. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials
                and for all activities under your account. You agree to:
              </p>
              <ul>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your password and account</li>
                <li>Notify us immediately of any unauthorized access to your account</li>
                <li>Take responsibility for all activities that occur under your account</li>
              </ul>
              <p className="mt-4">
                We reserve the right to terminate or suspend accounts at our discretion, especially in cases of
                terms violation or suspicious activity.
              </p>
            </section>

            <section className="mb-8">
              <h2>4. Subscription and Payments</h2>
              <p>
                Premium features require a paid subscription. By subscribing to our services:
              </p>
              <ul>
                <li>You authorize us to charge the applicable fees to your designated payment method</li>
                <li>Subscriptions will automatically renew unless cancelled before the renewal date</li>
                <li>You may cancel your subscription at any time through your account settings</li>
                <li>Refunds are provided in accordance with our refund policy</li>
              </ul>
              <p className="mt-4">
                We reserve the right to change our subscription fees upon reasonable notice. Changes to fees
                will not apply to existing subscription periods but will take effect upon renewal.
              </p>
            </section>

            <section className="mb-8">
              <h2>5. Intellectual Property</h2>
              <p>
                The Proply platform, content, and related materials are protected by intellectual property laws.
                You may not:
              </p>
              <ul>
                <li>Reproduce, distribute, or create derivative works from our content</li>
                <li>Use our trademarks or service marks without permission</li>
                <li>Attempt to reverse engineer or access source code of our software</li>
                <li>Remove any copyright or proprietary notices from our materials</li>
              </ul>
              <p className="mt-4">
                Limited license: We grant you a non-exclusive, non-transferable license to use our platform
                for its intended purposes in accordance with these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2>6. Data Usage and Privacy</h2>
              <p>
                We respect your data privacy rights. How we collect, use, and protect your data is detailed
                in our <a href="/privacy" className="text-proply-blue hover:underline">Privacy Policy</a>, which is incorporated into these Terms.
                By using our services, you consent to our data practices as described in the Privacy Policy.
              </p>
              <p className="mt-4">
                We utilize cookies and similar tracking technologies to enhance your experience on our platform.
                Details about cookies, including how to control them, are covered in our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2>7. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Proply and its affiliates shall not be liable for:
              </p>
              <ul>
                <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, revenue, data, or business opportunities</li>
                <li>Any investment losses resulting from reliance on our platform</li>
                <li>Damages arising from your use or inability to use our services</li>
              </ul>
              <p className="mt-4">
                Property investment decisions should not be made solely on the basis of information provided
                through our platform. Always consult with qualified financial and real estate professionals.
              </p>
            </section>

            <section className="mb-8">
              <h2>8. Modifications to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. Changes will be effective immediately
                upon posting on the platform. Your continued use of our services after any changes indicates your
                acceptance of the modified Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2>9. Marketing and References</h2>
              <p>
                By creating an account on the Proply platform, you agree that Proply may, at its discretion,
                state publicly that your company uses the Proply platform for marketing and promotional purposes.
                Company affiliation may be determined based on your email address domain or information provided
                during registration. If you wish to opt out of being referenced as a user of our platform,
                please contact us using the information provided below.
              </p>
            </section>

            <section className="mb-8">
              <h2>10. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of South Africa,
                without regard to its conflict of law provisions. Any disputes relating to these Terms shall be
                subject to the exclusive jurisdiction of the courts in Cape Town, South Africa.
              </p>
            </section>

            <section className="mb-8">
              <h2>11. Contact Information</h2>
              <p>
                For questions about these terms, please contact us at:
                <br />
                Email: hello@proply.co.za
                <br />
                Address: 7 Darter Rd, Longkloof Gardens, Cape Town, 8001
              </p>
            </section>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
