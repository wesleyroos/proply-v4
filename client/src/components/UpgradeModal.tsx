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

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const { user } = useUser();

  const handlePayment = (e: React.MouseEvent) => {
    e.preventDefault();
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://www.payfast.co.za/eng/process";

    const paymentData = {
      merchant_id: import.meta.env.VITE_PAYFAST_MERCHANT_ID,
      merchant_key: import.meta.env.VITE_PAYFAST_MERCHANT_KEY,
      return_url: `${window.location.origin}/settings?payment=success`,
      cancel_url: `${window.location.origin}/settings?payment=cancelled`,
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
      custom_str1: JSON.stringify({
        userId: user?.id,
        subscriptionStatus: "pro",
      }),
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
    form.submit();
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