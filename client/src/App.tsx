import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./components/PageTransition";
import ComparisonPage from "./pages/ComparisonPage";
import PropertiesPage from "./pages/PropertiesPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
import AccessCodePage from "./pages/AccessCodePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import PricingPage from "./pages/PricingPage";
import BlogPage from "./pages/BlogPage";
import PropertyAnalyzerProductPage from "./pages/PropertyAnalyzerProductPage";
import RentComparePage from "./pages/RentComparePage";
import InsurersPage from "./pages/InsurersPage";
import DashboardPage from "./pages/DashboardPage";
import PropertyAnalyzerPage from "./pages/PropertyAnalyzerPage";
import PropertyAnalyzerDetailPage from "./pages/PropertyAnalyzerDetailPage";

import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import ContactPage from "./pages/ContactPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentFailurePage from "./pages/PaymentFailurePage";
import PaymentSetupSuccess from "./pages/PaymentSetupSuccess";
import PaymentSetupCancel from "./pages/PaymentSetupCancel";
import ControlPanel from "./pages/ControlPanel";
import { useUser } from "./hooks/use-user";
import { useToast } from "./hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Sidebar from "./components/Sidebar";
import { ToastDemo } from "./components/ToastDemo";
import AnalyticsPage from "./pages/AnalyticsPage";
import NotificationsMenu from "./components/NotificationsMenu";
import AirbnbYieldCalculator from "./pages/AirbnbYieldCalculator";
import DealAnalyser from "./pages/DealAnalyser";
import TransactionHistoryPage from "./pages/TransactionHistoryPage";

import RiskIndexPage from "./pages/RiskIndexPage";
import HollardRiskIndexPage from "./pages/HollardRiskIndexPage";
import KingPriceRiskIndexPage from "./pages/KingPriceRiskIndexPage";
import MomentumRiskIndexPage from "./pages/MomentumRiskIndexPage";
import OnevapRiskIndexPage from "./pages/OnevapRiskIndexPage";
import OnevapResidentialRiskIndexPage from "./pages/OnevapResidentialRiskIndexPage";
import AgentsPage from "./pages/AgentsPage";
import PropdataListingsPage from "./pages/PropdataListingsPage";
import DownloadSuccessPage from "./pages/DownloadSuccessPage";
import AcceptInvitationPage from "./pages/AcceptInvitationPage";


function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
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
        <PageTransition>
          <Component />
        </PageTransition>
      </main>
    </div>
  );
}

