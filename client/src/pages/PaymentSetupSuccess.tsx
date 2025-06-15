import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function PaymentSetupSuccess() {
  const [location] = useLocation();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract query parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const paymentStatus = urlParams.get('payment_status');
    
    console.log('PayFast return parameters:', {
      token,
      paymentStatus,
      allParams: Object.fromEntries(urlParams.entries())
    });

    // Check if tokenization was successful
    if (paymentStatus === 'COMPLETE' && token) {
      // Tokenization successful - PayFast will also send webhook
      setProcessing(false);
    } else {
      setError('Payment setup was not completed successfully');
      setProcessing(false);
    }
  }, []);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Payment Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              Please wait while we confirm your payment method setup...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Setup Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{error}</p>
            <Button asChild>
              <Link href="/settings">Return to Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Payment Method Added Successfully
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Your payment method has been securely saved and can now be used for automated billing.
          </p>
          <Button asChild className="w-full">
            <Link href="/settings">Return to Settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}