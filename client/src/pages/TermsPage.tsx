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
              Last updated: December 27, 2024
            </p>

            <section className="mb-8">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing and using Proply's services, you agree to be bound by these Terms of Service
                and all applicable laws and regulations.
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
                <li>API access for enterprise clients</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2>3. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials
                and for all activities under your account.
              </p>
            </section>

            <section className="mb-8">
              <h2>4. Subscription and Payments</h2>
              <p>
                Premium features require a paid subscription. Payments are processed securely, and
                subscriptions will automatically renew unless cancelled.
              </p>
            </section>

            <section className="mb-8">
              <h2>5. Data Usage</h2>
              <p>
                We respect your data privacy rights. How we collect and use your data is detailed
                in our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2>6. Contact Information</h2>
              <p>
                For questions about these terms, please contact us at:
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
