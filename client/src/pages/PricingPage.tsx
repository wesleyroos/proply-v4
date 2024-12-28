import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600">Choose the plan that's right for you</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <Card className="relative">
            <CardHeader>
              <CardTitle>
                <h3 className="text-2xl font-bold">Free</h3>
                <p className="text-sm font-normal text-gray-600 mt-2">Perfect for getting started</p>
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
              <Button className="w-full mt-8" variant="outline" asChild>
                <Link href="/register?plan=free">Get Started</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Pro Tier */}
          <Card className="relative border-[#1BA3FF]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1BA3FF] text-white px-4 py-1 rounded-full text-sm">
              Most Popular
            </div>
            <CardHeader>
              <CardTitle>
                <h3 className="text-2xl font-bold">Pro</h3>
                <p className="text-sm font-normal text-gray-600 mt-2">For serious investors</p>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-8">
                <p className="text-3xl font-bold">R2,000</p>
                <p className="text-sm text-gray-600">per month</p>
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
              <Button className="w-full mt-8 bg-[#1BA3FF] hover:bg-[#114D9D]" asChild>
                <Link href="/register?plan=pro">Get Started</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise/API Tier */}
          <Card className="relative">
            <CardHeader>
              <CardTitle>
                <h3 className="text-2xl font-bold">Enterprise API</h3>
                <p className="text-sm font-normal text-gray-600 mt-2">For real estate platforms</p>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-8">
                <p className="text-3xl font-bold">Custom</p>
                <p className="text-sm text-gray-600">contact for pricing</p>
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
              <Button className="w-full mt-8" variant="outline" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}