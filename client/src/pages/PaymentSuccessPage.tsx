import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccessPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { register, login } = useUser();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPaymentSuccess = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const encodedData = params.get('upgrade_data') || params.get('custom_str1');

        console.log('Processing payment success:', {
          searchParams: window.location.search,
          encodedData: encodedData ? 'present' : 'missing',
          timestamp: new Date().toISOString()
        });

        if (!encodedData) {
          throw new Error('Payment data not found in URL parameters. Please contact support if the issue persists.');
        }

        let decodedData;
        try {
          decodedData = JSON.parse(decodeURIComponent(encodedData));
          console.log('Decoded payment data:', {
            ...decodedData,
            p: decodedData.p ? '[REDACTED]' : undefined,
            timestamp: new Date().toISOString()
          });
        } catch (e) {
          console.error('Error parsing payment data:', e);
          throw new Error('Invalid payment data format. Please contact support.');
        }

        // Handle existing user upgrade
        if (decodedData.uid) {
          console.log('Processing upgrade for existing user:', {
            userId: decodedData.uid,
            timestamp: new Date().toISOString()
          });

          const response = await fetch('/api/subscription/upgrade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: decodedData.uid,
              subscriptionStatus: 'pro',
              subscriptionStartDate: new Date(),
              subscriptionNextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }),
            credentials: 'include'
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Upgrade API error:', errorText);
            throw new Error(errorText);
          }

          queryClient.invalidateQueries({ queryKey: ['user'] });

          setIsProcessing(false);
          toast({
            title: "Success",
            description: "Your account has been upgraded to Pro!",
          });

          setLocation('/settings');
          return;
        }

        // Handle new user registration
        if (!decodedData.e || !decodedData.p) {
          console.error('Missing required registration data');
          throw new Error('Invalid registration data. Please contact support.');
        }

        const registrationData = {
          username: decodedData.e,
          email: decodedData.e,
          password: decodedData.p,
          firstName: decodedData.f || null,
          lastName: decodedData.l || null,
          userType: decodedData.t || 'individual',
          subscriptionStatus: 'pro',
          subscriptionStartDate: new Date(),
          subscriptionNextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };

        console.log('Registering new user:', {
          email: registrationData.email,
          userType: registrationData.userType,
          subscriptionStatus: registrationData.subscriptionStatus,
          timestamp: new Date().toISOString()
        });

        await register(registrationData);

        await login({
          username: decodedData.e,
          email: decodedData.e,
          password: decodedData.p,
          userType: decodedData.t || 'individual'
        });

        setIsProcessing(false);
        queryClient.invalidateQueries({ queryKey: ['user'] });

      } catch (error) {
        console.error('Payment success processing error:', error);
        setError(error instanceof Error ? error.message : "Failed to complete registration/upgrade");
        setIsProcessing(false);

        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to complete registration/upgrade"
        });
      }
    };

    processPaymentSuccess();
  }, [register, login, queryClient, toast, setLocation]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-gray-600">
              Processing your subscription...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-700">
              Processing Error
            </CardTitle>
            <CardDescription className="text-gray-600">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500 text-center">
              Please try again or contact our support team if the problem persists.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => setLocation('/settings')}
                className="w-full bg-[#1BA3FF] hover:bg-[#114D9D]"
              >
                Return to Settings
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