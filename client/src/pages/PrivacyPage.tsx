import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-blue max-w-none">
            <p className="text-lg text-gray-600 mb-8">
              Last updated: May 2, 2025
            </p>

            <section className="mb-8">
              <h2>1. Introduction</h2>
              <p>
                At Proply, we take your privacy seriously. This Privacy Policy explains how we collect,
                use, disclose, and safeguard your information when you use our property analysis platform.
                By using our services, you agree to the collection and use of information in accordance with
                this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2>2. Information We Collect</h2>
              <p>We collect several types of information from and about users of our platform:</p>
              
              <h3 className="text-lg font-medium mt-4 mb-2">Personal Information</h3>
              <p>Information that you provide directly to us, including:</p>
              <ul>
                <li>Account information (name, email address, password)</li>
                <li>Profile information (company, job title, profile picture)</li>
                <li>Contact information (phone number, address)</li>
                <li>Property analysis data and preferences</li>
                <li>Payment information for premium services</li>
                <li>Communications with us through email, chat, or other means</li>
              </ul>
              
              <h3 className="text-lg font-medium mt-4 mb-2">Usage and Technical Data</h3>
              <p>Information collected automatically when you use our platform:</p>
              <ul>
                <li>IP address and device information</li>
                <li>Browser type and operating system</li>
                <li>Pages and features accessed</li>
                <li>Time spent on platform and interaction patterns</li>
                <li>Referral sources and exit pages</li>
                <li>Device identifiers and location data (with your permission)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2>3. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our platform and
                hold certain information to enhance your experience. Cookies are small files placed on
                your device that allow us to:
              </p>
              <ul>
                <li>Remember your preferences and settings</li>
                <li>Understand how you interact with our platform</li>
                <li>Analyze traffic patterns and usage</li>
                <li>Personalize content and features</li>
                <li>Improve security and detect fraudulent activity</li>
              </ul>
              
              <h3 className="text-lg font-medium mt-4 mb-2">Types of Cookies We Use</h3>
              <ul>
                <li><strong>Essential Cookies:</strong> Required for the functioning of our platform (such as user authentication)</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
                <li><strong>Marketing Cookies:</strong> Track your browsing habits to deliver targeted advertising</li>
              </ul>
              
              <h3 className="text-lg font-medium mt-4 mb-2">Cookie Management</h3>
              <p>
                Most web browsers allow some control of cookies through browser settings. You can:
              </p>
              <ul>
                <li>Block or delete cookies through your browser settings</li>
                <li>Set your browser to notify you when cookies are being sent</li>
                <li>Use private browsing mode to reject certain cookies</li>
              </ul>
              <p className="mt-2">
                Please note that blocking certain cookies may impact your experience on our platform and
                limit access to certain features.
              </p>
            </section>

            <section className="mb-8">
              <h2>4. How We Use Your Information</h2>
              <p>We use the information we collect for various purposes:</p>
              <ul>
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and manage your account</li>
                <li>Send administrative information and service updates</li>
                <li>Personalize your experience and deliver tailored content</li>
                <li>Analyze usage patterns to enhance our platform</li>
                <li>Communicate with you about features, offers, and events</li>
                <li>Protect against fraudulent or unauthorized activity</li>
                <li>Comply with legal obligations and enforce our terms</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2>5. Sharing and Disclosure</h2>
              <p>We may share your information with third parties in the following circumstances:</p>
              <ul>
                <li><strong>Service Providers:</strong> Companies that perform services on our behalf (payment processing, data analysis, email delivery, hosting)</li>
                <li><strong>Business Partners:</strong> Trusted partners who help us provide and improve our services</li>
                <li><strong>Legal Requirements:</strong> When required by law, subpoena, or other legal process</li>
                <li><strong>Protection of Rights:</strong> To protect our rights, property, safety, or the rights of our users or others</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
              <p className="mt-4">
                We do not sell your personal information to third parties for marketing purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2>6. Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to fulfill the purposes
                outlined in this Privacy Policy, unless a longer retention period is required or
                permitted by law. When determining retention periods, we consider:
              </p>
              <ul>
                <li>How long the information is needed to provide our services</li>
                <li>Whether we have legal or contractual obligations to retain the data</li>
                <li>Whether retention is advisable in light of our legal position</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2>7. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your
                personal information, including:
              </p>
              <ul>
                <li>Encryption of sensitive data</li>
                <li>Secure network infrastructure</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication</li>
                <li>Staff training on data protection</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission over the internet or electronic storage is 100% secure.
                While we strive to use commercially acceptable means to protect your personal information,
                we cannot guarantee its absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2>8. Your Rights and Choices</h2>
              <p>
                Depending on your location, you may have certain rights regarding your personal information:
              </p>
              <ul>
                <li>Access and review your personal information</li>
                <li>Update or correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Object to or restrict certain processing activities</li>
                <li>Request portability of your information</li>
                <li>Withdraw consent (where applicable)</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us using the information provided at the end of this policy.
                Please note that some rights may be limited where we have compelling reasons to continue processing
                your information.
              </p>
            </section>

            <section className="mb-8">
              <h2>9. Children's Privacy</h2>
              <p>
                Our services are not intended for use by children under the age of 18. We do not knowingly
                collect personal information from children under 18. If you become aware that a child has
                provided us with personal information, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2>10. Changes to Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes to our information
                practices. If we make material changes, we will notify you by email or by posting a notice
                on our platform prior to the changes becoming effective. We encourage you to periodically
                review this page for the latest information.
              </p>
            </section>

            <section className="mb-8">
              <h2>11. Contact Us</h2>
              <p>
                If you have questions, concerns, or requests about this Privacy Policy or our privacy practices,
                please contact us at:
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
