import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentSetupCancel() {
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
            Payment method setup was cancelled. You can try again at any time.
          </p>
          <Button asChild className="w-full">
            <Link href="/settings">Return to Settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}