import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
  LogOut,
  Building2,
  Library,
  Users,
  Ticket,
  Calculator,

  ToggleLeft,
  BarChart2,

  Database, // Add this import for the PropData listings icon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";

export default function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const [location, setLocation] = useLocation();
  const { user, logout } = useUser();

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      title: "Property Analyzer",
      icon: Calculator,
      href: "/dashboard/property-analyzer",
    },

    {
      title: "Rent Compare",
      icon: Building2,
      href: "/dashboard/rent-compare",
    },

    {
      title: "Properties",
      icon: Library,
      href: "/properties",
    },
  ];

  // Add PropData Listings for admins
  if (user?.isAdmin || user?.role === 'franchise_admin' || user?.role === 'branch_admin') {
    navItems.push({
      title: "PropData Listings",
      icon: Database,
      href: "/propdata-listings",
    });
  }

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 bg-[#1E293B] transition-all duration-300 border-none",
        expanded ? "w-64" : "w-16"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header with logo */}
        <div className="p-4 flex justify-between items-center">
          <Link href="/">
            <img
              src={expanded ? "/proply-logo.png" : "/proply-favicon.png"}
              alt="Proply"
              className={cn(
                "transition-all duration-300 cursor-pointer",
                expanded ? "w-24" : "w-8"
              )}
            />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className="text-white hover:bg-white/10"
          >
            {expanded ? (
              <ChevronLeft className="h-4 w-4 text-white" />
            ) : (
              <ChevronRight className="h-4 w-4 text-white" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;

            if (item.adminOnly && !user?.isAdmin) {
              return null;
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  "hover:bg-white/10",
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/80"
                )}
              >
                <Icon className="h-5 w-5 text-white" />
                {expanded && <span className="text-white">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Admin and Settings links */}
        <div className="mt-auto p-2 space-y-1">
          {user?.isAdmin && (
            <>
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  "hover:bg-white/10 text-white/80"
                )}
              >
                <Users className="h-5 w-5 text-white" />
                {expanded && <span className="text-white">User Management</span>}
              </Link>
              <Link
                href="/propdata-listings"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  "hover:bg-white/10 text-white/80",
                  location === "/propdata-listings" ? "bg-white/20 text-white" : ""
                )}
              >
                <Database className="h-5 w-5 text-white" />
                {expanded && <span className="text-white">PropData Listings</span>}
              </Link>
              <Link
                href="/analytics"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  "hover:bg-white/10 text-white/80",
                  location === "/analytics" ? "bg-white/20 text-white" : ""
                )}
              >
                <BarChart2 className="h-5 w-5 text-white" />
                {expanded && <span className="text-white">Analytics</span>}
              </Link>
              <Link
                href="/dashboard/control-panel"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  "hover:bg-white/10 text-white/80",
                  location === "/dashboard/control-panel" ? "bg-white/20 text-white" : ""
                )}
              >
                <ToggleLeft className="h-5 w-5 text-white" />
                {expanded && <span className="text-white">Control Panel</span>}
              </Link>
              <Link
                href="/access-codes"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  "hover:bg-white/10 text-white/80"
                )}
              >
                <Ticket className="h-5 w-5 text-white" />
                {expanded && <span className="text-white">Access Codes</span>}
              </Link>
            </>
          )}
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
              "hover:bg-white/10 text-white/80"
            )}
          >
            <Settings className="h-5 w-5 text-white" />
            {expanded && <span className="text-white">Settings</span>}
          </Link>
        </div>

        {/* User section */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center"
            >
              {user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase()}
            </div>
            {expanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName || user?.username}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-white/80 -ml-3"
                  onClick={handleLogout}
                >
                  <LogOut className="h-3 w-3 mr-1 text-white" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}