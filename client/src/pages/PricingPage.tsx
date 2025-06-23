import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Shield, BarChart3, Database, ExternalLink } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Smart Property Data Solutions — Choose the Right Product for You
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Whether you're an insurer, investor, or agency, Proply offers the right intelligence tools to power your property decisions.
          </p>
        </div>

        {/* Traditional SaaS Options Section */}
        <div className="mb-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">Free and Pro SaaS Options</h2>
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <p className="text-gray-700 mb-4">
              Create a profile to access our property analysis tools directly through our platform:
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 mt-6">
              {/* Free Tier */}
              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Free</h3>
                <p className="text-2xl font-bold mb-2">R0<span className="text-sm font-normal text-gray-600">/month</span></p>
                <p className="text-gray-600 mb-4">Perfect for getting started</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                    <span>Basic property analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                    <span>3 analyses per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                    <span>Standard support</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-black hover:bg-gray-800 text-white" asChild>
                  <Link href="/register?plan=free">Get Started</Link>
                </Button>
              </div>
              
              {/* Pro Tier */}
              <div className="border border-black rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Pro</h3>
                <p className="text-2xl font-bold mb-2">R2000<span className="text-sm font-normal text-gray-600">/month</span></p>
                <p className="text-gray-600 mb-4">For investors and property managers</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                    <span>Advanced property analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                    <span>Unlimited analyses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                    <span>Custom reports</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-black hover:bg-gray-800 text-white" asChild>
                  <Link href="/register?plan=pro">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Products Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">Our Products</h2>
          <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
            Choose the specific product that best fits your property intelligence needs
          </p>
        </div>
        
        {/* Products Section */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {/* Risk Index */}
          <Card className="relative border-gray-200 hover:border-black transition-colors">
            <CardHeader>
              <div className="mb-4 p-2 w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <Shield className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Risk Index</CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                AI-powered risk scoring & insurance underwriting insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Comprehensive risk scoring for any property</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Neighborhood safety and market stability analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Investment risk mitigation recommendations</span>
                </li>
              </ul>
              <Button className="w-full bg-black hover:bg-gray-800 text-white" asChild>
                <Link href="/contact">Contact for Pricing</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Property Analyzer API */}
          <Card className="relative border-black">
            <CardHeader>
              <div className="mb-4 p-2 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Property Analyzer API</CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Full API for automated property investment analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Full API access for property analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Automated financial modeling and ROI calculations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Custom integration and technical support</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-black hover:bg-gray-800 text-white"
                asChild
              >
                <Link href="/contact">Contact for Pricing</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Deal Score */}
          <Card className="relative border-gray-200 hover:border-black transition-colors">
            <CardHeader>
              <div className="mb-4 p-2 w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Deal Score</CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Fast, on-demand deal analysis for buyers & investors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Comprehensive deal opportunity scoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Market comparison and competitive analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Investment potential visualization</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-black hover:bg-gray-800 text-white"
                asChild
              >
                <a href="https://dealscore.co.za/" target="_blank" rel="noopener noreferrer">
                  Buy Reports
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <p className="text-xs text-center mt-2 text-gray-500">
                Available at dealscore.co.za
              </p>
            </CardContent>
          </Card>

        </div>

        {/* How Pricing Works Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">How Pricing Works</h2>
          
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-3">Enterprise Solutions</h3>
              <p className="text-gray-700">
                <strong>Risk Index & Property Analyzer API</strong> are priced according to enterprise needs, based on:
              </p>
              <ul className="mt-4 space-y-2 ml-6 list-disc text-gray-600">
                <li>API usage volume</li>
                <li>Integration complexity</li>
                <li>Support requirements</li>
                <li>Custom feature development</li>
              </ul>
              <p className="mt-4 text-gray-600">
                Our team will create a custom pricing proposal based on your specific requirements.
              </p>
            </div>
            
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-xl font-semibold mb-3">Deal Score - Simple Per-Report Pricing</h3>
              <p className="text-gray-700">
                <strong>Deal Score</strong> will follow a simple pay-per-report model:
              </p>
              <div className="mt-4 bg-gray-50 p-4 rounded-lg inline-block">
                <span className="text-2xl font-bold">R89</span>
                <span className="text-gray-600 ml-2">per report</span>
              </div>
              <p className="mt-4 text-gray-600">
                Pay only for what you need with no subscription required.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">How is Proply priced?</h3>
              <p className="text-gray-600">
                Enterprise tools (Risk Index, Analyzer API) are priced based on usage and support needs. Deal Score is a simple pay-per-report model.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Who are your products for?</h3>
              <p className="text-gray-600">
                Insurers, real estate agencies, investors, mortgage originators, and property buyers.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Can I try before committing?</h3>
              <p className="text-gray-600">
                Contact us for a live demo or free trial consultation.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Where do I buy Deal Score reports?</h3>
              <p className="text-gray-600">
                You will be able to purchase reports at dealscore.co.za.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-20 bg-gray-100 rounded-xl p-8 max-w-4xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-gray-600 mb-6">
              Our team can help you choose the right product and create a tailored solution for your specific needs.
            </p>
            <Button className="bg-black hover:bg-gray-800 text-white px-8" asChild>
              <Link href="/contact">Contact Our Team</Link>
            </Button>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}