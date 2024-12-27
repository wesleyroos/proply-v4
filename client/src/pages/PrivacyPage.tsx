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
              Last updated: December 27, 2024
            </p>

            <section className="mb-8">
              <h2>1. Introduction</h2>
              <p>
                At Proply, we take your privacy seriously. This Privacy Policy explains how we collect,
                use, disclose, and safeguard your information when you use our property analysis platform.
              </p>
            </section>

            <section className="mb-8">
              <h2>2. Information We Collect</h2>
              <p>We collect information that you provide directly to us, including:</p>
              <ul>
                <li>Account information (name, email, password)</li>
                <li>Property analysis data and preferences</li>
                <li>Payment information for premium services</li>
                <li>Usage data and analytics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2>3. How We Use Your Information</h2>
              <p>We use the collected information to:</p>
              <ul>
                <li>Provide and maintain our services</li>
                <li>Process your transactions</li>
                <li>Send you important updates and notifications</li>
                <li>Improve our platform and user experience</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2>4. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information.
                However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2>5. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at:
                <br />
                Email: hello@proply.co.za
                <br />
                Address: Innovation City, Darter Road, Longkloof Gardens, Cape Town, 8001
              </p>
            </section>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
