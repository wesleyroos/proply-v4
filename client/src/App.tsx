import { Switch, Route, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import ComparisonPage from "./pages/ComparisonPage";
import PropertiesPage from "./pages/PropertiesPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
import AccessCodePage from "./pages/AccessCodePage";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import { useUser } from "./hooks/use-user";
import Sidebar from "./components/Sidebar";

// Protected route wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
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

// Create a higher-order component for protected routes
const withProtection = (Component: React.ComponentType) => () => (
  <ProtectedRoute component={Component} />
);

function App() {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();
  const currentPath = window.location.pathname;
  const isPublicRoute = currentPath === "/" || 
    currentPath.startsWith("/login") || 
    currentPath.startsWith("/register");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Check auth status for protected routes
  if (!user && !isPublicRoute) {
    setLocation("/login");
    return null;
  }

  return (
    <>
      <Switch>
        {/* Public routes */}
        <Route path="/" component={HomePage} />
        <Route path="/login" component={AuthPage} />
        <Route path="/register" component={AuthPage} />

        {/* Protected routes */}
        <Route path="/dashboard" component={withProtection(DashboardPage)} />
        <Route path="/compare" component={withProtection(ComparisonPage)} />
        <Route path="/properties" component={withProtection(PropertiesPage)} />
        <Route path="/settings" component={withProtection(SettingsPage)} />
        <Route path="/admin" component={withProtection(AdminPage)} />
        <Route path="/access-codes" component={withProtection(AccessCodePage)} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-[#262626]">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            The page you're looking for doesn't exist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;