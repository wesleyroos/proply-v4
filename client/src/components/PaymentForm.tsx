import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";

export default function PaymentForm() {
  const { user } = useUser();
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
    },
  });

  interface PaymentFormData {
    name: string;
    email: string;
  }

  const onSubmit = (data: PaymentFormData) => {
    // Initialize PayFast payment using sandbox credentials in development
    const isDevelopment = import.meta.env.DEV;
    const paymentData = {
      merchant_id: isDevelopment 
        ? import.meta.env.PAYFAST_SANDBOX_MERCHANT_ID 
        : import.meta.env.PAYFAST_MERCHANT_ID,
      merchant_key: isDevelopment
        ? import.meta.env.PAYFAST_SANDBOX_MERCHANT_KEY
        : import.meta.env.PAYFAST_MERCHANT_KEY,
      return_url: window.location.origin + "/settings?payment=success",
      cancel_url: window.location.origin + "/settings?payment=cancelled",
      notify_url: window.location.origin + "/api/payment-webhook",
      name_first: data.name,
      email_address: data.email,
      amount: "2000.00", // R2,000 as shown in pricing
      item_name: "Proply Pro Subscription",
      subscription_type: "1", // Monthly subscription
      billing_date: new Date().toISOString().split('T')[0], // Today
      recurring_amount: "2000.00",
      frequency: "3", // Monthly
      cycles: "0", // Unlimited cycles
      user_id: user?.id,
    };

    // Create form and submit to PayFast
    const form = document.createElement("form");
    form.method = "POST";
    form.action = isDevelopment
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} required />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" required />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">Pro Subscription</h3>
          <p className="text-sm text-gray-600">R2,000/month</p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1">
            <li>• Advanced property analysis</li>
            <li>• Unlimited analyses</li>
            <li>• Priority support</li>
            <li>• Custom reports</li>
            <li>• Market insights</li>
          </ul>
        </div>

        <Button type="submit" className="w-full bg-[#1BA3FF] hover:bg-[#114D9D]">
          Subscribe Now
        </Button>
      </form>
    </Form>
  );
}