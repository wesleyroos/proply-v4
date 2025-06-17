import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';

export default function PaymentSetupCancel() {
  const [location, setLocation] = useLocation();

  const goToSettings = () => {
    setLocation('/settings');
  };

  const tryAgain = () => {
    setLocation('/settings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-800">Payment Setup Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              Your payment method setup was cancelled. No charges were made to your account.
            </p>
            <p className="text-sm text-gray-500">
              You can try adding a payment method again at any time from your settings.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={tryAgain} className="w-full">
              <CreditCard className="w-4 h-4 mr-2" />
              Try Adding Payment Method Again
            </Button>
            
            <Button onClick={goToSettings} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Settings
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Need help setting up your payment method? Contact support for assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}