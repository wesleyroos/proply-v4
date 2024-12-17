import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PaymentForm from "../components/PaymentForm";
import { useUser } from "../hooks/use-user";

export default function SubscriptionPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4">
      <nav className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => setLocation("/")}>
          Back
        </Button>
        <h1 className="text-xl font-bold text-[#262626] ml-4">
          Subscription
        </h1>
      </nav>

      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Current Plan</h2>
                <p className="text-gray-600">
                  Status: {user?.subscriptionStatus}
                </p>
                {user?.subscriptionExpiryDate && (
                  <p className="text-gray-600">
                    Expires: {new Date(user.subscriptionExpiryDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              {user?.subscriptionStatus === "free" && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Upgrade to Pro</h2>
                  <PaymentForm />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
