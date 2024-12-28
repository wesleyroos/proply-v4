import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PaymentFailurePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold text-red-700">
            Payment Unsuccessful
          </CardTitle>
          <CardDescription className="text-gray-600">
            We couldn't process your payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              Your payment was not successful. Don't worry - no charges were made to your account.
            </p>
            <p className="text-sm text-gray-500">
              Please try again or contact support if you continue to experience issues.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setLocation('/subscription')}
              className="w-full bg-[#1BA3FF] hover:bg-[#114D9D]"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation('/contact')}
            >
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
