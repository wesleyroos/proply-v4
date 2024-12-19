import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ComparisonPage from "./pages/ComparisonPage";
import PropertiesPage from "./pages/PropertiesPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
import AccessCodePage from "./pages/AccessCodePage";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import PropertyAnalyzerPage from "./pages/PropertyAnalyzerPage";
import { useUser } from "./hooks/use-user";
import Sidebar from "./components/Sidebar";

// Protected route wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      // Store the attempted URL to redirect back after login
      const currentPath = window.location.pathname;
      sessionStorage.setItem('redirectUrl', currentPath);
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        <Component />
      </main>
    </div>
  );
}

// fallback 404 not found page
function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            The page you're looking for doesn't exist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function App() {
  return (
    <>
      <TooltipProvider>
        <Switch>
          {/* Public routes */}
          <Route path="/" component={HomePage} />
          <Route path="/login" component={AuthPage} />
          <Route path="/register" component={AuthPage} />

          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            component={() => <ProtectedRoute component={DashboardPage} />} 
          />
          <Route 
            path="/analyzer" 
            component={() => <ProtectedRoute component={PropertyAnalyzerPage} />} 
          />
          <Route 
            path="/compare" 
            component={() => <ProtectedRoute component={ComparisonPage} />} 
          />
          <Route 
            path="/properties" 
            component={() => <ProtectedRoute component={PropertiesPage} />} 
          />
          <Route 
            path="/settings" 
            component={() => <ProtectedRoute component={SettingsPage} />} 
          />
          <Route 
            path="/admin" 
            component={() => <ProtectedRoute component={AdminPage} />} 
          />
          <Route 
            path="/access-codes" 
            component={() => <ProtectedRoute component={AccessCodePage} />} 
          />
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
      <Toaster />
    </>
  );
}

export default App;
