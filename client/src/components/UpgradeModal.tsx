import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const { user } = useUser();
  const { toast } = useToast();

  const handlePayment = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      console.log('Initiating payment flow...');
      const isSandboxMode = localStorage.getItem('payfast_sandbox_mode') === 'true';

      // First, get a secure payment token from our backend
      const tokenResponse = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email,
          firstName: user?.firstName,
          subscriptionType: 'pro'
        }),
        credentials: 'include'
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to initialize payment session');
      }

      const { paymentToken, merchantData } = await tokenResponse.json();

      // Create PayFast form with secure token
      const form = document.createElement("form");
      form.method = "POST";
      form.action = isSandboxMode
        ? "https://sandbox.payfast.co.za/eng/process"
        : "https://www.payfast.co.za/eng/process";

      const paymentData = {
        merchant_id: merchantData.merchant_id,
        merchant_key: merchantData.merchant_key,
        return_url: `${window.location.origin}/payment/success?token=${paymentToken}`,
        cancel_url: `${window.location.origin}/payment/failure`,
        notify_url: `${window.location.origin}/api/payment-webhook`,
        name_first: user?.firstName || "",
        email_address: user?.email || "",
        amount: "2000.00",
        item_name: "Proply Pro Subscription",
        subscription_type: "1",
        billing_date: new Date().toISOString().split("T")[0],
        recurring_amount: "2000.00",
        frequency: "3",
        cycles: "0",
        payment_token: paymentToken
      };

      Object.entries(paymentData).forEach(([key, value]) => {
        if (value !== undefined) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value.toString();
          form.appendChild(input);
        }
      });

      document.body.appendChild(form);
      console.log('Submitting payment form to PayFast:', {
        mode: isSandboxMode ? 'sandbox' : 'live',
        email: paymentData.email_address
      });
      form.submit();
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        duration: 5000
      });
      // Remove any lingering form elements
      const existingForms = document.querySelectorAll('form[action*="payfast"]');
      existingForms.forEach(form => form.remove());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <DialogTitle className="text-2xl">Upgrade to</DialogTitle>
            <span className="bg-gradient-to-r from-primary to-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              PRO
            </span>
          </div>
          <DialogDescription className="text-center">
            Get unlimited access to all Proply features and tools
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Pro Features Include:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Accurate nightly rates based on local market data</li>
              <li>Real occupancy rates from similar properties</li>
              <li>Seasonal pricing trends and recommendations</li>
              <li>Unlimited property analyses</li>
              <li>Side by side property comparisons</li>
              <li>Priority support</li>
            </ul>
          </div>
          <div className="bg-muted p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-primary">R2000/month</div>
            <p className="text-muted-foreground mt-1">Cancel anytime</p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            className="w-full bg-[#1BA3FF] hover:bg-[#114D9D]"
            onClick={handlePayment}
          >
            Subscribe Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}