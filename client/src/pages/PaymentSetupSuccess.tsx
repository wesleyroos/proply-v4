import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, ArrowLeft } from 'lucide-react';

export default function PaymentSetupSuccess() {
  const [location, setLocation] = useLocation();
  const [, params] = useRoute('/payment-setup-success');
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentMethodStored, setPaymentMethodStored] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    
    if (sessionId) {
      // Wait a moment for webhook to process, then check if payment method was stored
      setTimeout(async () => {
        try {
          const response = await fetch('/api/payment-methods', {
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            setPaymentMethodStored(data.paymentMethods?.length > 0);
          } else {
            setError('Failed to verify payment method storage');
          }
        } catch (err) {
          console.error('Error verifying payment method:', err);
          setError('Failed to verify payment method storage');
        } finally {
          setIsVerifying(false);
        }
      }, 3000); // Wait 3 seconds for webhook processing
    } else {
      setIsVerifying(false);
      setError('No session ID found');
    }
  }, []);

  const goToSettings = () => {
    setLocation('/settings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">Payment Method Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isVerifying ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying payment method storage...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <div className="text-red-600 mb-4">
                <p className="font-medium">Verification Error</p>
                <p className="text-sm">{error}</p>
              </div>
              <p className="text-gray-600 text-sm">
                Your payment was processed by PayFast, but we couldn't verify storage. 
                Please check your settings or contact support if the payment method doesn't appear.
              </p>
            </div>
          ) : paymentMethodStored ? (
            <div className="text-center py-4">
              <CreditCard className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Success!</h3>
              <p className="text-gray-600">
                Your payment method has been successfully added and is ready for agency billing.
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-orange-600 mb-4">
                <p className="font-medium">Payment Processed</p>
                <p className="text-sm">Webhook still processing...</p>
              </div>
              <p className="text-gray-600 text-sm">
                PayFast has processed your payment method. If it doesn't appear in your settings 
                within a few minutes, please contact support.
              </p>
            </div>
          )}

          <div className="pt-4">
            <Button onClick={goToSettings} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Settings
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Your payment information is securely processed by PayFast and tokenized for future use.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}