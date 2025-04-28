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
            Property Intelligence Solutions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the product and plan that best suits your real estate investment needs
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
                AI-powered property risk assessment for safer investments
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
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-sm">
              Most Popular
            </div>
            <CardHeader>
              <div className="mb-4 p-2 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Property Analyzer API</CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Integrate powerful property analysis into your platform
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
                Advanced deal evaluation and opportunity scoring
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
              <Button className="w-full bg-gray-300 text-gray-700 cursor-not-allowed" disabled>
                Coming Soon
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-center mt-2 text-gray-500">
                Will be available at dealscore.co.za
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Usage Tiers Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>
          
          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <Card className="relative">
              <CardHeader>
                <CardTitle>
                  <h3 className="text-2xl font-bold">Basic</h3>
                  <p className="text-sm font-normal text-gray-600 mt-2">
                    Perfect for getting started
                  </p>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-8">
                  <p className="text-3xl font-bold">R0</p>
                  <p className="text-sm text-gray-600">per month</p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Basic property analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>3 analyses per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Standard support</span>
                  </li>
                </ul>
                <Button className="w-full mt-8 bg-black hover:bg-gray-800 text-white" asChild>
                  <Link href="/register?plan=free">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="relative border-black">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 rounded-full text-sm">
                Most Popular
              </div>
              <CardHeader>
                <CardTitle>
                  <h3 className="text-2xl font-bold">Pro</h3>
                  <p className="text-sm font-normal text-gray-600 mt-2">
                    For investors and property managers
                  </p>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-8">
                  <p className="text-lg text-gray-700">Contact for pricing</p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Advanced property analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Unlimited analyses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Custom reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Market insights</span>
                  </li>
                </ul>
                <Button
                  className="w-full mt-8 bg-black hover:bg-gray-800 text-white"
                  asChild
                >
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise/API Tier */}
            <Card className="relative">
              <CardHeader>
                <CardTitle>
                  <h3 className="text-2xl font-bold">Enterprise</h3>
                  <p className="text-sm font-normal text-gray-600 mt-2">
                    For real estate platforms
                  </p>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-8">
                  <p className="text-lg text-gray-700">Custom solution</p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Full API access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Automated analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Custom integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Dedicated support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>SLA guarantee</span>
                  </li>
                </ul>
                <Button className="w-full mt-8 bg-black hover:bg-gray-800 text-white" asChild>
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-24 bg-gray-100 rounded-xl p-8 max-w-4xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Need a custom solution?</h2>
            <p className="text-gray-600 mb-6">
              Our team can create a tailored package for your specific real estate investment needs.
            </p>
            <Button className="bg-black hover:bg-gray-800 text-white px-8" asChild>
              <Link href="/contact">Contact Our Sales Team</Link>
            </Button>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}