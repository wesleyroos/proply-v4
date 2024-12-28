import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function PublicHeader() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <img src="/proply-logo-1.png" alt="Proply" className="h-8 cursor-pointer" />
            </Link>
          </div>

          {/* Navigation Links - Centered */}
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link href="/property-analyzer">
              <Button variant="ghost">Property Analyzer</Button>
            </Link>
            <Link href="/rent-compare">
              <Button variant="ghost">Rent Compare</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost">Contact</Button>
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-[#1BA3FF] hover:bg-[#114D9D]">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}