function NotFound() {
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: "Page Not Found",
      description: "The page you're looking for doesn't exist.",
      variant: "destructive",
      duration: 3000,
    });
  }, [toast]);

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
  const [location] = useLocation();

  return (
    <>
      <TooltipProvider>
        <AnimatePresence mode="wait">
          <Switch key={location}>
            <Route path="/reset-password" component={() => (
              <PageTransition>
                <ResetPasswordPage />
              </PageTransition>
            )} />
            <Route path="/reset-password/:token" component={() => (
              <PageTransition>
                <ResetPasswordPage />
              </PageTransition>
            )} />
            <Route path="/" component={() => (
              <PageTransition>
                <HomePage />
              </PageTransition>
            )} />
            <Route path="/login" component={() => (
              <PageTransition>
                <LoginPage />
              </PageTransition>
            )} />
            <Route path="/register" component={() => (
              <PageTransition>
                <RegisterPage />
              </PageTransition>
            )} />
            <Route path="/pricing" component={() => (
              <PageTransition>
                <PricingPage />
              </PageTransition>
            )} />
            <Route path="/blog" component={() => (
              <PageTransition>
                <BlogPage />
              </PageTransition>
            )} />
            <Route path="/blog/:slug" component={() => (
              <PageTransition>
                <BlogPage />
              </PageTransition>
            )} />
            <Route path="/property-analyzer" component={() => (
              <PageTransition>
                <PropertyAnalyzerProductPage />
              </PageTransition>
            )} />
            <Route path="/rent-compare" component={() => (
              <PageTransition>
                <RentComparePage />
              </PageTransition>
            )} />
            <Route path="/privacy" component={() => (
              <PageTransition>
                <PrivacyPage />
              </PageTransition>
            )} />
            <Route path="/terms" component={() => (
              <PageTransition>
                <TermsPage />
              </PageTransition>
            )} />
            <Route path="/contact" component={() => (
              <PageTransition>
                <ContactPage />
              </PageTransition>
            )} />
            <Route path="/payment/success" component={() => (
              <PageTransition>
                <PaymentSuccessPage />
              </PageTransition>
            )} />
            <Route path="/payment/failure" component={() => (
              <PageTransition>
                <PaymentFailurePage />
              </PageTransition>
            )} />
            <Route path="/payment-setup-success" component={() => (
              <PageTransition>
                <PaymentSetupSuccess />
              </PageTransition>
            )} />
            <Route path="/payment-setup-cancel" component={() => (
              <PageTransition>
                <PaymentSetupCancel />
              </PageTransition>
            )} />

            <Route path="/risk-index" component={() => (
              <PageTransition>
                <RiskIndexPage />
              </PageTransition>
            )} />
            <Route path="/hollard-risk-index" component={() => (
              <PageTransition>
                <HollardRiskIndexPage />
              </PageTransition>
            )} />
            <Route path="/king-price-risk-index" component={() => (
              <PageTransition>
                <KingPriceRiskIndexPage />
              </PageTransition>
            )} />
            <Route path="/momentum-risk-index" component={() => (
              <PageTransition>
                <MomentumRiskIndexPage />
              </PageTransition>
            )} />
            <Route path="/one-vap-risk-index" component={() => (
              <PageTransition>
                <OnevapRiskIndexPage />
              </PageTransition>
            )} />
            <Route path="/one-vap-residential-risk-index" component={() => (
              <PageTransition>
                <OnevapResidentialRiskIndexPage />
              </PageTransition>
            )} />
            <Route path="/insurers" component={() => (
              <PageTransition>
                <InsurersPage />
              </PageTransition>
            )} />
            <Route path="/agents" component={() => (
              <PageTransition>
                <AgentsPage />
              </PageTransition>
            )} />
            <Route path="/download/:reportId" component={() => (
              <PageTransition>
                <DownloadSuccessPage />
              </PageTransition>
            )} />
            <Route path="/admin/accept-invitation" component={() => (
              <PageTransition>
                <AcceptInvitationPage />
              </PageTransition>
            )} />

            {/* Protected routes */}
            <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
            <Route path="/dashboard/property-analyzer" component={() => <ProtectedRoute component={PropertyAnalyzerPage} />} />
            <Route path="/properties/analyzer/:id" component={() => <ProtectedRoute component={PropertyAnalyzerDetailPage} />} />

            <Route path="/dashboard/rent-compare" component={() => <ProtectedRoute component={ComparisonPage} />} />

            <Route path="/dashboard/toast-demo" component={() => <ProtectedRoute component={ToastDemo} />} />
            <Route path="/properties" component={() => <ProtectedRoute component={PropertiesPage} />} />
            <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
            <Route path="/admin" component={() => <ProtectedRoute component={AdminPage} />} />
            <Route path="/propdata-listings" component={() => <ProtectedRoute component={PropdataListingsPage} />} />
            <Route path="/analytics" component={() => <ProtectedRoute component={AnalyticsPage} />} />
            <Route path="/access-codes" component={() => <ProtectedRoute component={AccessCodePage} />} />
            <Route path="/subscription" component={() => <ProtectedRoute component={SubscriptionPage} />} />
            <Route path="/transaction-history" component={() => <ProtectedRoute component={TransactionHistoryPage} />} />
            <Route path="/dashboard/control-panel" component={() => <ProtectedRoute component={ControlPanel} />} />
            <Route path="/dashboard/propdata-listings" component={() => <ProtectedRoute component={PropdataListingsPage} />} />

            <Route path="/airbnb-yield-calculator" component={() => (
              <PageTransition>
                <AirbnbYieldCalculator />
              </PageTransition>
            )} />
            <Route path="/deal-analyser" component={() => (
              <PageTransition>
                <DealAnalyser />
              </PageTransition>
            )} />
            <Route path="/payment-setup-success" component={() => (
              <PageTransition>
                <PaymentSetupSuccess />
              </PageTransition>
            )} />
            <Route path="/payment-setup-cancel" component={() => (
              <PageTransition>
                <PaymentSetupCancel />
              </PageTransition>
            )} />
            <Route component={NotFound} />
          </Switch>
        </AnimatePresence>
      </TooltipProvider>
      <Toaster />
    </>
  );
}

export default App;