import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-white">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pb-12 border-b">
          <div>
            <div className="mb-4">
              <img src="/proply-logo-auth.png" alt="Proply Logo" className="h-8 w-auto" />
            </div>
            <p className="text-gray-600 mb-8 max-w-md">
              AI-powered property intelligence for smarter real estate decisions. Trusted by insurers, agents, and property buyers.
            </p>
            <div className="space-y-2 text-gray-600">
              <p className="flex gap-2 items-center">
                <Mail className="h-4 w-4" />
                <a href="mailto:hello@proply.co.za" className="hover:text-proply-blue">
                  hello@proply.co.za
                </a>
              </p>
              <p>
                7 Darter Rd, Longkloof Gardens, Cape Town, 8001
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
            <div>
              <h3 className="mb-4 text-lg font-medium">Product</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="/property-analyzer" className="hover:text-proply-blue">
                    Property Analyzer
                  </Link>
                </li>
                <li>
                  <Link href="/rent-compare" className="hover:text-proply-blue">
                    Rent Compare
                  </Link>
                </li>
                <li>
                  <Link href="/deal-score" className="hover:text-proply-blue">
                    Deal Score
                  </Link>
                </li>
                <li>
                  <Link href="/risk-index" className="hover:text-proply-blue">
                    Risk Index
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-medium">Company</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="/about" className="hover:text-proply-blue">
                    About
                  </Link>
                </li>

                <li>
                  <Link href="/pricing" className="hover:text-proply-blue">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-proply-blue">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-proply-blue">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-medium">Solutions For</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="/insurers" className="hover:text-proply-blue">
                    Insurers
                  </Link>
                </li>
                <li>
                  <Link href="/for-agents" className="hover:text-proply-blue">
                    Agents
                  </Link>
                </li>
                <li className="flex">
                  <span className="hover:text-proply-blue">Buyers</span>
                  <span className="ml-1.5 text-proply-blue">(coming soon)</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="mb-4 text-lg font-medium">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="#" className="hover:text-proply-blue">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-proply-blue">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-proply-blue">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-gray-500">
          <p>© {currentYear} Proply. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}