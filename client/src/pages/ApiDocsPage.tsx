import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

function CodeBlock({ children, language }: { children: string; language?: string }) {
  return (
    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function EndpointCard({
  method,
  path,
  title,
  description,
  children,
}: {
  method: string;
  path: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const methodColors: Record<string, string> = {
    GET: "bg-green-100 text-green-800",
    POST: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${methodColors[method] || "bg-gray-100 text-gray-800"}`}>
            {method}
          </span>
          <code className="text-sm font-mono text-gray-700">{path}</code>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mt-3">{title}</h3>
        <p className="text-gray-600 mt-1">{description}</p>
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </div>
  );
}

function ParamTable({ rows }: { rows: Array<{ name: string; type: string; required: boolean; description: string }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 pr-4 font-medium text-gray-500">Parameter</th>
            <th className="text-left py-2 pr-4 font-medium text-gray-500">Type</th>
            <th className="text-left py-2 pr-4 font-medium text-gray-500">Required</th>
            <th className="text-left py-2 font-medium text-gray-500">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-gray-100">
              <td className="py-2 pr-4 font-mono text-sm text-gray-900">{row.name}</td>
              <td className="py-2 pr-4 text-gray-600">{row.type}</td>
              <td className="py-2 pr-4">
                {row.required ? (
                  <span className="text-xs font-medium text-red-600">Required</span>
                ) : (
                  <span className="text-xs text-gray-400">Optional</span>
                )}
              </td>
              <td className="py-2 text-gray-600">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Partner API</h1>
            <p className="text-lg text-gray-600 mb-6">
              Integrate Proply's property valuation reports directly into your platform.
              Generate reports on demand and embed them in your listings.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Base URL:</strong>{" "}
                <code className="bg-blue-100 px-2 py-0.5 rounded font-mono">https://proply.co.za/api/partner</code>
              </p>
            </div>
          </div>

          {/* Authentication */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication</h2>
            <p className="text-gray-600 mb-4">
              All requests require an API key sent via the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">x-api-key</code> header.
              Your key is tied to your agency branch and scopes all requests to your own listings.
            </p>
            <CodeBlock>{`x-api-key: your-api-key-here`}</CodeBlock>
            <p className="text-sm text-gray-500 mt-3">
              Contact <a href="mailto:wesley@proply.co.za" className="text-blue-600 hover:underline">wesley@proply.co.za</a> to get your API key.
            </p>
          </section>

          {/* Endpoints */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Endpoints</h2>
            <div className="space-y-8">

              {/* Generate Report */}
              <EndpointCard
                method="POST"
                path="/api/partner/generate-report"
                title="Generate Report"
                description="Triggers the full Proply valuation pipeline for a property listing and returns the report preview URL."
              >
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Request Body</h4>
                  <ParamTable rows={[
                    { name: "propertyId", type: "string", required: true, description: "The property ID from your listing system (matches synced data)" },
                  ]} />
                  <div className="mt-3">
                    <CodeBlock>{`{
  "propertyId": "PROSPR-12345"
}`}</CodeBlock>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Response</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Returns the report URL immediately. If a report was previously generated, it returns the existing one without re-running the pipeline.
                  </p>
                  <CodeBlock>{`// Report generated
{
  "status": "completed",
  "reportUrl": "https://proply.co.za/report/PROSPR-12345",
  "propertyId": "PROSPR-12345",
  "generatedAt": "2026-04-10T10:30:00.000Z"
}

// Report already existed
{
  "status": "existing",
  "reportUrl": "https://proply.co.za/report/PROSPR-12345",
  "propertyId": "PROSPR-12345",
  "generatedAt": "2026-04-08T14:20:00.000Z"
}`}</CodeBlock>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Response Fields</h4>
                  <ParamTable rows={[
                    { name: "status", type: "string", required: true, description: '"completed" (freshly generated) or "existing" (already existed)' },
                    { name: "reportUrl", type: "string", required: true, description: "Full URL to the interactive report preview page" },
                    { name: "propertyId", type: "string", required: true, description: "The property ID you sent" },
                    { name: "generatedAt", type: "string", required: true, description: "ISO 8601 timestamp of when the report was created" },
                  ]} />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Processing time:</strong> Report generation takes 15-30 seconds as it runs AI image analysis, comparable sales lookup, rental market analysis, and financial projections. Set your HTTP client timeout to at least 60 seconds.
                  </p>
                </div>
              </EndpointCard>

              {/* Report Status */}
              <EndpointCard
                method="GET"
                path="/api/partner/report-status/:propertyId"
                title="Check Report Status"
                description="Check whether a report has already been generated for a property. Returns instantly."
              >
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">URL Parameters</h4>
                  <ParamTable rows={[
                    { name: "propertyId", type: "string", required: true, description: "The property ID to check" },
                  ]} />
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Response</h4>
                  <CodeBlock>{`// Report available
{
  "status": "available",
  "reportUrl": "https://proply.co.za/report/PROSPR-12345",
  "propertyId": "PROSPR-12345",
  "generatedAt": "2026-04-10T10:30:00.000Z"
}

// No report yet
{
  "status": "not_generated",
  "propertyId": "PROSPR-12345"
}`}</CodeBlock>
                </div>
              </EndpointCard>

              {/* List Listings */}
              <EndpointCard
                method="GET"
                path="/api/partner/listings"
                title="List Listings"
                description="Retrieve all synced listings for your agency. Use this to discover which propertyId values are available."
              >
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Response</h4>
                  <CodeBlock>{`{
  "listings": [
    {
      "propertyId": "PROSPR-12345",
      "address": "12 Main Road, Sea Point, Cape Town",
      "price": "3500000",
      "bedrooms": 2,
      "bathrooms": 2,
      "propertyType": "Apartment",
      "status": "active"
    }
  ],
  "count": 1
}`}</CodeBlock>
                </div>
              </EndpointCard>
            </div>
          </section>

          {/* Error Responses */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Responses</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-2 pr-4 font-medium text-gray-500">Error</th>
                    <th className="text-left py-2 font-medium text-gray-500">When</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-mono">400</td>
                    <td className="py-2 pr-4">propertyId is required</td>
                    <td className="py-2">Missing propertyId in request body</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-mono">401</td>
                    <td className="py-2 pr-4">Missing x-api-key header</td>
                    <td className="py-2">No API key provided</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-mono">401</td>
                    <td className="py-2 pr-4">Invalid API key</td>
                    <td className="py-2">API key doesn't match any agency</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-mono">403</td>
                    <td className="py-2 pr-4">Agency is inactive</td>
                    <td className="py-2">Agency account is deactivated</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-mono">404</td>
                    <td className="py-2 pr-4">Property not found</td>
                    <td className="py-2">Property ID not found in your listings</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-mono">500</td>
                    <td className="py-2 pr-4">Report generation failed</td>
                    <td className="py-2">Server-side error during generation</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* The Report URL */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Report URL</h2>
            <p className="text-gray-600 mb-4">
              The <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">reportUrl</code> returned by the API is a fully interactive web page that includes:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
              <li>Property overview with images</li>
              <li>AI-powered valuation (Conservative / Midline / Optimistic)</li>
              <li>Comparable sales analysis from title deed records</li>
              <li>Rental performance (short-term and long-term yields)</li>
              <li>Financial projections (cashflow, appreciation, financing)</li>
              <li>Your agency's branding (logo and colours)</li>
              <li>PDF download button</li>
            </ul>
            <p className="text-gray-600">
              The page is publicly accessible and optimised for sharing with Open Graph meta tags. You can embed it or link to it anywhere in your system.
            </p>
          </section>

          {/* Code Examples */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Code Examples</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">cURL</h3>
                <CodeBlock>{`# Generate a report
curl -X POST https://proply.co.za/api/partner/generate-report \\
  -H "x-api-key: your-api-key-here" \\
  -H "Content-Type: application/json" \\
  -d '{"propertyId": "PROSPR-12345"}'

# Check report status
curl https://proply.co.za/api/partner/report-status/PROSPR-12345 \\
  -H "x-api-key: your-api-key-here"

# List your synced listings
curl https://proply.co.za/api/partner/listings \\
  -H "x-api-key: your-api-key-here"`}</CodeBlock>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">JavaScript / Node.js</h3>
                <CodeBlock>{`const API_KEY = "your-api-key-here";
const BASE_URL = "https://proply.co.za/api/partner";

async function generateReport(propertyId) {
  const response = await fetch(\`\${BASE_URL}/generate-report\`, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ propertyId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error);
  }

  // data.reportUrl is the link to embed in your listing
  return data;
}

// Usage
const result = await generateReport("PROSPR-12345");
console.log(result.reportUrl);
// → "https://proply.co.za/report/PROSPR-12345"`}</CodeBlock>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">PHP (Laravel)</h3>
                <CodeBlock>{`use Illuminate\\Support\\Facades\\Http;

$response = Http::withHeaders([
    'x-api-key' => config('services.proply.api_key'),
])->post('https://proply.co.za/api/partner/generate-report', [
    'propertyId' => $listing->prospr_id,
]);

$data = $response->json();
$reportUrl = $data['reportUrl'];
// Store $reportUrl on the listing for agents to access`}</CodeBlock>
              </div>
            </div>
          </section>

          {/* Integration Flow */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Typical Integration Flow</h2>
            <div className="space-y-4">
              {[
                { step: 1, title: "Agent clicks \"Get Valuation Report\"", desc: "On a listing page in your system" },
                { step: 2, title: "Your backend calls the API", desc: "POST /api/partner/generate-report with the listing's property ID" },
                { step: 3, title: "Show a loading state", desc: "The pipeline takes 15-30 seconds to analyse images, pull comparable sales, and calculate financials" },
                { step: 4, title: "Store the report URL", desc: "Save the reportUrl against the listing in your database" },
                { step: 5, title: "Show \"View Report\" button", desc: "The agent clicks through to the full interactive report with PDF download" },
                { step: 6, title: "Subsequent requests are instant", desc: "Use GET /report-status/:propertyId to check if a report already exists" },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{title}</p>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Rate Limits */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Rate Limits</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li><strong>10 concurrent requests</strong> per API key</li>
              <li><strong>100 reports per day</strong> per agency (contact us to increase)</li>
            </ul>
          </section>

          {/* Support */}
          <section className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Support</h2>
            <p className="text-gray-600">
              For API key provisioning, issues, or feature requests:{" "}
              <a href="mailto:wesley@proply.co.za" className="text-blue-600 hover:underline">
                wesley@proply.co.za
              </a>
            </p>
          </section>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
