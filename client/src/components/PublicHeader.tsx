import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { DemoRequestModal } from "@/components/DemoRequestModal";

export default function PublicHeader() {
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  
  const openDemoModal = () => setIsDemoModalOpen(true);
  const closeDemoModal = () => setIsDemoModalOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <img src="/proply-logo-auth.png" alt="Proply Logo" className="h-8 w-auto" />
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/insurers" className="text-sm font-medium hover:text-proply-blue transition-colors">
              For Insurers
            </Link>
            <Link href="/agents" className="text-sm font-medium hover:text-proply-blue transition-colors">
              For Agents
            </Link>
            <a 
              href="https://dealscore.co.za/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium hover:text-proply-blue transition-colors flex items-center"
            >
              <span>For Buyers</span>
              <span className="ml-1.5 text-proply-blue">(new)</span>
            </a>
            <div className="relative group">
              <button className="text-sm font-medium hover:text-proply-blue transition-colors flex items-center gap-1">
                Resources
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute left-0 top-full mt-1 w-48 bg-white shadow-lg rounded-md overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border">
                <Link href="/market" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-proply-blue">
                  Market Data
                </Link>
                <Link href="/airbnb-yield-calculator" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-proply-blue">
                  Airbnb Yield Calculator
                </Link>
                <Link href="/deal-analyser" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-proply-blue">
                  Deal Analyser
                </Link>
              </div>
            </div>
            <Link href="/pricing" className="text-sm font-medium hover:text-proply-blue transition-colors">
              Pricing
            </Link>
            <Link href="/blog" className="text-sm font-medium hover:text-proply-blue transition-colors">
              Blog
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-proply-blue transition-colors">
              Contact
            </Link>
          </nav>
          
          <div className="flex items-center gap-2 lg:gap-4">
            <Link href="/login">
              <Button variant="outline" className="hidden lg:flex border-black text-black hover:bg-black/5">
                Login/Register
              </Button>
            </Link>
            <Button 
              className="hidden lg:flex bg-black hover:bg-gray-800 text-white"
              onClick={openDemoModal}
            >
              Book a Demo
            </Button>
            
            {/* Compact buttons for medium screens */}
            <Link href="/login" className="hidden md:block lg:hidden">
              <Button variant="outline" size="sm" className="border-black text-black hover:bg-black/5">
                Login
              </Button>
            </Link>
            <Button 
              size="sm"
              className="hidden md:flex lg:hidden bg-black hover:bg-gray-800 text-white"
              onClick={openDemoModal}
            >
              Book
            </Button>
            
            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="container py-4 space-y-3">
              <Link href="/insurers" className="block py-2 text-sm font-medium hover:text-proply-blue">
                For Insurers
              </Link>
              <Link href="/agents" className="block py-2 text-sm font-medium hover:text-proply-blue">
                For Agents
              </Link>
              <a 
                href="https://dealscore.co.za/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block py-2 text-sm font-medium hover:text-proply-blue flex items-center"
              >
                <span>For Buyers</span>
                <span className="ml-1.5 text-proply-blue">(new)</span>
              </a>
              <div className="py-2">
                <button className="flex items-center justify-between w-full text-sm font-medium hover:text-proply-blue" 
                        onClick={(e) => {
                          e.preventDefault();
                          const submenu = e.currentTarget.nextElementSibling;
                          if (submenu) {
                            submenu.classList.toggle('hidden');
                          }
                        }}>
                  <span>Resources</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div className="hidden ml-4 mt-2 space-y-2">
                  <Link href="/market" className="block py-2 pl-2 text-sm text-gray-700 border-l-2 border-gray-200 hover:border-proply-blue hover:text-proply-blue">
                    Market Data
                  </Link>
                  <Link href="/airbnb-yield-calculator" className="block py-2 pl-2 text-sm text-gray-700 border-l-2 border-gray-200 hover:border-proply-blue hover:text-proply-blue">
                    Airbnb Yield Calculator
                  </Link>
                  <Link href="/deal-analyser" className="block py-2 pl-2 text-sm text-gray-700 border-l-2 border-gray-200 hover:border-proply-blue hover:text-proply-blue">
                    Deal Analyser
                  </Link>
                </div>
              </div>
              <Link href="/pricing" className="block py-2 text-sm font-medium hover:text-proply-blue">
                Pricing
              </Link>
              <Link href="/blog" className="block py-2 text-sm font-medium hover:text-proply-blue">
                Blog
              </Link>
              <Link href="/contact" className="block py-2 text-sm font-medium hover:text-proply-blue">
                Contact
              </Link>
              <div className="pt-4 flex flex-col space-y-3">
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full justify-center border-black text-black hover:bg-black/5">
                    Login/Register
                  </Button>
                </Link>
                <Button 
                  className="w-full justify-center bg-black hover:bg-gray-800 text-white"
                  onClick={openDemoModal}
                >
                  Book a Demo
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
      
      {/* Demo Request Modal */}
      <DemoRequestModal isOpen={isDemoModalOpen} onClose={closeDemoModal} />
    </>
  );
}