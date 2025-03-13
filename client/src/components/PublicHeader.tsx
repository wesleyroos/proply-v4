import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export default function PublicHeader() {
  const { user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white z-50 border-b min-w-[320px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
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
          <div className={`${isMobile ? (isMenuOpen ? 'absolute top-16 left-0 right-0 bg-white border-b' : 'hidden') : 'flex'} ${isMobile ? 'flex-col p-4 space-y-2' : 'items-center gap-4'}`}>
            <Link href="/">
              <Button variant="ghost" className={isMobile ? 'w-full justify-start' : ''}>Home</Button>
            </Link>
            <Link href="/property-analyzer">
              <Button variant="ghost" className={isMobile ? 'w-full justify-start' : ''}>Property Analyzer</Button>
            </Link>
            <Link href="/rent-compare">
              <Button variant="ghost" className={isMobile ? 'w-full justify-start' : ''}>Rent Compare</Button>
            </Link>

            {/* Resources Navigation Menu */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="p-4 w-[200px]">
                      <Link href="/airbnb-yield-calculator">
                        <NavigationMenuLink className="block p-2 hover:bg-accent rounded-md cursor-pointer">
                          Yield Calculator
                        </NavigationMenuLink>
                      </Link>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

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
                    <Link href="/deal-score-calculator">
                      <Button variant="outline" className="w-full mt-2">
                        Deal Score™
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