import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BarChart2, Calculator, Clock, Search } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img src="/proply-logo-1.png" alt="Proply" className="h-8" />
            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-[#1BA3FF] hover:bg-[#114D9D]">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-16 sm:pt-32 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900">
              Make Smarter Property
              <span className="text-[#1BA3FF]"> Investment Decisions</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-gray-600">
              Analyze and compare long-term vs short-term rental strategies with data-driven insights to maximize your property's earning potential.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-[#1BA3FF] hover:bg-[#114D9D]">
                  Start Free Analysis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Statement */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">The Challenge</h2>
            <p className="mt-4 text-xl text-gray-600">
              Property investors face critical decisions that impact their returns
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <Clock className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">Time-Consuming Research</h3>
                <p className="text-gray-600">
                  Hours spent gathering market data and comparing different rental strategies
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Calculator className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">Complex Calculations</h3>
                <p className="text-gray-600">
                  Difficult to accurately calculate potential returns and break-even points
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Search className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">Unreliable Data</h3>
                <p className="text-gray-600">
                  Limited access to accurate market insights and revenue projections
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">The Solution</h2>
            <p className="mt-4 text-xl text-gray-600">
              Proply provides comprehensive analysis tools for confident decision-making
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <BarChart2 className="h-12 w-12 text-[#1BA3FF]" />
                <h3 className="text-xl font-semibold">Data-Driven Insights</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Real-time market revenue data</li>
                  <li>• Accurate occupancy rate predictions</li>
                  <li>• Comprehensive fee analysis</li>
                  <li>• Break-even point calculations</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Calculator className="h-12 w-12 text-[#1BA3FF]" />
                <h3 className="text-xl font-semibold">Smart Comparison Tools</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Side-by-side strategy comparison</li>
                  <li>• Monthly and annual revenue projections</li>
                  <li>• Management fee impact analysis</li>
                  <li>• Exportable property reports</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#1BA3FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Optimize Your Property Investment?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of property investors making data-driven decisions with Proply
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="bg-white text-[#1BA3FF] hover:bg-gray-100">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
