import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Sidebar from "./Sidebar";
import { PageTransition } from "./PageTransition";

interface AdminRouteProps {
  component: React.ComponentType;
}

export default function AdminRoute({ component: Component }: AdminRouteProps) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              This feature is currently only available to administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
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
