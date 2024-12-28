import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function PublicFooter() {
  return (
    <footer className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <img src="/proply-logo-1.png" alt="Proply" className="h-8 mb-4" />
            <p className="text-gray-600 mb-4">
              Empowering you with data-driven insights for strategic
              decision-making in real estate.
            </p>
            <p className="text-gray-600 mb-2">
              Address: Innovation City, Darter Road, Longkloof Gardens, Cape Town, 8001
            </p>
            <p className="text-gray-600">
              Email: hello@proply.co.za
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Subscribe to Our Newsletter</h3>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1BA3FF]"
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>

        <div className="border-t pt-8 text-sm text-gray-600">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <p>© 2024 Proply. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/">Home</Link>
              <span>|</span>
              <Link href="/property-analyzer">Property Analyzer</Link>
              <span>|</span>
              <Link href="/rent-compare">Rent Compare</Link>
              <span>|</span>
              <Link href="/pricing">Pricing</Link>
              <span>|</span>
              <Link href="/contact">Contact</Link>
              <span>|</span>
              <Link href="/privacy">Privacy Policy</Link>
              <span>|</span>
              <Link href="/terms">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}