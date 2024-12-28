import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Proply Insights</h1>
            <p className="text-xl text-gray-600">
              Expert analysis and insights on property investment in South Africa
            </p>
          </div>

          {/* Featured Article */}
          <div className="mb-16">
            <Card className="overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 relative">
                <img
                  src="/images/blog/cape-town-rental.jpg"
                  alt="Cape Town Rental Property"
                  className="object-cover w-full"
                />
              </div>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  <Link href="/blog/introduction-to-investing-in-short-term-rentals-cape-town">
                    Introduction to Investing in Short-Term Rental Properties in Cape Town
                  </Link>
                </h2>
                <p className="text-gray-600 mb-6">
                  Discover the opportunities and challenges of investing in Cape Town's
                  thriving short-term rental market. Learn about location selection,
                  property management, and ROI optimization.
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">December 28, 2024</div>
                  <Link href="/blog/introduction-to-investing-in-short-term-rentals-cape-town">
                    <Button variant="outline">
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* More Articles Section (to be populated later) */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Placeholder for future articles */}
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
