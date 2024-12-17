import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
  LogOut,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";

export default function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const [location] = useLocation();
  const { user, logout } = useUser();

  const navItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/",
    },
    {
      title: "Properties",
      icon: Building2,
      href: "/properties",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/settings",
    },
  ];

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 bg-white transition-all duration-300 border-none", 
        expanded ? "w-64" : "w-16"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header with logo */}
        <div className="p-4 flex justify-between items-center">
          <img
            src={expanded ? "/proply-logo.png" : "/proply-favicon.png"}
            alt="Proply"
            className={cn(
              "transition-all duration-300",
              expanded ? "w-24" : "w-8"
            )}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className="text-black hover:bg-gray-600"
          >
            {expanded ? (
              <ChevronLeft className="h-4 w-4 text-black" />
            ) : (
              <ChevronRight className="h-4 w-4 text-black" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    "hover:bg-gray-100",
                    isActive
                      ? "bg-gray-200 text-black"
                      : "text-black/80"
                  )}
                >
                  <Icon className="h-5 w-5 text-black" />
                  {expanded && <span className="text-black">{item.title}</span>}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full bg-gray-100 text-black flex items-center justify-center"
            >
              {user?.username.charAt(0).toUpperCase()}
            </div>
            {expanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black truncate">
                  {user?.username}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-black/80 hover:text-black -ml-3"
                  onClick={() => logout()}
                >
                  <LogOut className="h-3 w-3 mr-1 text-black" />
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