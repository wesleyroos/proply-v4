import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSetupSuccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<'completed' | 'pending' | 'failed' | null>(null);

  useEffect(() => {
    const checkSessionStatus = async () => {
      try {
        // Get session ID from URL parameters
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session');

        if (!sessionId) {
          toast({
            title: "Session Error",
            description: "No session found. Redirecting to settings.",
            variant: "destructive",
          });
          setTimeout(() => setLocation("/settings"), 2000);
          return;
        }

        // Check session status by polling the payment methods API
        // The webhook should have processed the tokenization by now
        let attempts = 0;
        const maxAttempts = 10;
        
        const checkStatus = async () => {
          try {
            const response = await fetch('/api/payment-methods', {
              credentials: 'include'
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.paymentMethods && data.paymentMethods.length > 0) {
                // Payment method was successfully added
                setSessionStatus('completed');
                setIsProcessing(false);
                toast({
                  title: "Payment Method Added Successfully",
                  description: "Your payment method has been securely stored for future billing.",
                });
                return;
              }
            }
            
            attempts++;
            if (attempts < maxAttempts) {
              // Wait 2 seconds and try again
              setTimeout(checkStatus, 2000);
            } else {
              // Max attempts reached, consider it pending
              setSessionStatus('pending');
              setIsProcessing(false);
              toast({
                title: "Payment Method Setup In Progress",
                description: "Your payment is being processed. Please check your settings in a few minutes.",
                variant: "default",
              });
            }
          } catch (error) {
            console.error('Error checking payment method status:', error);
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(checkStatus, 2000);
            } else {
              setSessionStatus('failed');
              setIsProcessing(false);
              toast({
                title: "Error Checking Status",
                description: "Unable to verify payment method setup. Please check your settings.",
                variant: "destructive",
              });
            }
          }
        };

        // Start checking after a brief delay to allow webhook processing
        setTimeout(checkStatus, 1000);

      } catch (error) {
        console.error('Error in payment setup success:', error);
        setSessionStatus('failed');
        setIsProcessing(false);
        toast({
          title: "Error",
          description: "Something went wrong. Please check your settings.",
          variant: "destructive",
        });
      }
    };

    checkSessionStatus();
  }, [toast, setLocation]);

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