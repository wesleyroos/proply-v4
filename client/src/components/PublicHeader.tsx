
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function PublicHeader() {
  const { user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

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

          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}

          {/* Navigation Links - Hidden on mobile unless menu is open */}
          <div className={`${isMobile ? (isMenuOpen ? 'fixed top-16 left-0 right-0 bg-white border-b' : 'hidden') : 'flex'} ${isMobile ? 'flex-col p-4 space-y-2 w-full' : 'items-center gap-4'}`}>
            <Link href="/">
              <Button variant="ghost" className={isMobile ? 'w-full justify-start' : ''}>Home</Button>
            </Link>
            <Link href="/property-analyzer">
              <Button variant="ghost" className={isMobile ? 'w-full justify-start' : ''}>Property Analyzer</Button>
            </Link>
            <Link href="/rent-compare">
              <Button variant="ghost" className={isMobile ? 'w-full justify-start' : ''}>Rent Compare</Button>
            </Link>
            <Link href="/blog">
              <Button variant="ghost" className={isMobile ? 'w-full justify-start' : ''}>Blog</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" className={isMobile ? 'w-full justify-start' : ''}>Pricing</Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" className={isMobile ? 'w-full justify-start' : ''}>Contact</Button>
            </Link>

            {/* Auth Buttons */}
            {isMobile && (
              <div className={`${isMobile ? 'flex flex-col space-y-2' : 'flex gap-4'}`}>
                {user ? (
                  <Link href="/dashboard">
                    <Button className="bg-[#1BA3FF] hover:bg-[#114D9D] w-full">
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" className="w-full">Login</Button>
                    </Link>
                    <Link href="/register">
                      <Button className="bg-[#1BA3FF] hover:bg-[#114D9D] w-full">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Auth Buttons - Only show on desktop */}
          {!isMobile && (
            <div className="flex gap-4">
              {user ? (
                <Link href="/dashboard">
                  <Button className="bg-[#1BA3FF] hover:bg-[#114D9D]">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-[#1BA3FF] hover:bg-[#114D9D]">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
