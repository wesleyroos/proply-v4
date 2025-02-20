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
        // Get registration/upgrade data from URL params
        const params = new URLSearchParams(window.location.search);
        const encodedData = params.get('custom_str1');

        console.log('URL Search params:', window.location.search);
        console.log('Encoded data:', encodedData);

        if (!encodedData) {
          console.error('Missing registration data. Redirecting to registration page.');
          setLocation('/register');
          return;
        }

        let compressed;
        try {
          compressed = JSON.parse(decodeURIComponent(encodedData));
        } catch (e) {
          console.error('Error parsing data:', e);
          throw new Error('Failed to parse registration/upgrade data');
        }

        // If this is an upgrade (has uid), handle differently than new registration
        if (compressed.uid) {
          const response = await fetch('/api/subscription/upgrade', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId: compressed.uid,
              subscriptionStatus: 'pro',
              subscriptionStartDate: new Date(),
              subscriptionNextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }),
            credentials: 'include'
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to upgrade subscription');
          }

          queryClient.invalidateQueries({ queryKey: ['user'] });
          setIsProcessing(false);
          toast({
            title: "Success",
            description: "Your account has been upgraded to Pro!",
          });
          setTimeout(() => setLocation('/settings'), 2000);
          return;
        }

        // Handle new user registration
        const passwordKey = compressed.k;
        const password = localStorage.getItem(passwordKey);
        
        // Check if user is already logged in
        const currentUser = await fetch('/api/user', {
          credentials: 'include'
        }).then(r => r.json()).catch(() => null);

        if (currentUser) {
          console.log('User already logged in, redirecting to dashboard');
          setIsProcessing(false);
          setTimeout(() => setLocation('/dashboard'), 1000);
          return;
        }

        // Verify we have all required registration data
        if (!compressed.e || !password) {
          throw new Error('Registration data or password not found');
        }

        console.log('Processing new registration...');
        
        // Clean up stored password after retrieving it
        localStorage.removeItem(passwordKey);

        const startDate = new Date();
        const nextBillingDate = new Date(startDate);
        nextBillingDate.setDate(nextBillingDate.getDate() + 30);

        // Format dates in UTC to avoid timezone issues
        // Ensure dates are properly formatted for the API
        const startDateStr = startDate.toISOString();
        const nextBillingDateStr = nextBillingDate.toISOString();

        const registerResult = await register({
          username: compressed.e,
          email: compressed.e,
          password: password,
          firstName: compressed.f || '',
          lastName: compressed.l || '',
          userType: compressed.t || 'individual',
          subscriptionStatus: 'pro',
          subscriptionStartDate: startDateStr,
          subscriptionNextBillingDate: nextBillingDateStr
        });

        if (!registerResult?.id) {
          throw new Error('Registration failed');
        }

        localStorage.removeItem('temp_registration_password');

        await login({
          email: compressed.e,
          password: password
        });

        setIsProcessing(false);
        queryClient.invalidateQueries({ queryKey: ['user'] });
        setTimeout(() => setLocation('/dashboard'), 2000);

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
              onClick={() => setLocation('/login')}
              className="w-full bg-[#1BA3FF] hover:bg-[#114D9D]"
            >
              Continue to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}