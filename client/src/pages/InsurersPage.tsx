import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  BarChart3, 
  AlertTriangle, 
  CloudLightning, 
  Droplets, 
  AlertCircle,
  ArrowRight,
  Check
} from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { RiskIndexShowcase } from "@/components/risk-index-showcase";

export default function InsurersPage() {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Risk Index for Insurers | Proply</title>
        <meta name="description" content="Insurance-grade property risk intelligence for underwriters and insurance companies. Get comprehensive risk data for any property in South Africa." />
      </Helmet>
      
      <PublicHeader />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 to-proply-blue overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-grid-white pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-1 rounded-full bg-white/20 text-white text-sm font-medium mb-4">
                For Insurance Companies & Underwriters
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Property Risk Intelligence<br /> for Better Underwriting
              </h1>
              <p className="text-xl text-blue-100 max-w-lg mb-8">
                Get comprehensive risk assessment data for every property in South Africa, helping you make more accurate underwriting decisions and reduce claim costs.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-white hover:bg-gray-100 text-proply-blue">
                  Schedule a Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="hidden md:flex justify-end">
              <div className="relative w-full max-w-sm bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-5 bg-proply-blue/10">
                  <div className="flex items-center mb-3">
                    <Shield className="h-6 w-6 mr-2 text-proply-blue" />
                    <h3 className="font-bold text-lg">Proply Risk Index™</h3>
                  </div>
                  <div className="relative h-44 bg-white rounded-lg flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border-8 border-gray-100 relative">
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-bold text-proply-blue">42</span>
                        <span className="text-sm font-medium text-proply-blue">Medium Risk</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-white p-2 rounded text-center">
                      <div className="text-xl font-bold text-proply-blue">62%</div>
                      <div className="text-xs text-gray-500">Flood</div>
                    </div>
                    <div className="bg-white p-2 rounded text-center">
                      <div className="text-xl font-bold text-proply-blue">38%</div>
                      <div className="text-xs text-gray-500">Hail</div>
                    </div>
                    <div className="bg-white p-2 rounded text-center">
                      <div className="text-xl font-bold text-proply-blue">27%</div>
                      <div className="text-xs text-gray-500">Fire</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Key Features */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Detailed risk analytics for every property
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive data helps insurers price policies more accurately and reduce claims through preventative action.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                icon: CloudLightning,
                title: "Climate Risk Assessment",
                description: "Analyze exposure to hail, lightning, wind damage, and other climate-related risks based on historical data and climate forecasts."
              },
              {
                icon: Droplets,
                title: "Flood & Water Damage",
                description: "Detailed flood risk modeling by property location, elevation, drainage, and proximity to water bodies or flood zones."
              },
              {
                icon: AlertTriangle,
                title: "Security Risk Profiling",
                description: "Assessment of burglary, theft, and vandalism risk based on crime statistics, security features, and neighborhood factors."
              },
              {
                icon: AlertCircle,
                title: "Preventative Risk Alerts",
                description: "Actionable recommendations to mitigate property risks before they result in claims."
              },
              {
                icon: BarChart3,
                title: "Portfolio Risk Analysis",
                description: "Analyze concentration risk across your policy portfolio and identify risk patterns for better underwriting."
              },
              {
                icon: Shield,
                title: "Custom Risk Scoring",
                description: "Tailor risk models to your specific underwriting criteria and claims history for more accurate pricing."
              }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-xl border border-gray-200 hover:border-proply-blue hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-full bg-proply-blue/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-proply-blue" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Demo */}
        <div className="my-20 border-t border-b py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              See the Risk Index in action
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Try our interactive demo to experience how detailed risk insights can transform your underwriting process.
            </p>
          </div>

          {/* Embedded Risk Index Showcase */}
          <RiskIndexShowcase />
        </div>

        {/* Integration Options */}
        <div className="my-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Flexible integration options
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose how to incorporate Proply's risk data into your existing systems and workflows.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "API Integration",
                description: "Connect directly to our API for real-time risk assessments within your existing systems.",
                features: [
                  "REST API with comprehensive documentation",
                  "Batch processing for portfolio analysis",
                  "Webhook notifications for risk changes"
                ]
              },
              {
                title: "White-Labeled Portal",
                description: "A customized risk assessment portal that matches your brand and underwriting needs.",
                features: [
                  "Branded user experience",
                  "Customizable risk thresholds",
                  "Agent and underwriter access controls"
                ]
              },
              {
                title: "Data Exports",
                description: "Regular data feeds that can be imported into your actuarial and pricing models.",
                features: [
                  "CSV, JSON, or custom format exports",
                  "Scheduled or on-demand delivery",
                  "Historical data archives"
                ]
              }
            ].map((option, i) => (
              <div key={i} className="border rounded-xl overflow-hidden">
                <div className="p-6 border-b bg-gray-50">
                  <h3 className="text-xl font-bold">{option.title}</h3>
                  <p className="text-gray-600 mt-2">{option.description}</p>
                </div>
                <div className="p-6">
                  <h4 className="font-medium mb-4">Key Features:</h4>
                  <ul className="space-y-2">
                    {option.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-proply-blue shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="my-20">
          <div className="bg-gradient-to-r from-blue-900 to-proply-blue rounded-2xl overflow-hidden">
            <div className="p-10 md:p-16">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Ready to transform your property risk assessment?
                </h2>
                <p className="text-xl text-blue-100 mb-10">
                  Schedule a personalized demo to see how Proply's Risk Index can help your underwriting team make better decisions.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" className="bg-white hover:bg-gray-100 text-proply-blue">
                    Request Demo <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                    Contact Sales
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}