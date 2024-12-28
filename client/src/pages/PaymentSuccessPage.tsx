import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useQueryClient } from "@tanstack/react-query";

export default function PaymentSuccessPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useUser();

  useEffect(() => {
    // Invalidate the user query to fetch fresh subscription status
    queryClient.invalidateQueries({ queryKey: ['user'] });
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold text-green-700">
            Payment Successful!
          </CardTitle>
          <CardDescription className="text-gray-600">
            Thank you for subscribing to Proply Pro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              Your Pro subscription is now active. You can now access all premium features.
            </p>
            <p className="text-sm text-gray-500">
              A confirmation email has been sent to your registered email address.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setLocation('/dashboard')}
              className="w-full bg-[#1BA3FF] hover:bg-[#114D9D]"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation('/analyzer')}
            >
              Start Analyzing Properties
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
