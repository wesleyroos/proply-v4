import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSetupSuccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Show success message
    toast({
      title: "Payment Method Added Successfully",
      description: "Your payment method has been securely stored for future billing.",
    });

    // Simulate processing the tokenization response
    const timer = setTimeout(() => {
      setIsProcessing(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [toast]);

  const handleReturnToSettings = () => {
    setLocation("/settings");
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h1 className="text-xl font-semibold text-center">
                Processing Payment Method
              </h1>
              <p className="text-sm text-gray-600 text-center">
                Please wait while we securely store your payment method...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            Payment Method Added Successfully
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              Your payment method has been securely stored and verified.
            </p>
            <p className="text-sm text-gray-500">
              You can now generate reports and they will be automatically billed according to our pricing tiers.
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your reports will be tracked monthly</li>
              <li>• Billing occurs automatically on the 1st of each month</li>
              <li>• You'll receive detailed invoices via email</li>
            </ul>
          </div>

          <Button 
            onClick={handleReturnToSettings} 
            className="w-full"
          >
            Return to Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}