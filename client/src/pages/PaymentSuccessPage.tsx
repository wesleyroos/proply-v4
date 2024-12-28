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
        // Get registration data directly from URL params
        const params = new URLSearchParams(window.location.search);
        const encodedData = params.get('custom_str1');

        console.log('URL Search params:', window.location.search);
        console.log('Encoded registration data:', encodedData);

        if (!encodedData) {
          throw new Error('Registration data not found in URL parameters');
        }

        let compressed;
        try {
          compressed = JSON.parse(decodeURIComponent(encodedData));
        } catch (e) {
          console.error('Error parsing registration data:', e);
          throw new Error('Failed to parse registration data');
        }

        console.log('Decoded registration data:', {
          ...compressed,
          p: '[REDACTED]'
        });

        if (!compressed.e || !compressed.p) {
          throw new Error('Invalid registration data format');
        }

        // Register the user with explicit pro subscription status
        const registrationData = {
          username: compressed.e,
          email: compressed.e,
          password: compressed.p,
          firstName: compressed.f,
          lastName: compressed.l,
          userType: compressed.t || 'individual',
          subscriptionStatus: compressed.s === 'pro' ? 'pro' : 'free' // Ensure we use the selected plan
        };

        console.log('Registering user with data:', {
          ...registrationData,
          password: '[REDACTED]'
        });

        await register(registrationData);

        // Login the user
        await login({
          username: compressed.e,
          email: compressed.e,
          password: compressed.p,
          userType: compressed.t || 'individual'
        });

        // Update UI state
        setIsProcessing(false);
        queryClient.invalidateQueries({ queryKey: ['user'] });

      } catch (error) {
        console.error('Payment success processing error:', error);
        setError(error instanceof Error ? error.message : "Failed to complete registration");
        setIsProcessing(false);

        toast({
          variant: "destructive",
          title: "Registration Error",
          description: error instanceof Error ? error.message : "Failed to complete registration"
        });
      }
    };

    processPaymentSuccess();
  }, [register, login, queryClient, toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-gray-600">
              Completing your registration...
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
              Registration Error
            </CardTitle>
            <CardDescription className="text-gray-600">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500 text-center">
              Please try logging in with your email and password. If the problem persists,
              contact our support team.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => setLocation('/login')}
                className="w-full bg-[#1BA3FF] hover:bg-[#114D9D]"
              >
                Go to Login
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