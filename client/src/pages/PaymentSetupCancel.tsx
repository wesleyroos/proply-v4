import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSetupCancel() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: "Payment Setup Cancelled",
      description: "Your payment method was not added. You can try again anytime.",
      variant: "destructive",
    });
  }, [toast]);

  const handleReturnToSettings = () => {
    setLocation("/settings");
  };

  const handleTryAgain = () => {
    setLocation("/settings");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl text-red-600">
            Payment Setup Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              The payment method setup was cancelled. No payment information was stored.
            </p>
            <p className="text-sm text-gray-500">
              You can try adding a payment method again anytime from your settings.
            </p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Need help?</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Check your card details are correct</li>
              <li>• Ensure your bank allows online transactions</li>
              <li>• Contact support if issues persist</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button 
              variant="outline"
              onClick={handleReturnToSettings}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
            <Button 
              onClick={handleTryAgain}
              className="flex-1"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}