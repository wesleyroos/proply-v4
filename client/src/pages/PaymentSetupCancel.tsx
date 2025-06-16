import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PaymentSetupCancel() {
  const [, setLocation] = useLocation();
  const [errorDetails, setErrorDetails] = useState<string>('');

  useEffect(() => {
    // Capture URL parameters that might contain error details
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDesc = urlParams.get('error_description');
    
    if (error) {
      setErrorDetails(`Error: ${error}${errorDesc ? ` - ${errorDesc}` : ''}`);
    }
    
    // Log the cancel event for debugging
    console.log('PayFast cancel page accessed:', {
      url: window.location.href,
      params: Object.fromEntries(urlParams.entries()),
      timestamp: new Date().toISOString()
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-orange-600">
            <XCircle className="h-6 w-6" />
            Payment Setup Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Payment method setup was cancelled or failed. This could be due to:
          </p>
          <div className="text-left bg-yellow-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p>• Card declined by bank</p>
                <p>• 3D Secure authentication failed</p>
                <p>• Merchant account configuration issue</p>
                <p>• Network connectivity problem</p>
              </div>
            </div>
          </div>
          
          {errorDetails && (
            <div className="text-left bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-800">{errorDetails}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/settings">Try Again</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/control-panel">Return to Control Panel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}