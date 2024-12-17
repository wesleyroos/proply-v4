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
    // Initialize PayFast payment
    const paymentData = {
      merchant_id: "YOUR_MERCHANT_ID",
      merchant_key: "YOUR_MERCHANT_KEY",
      return_url: window.location.origin + "/subscription",
      cancel_url: window.location.origin + "/subscription",
      notify_url: window.location.origin + "/api/payment-webhook",
      name_first: data.name,
      email_address: data.email,
      amount: "299.00",
      item_name: "Proply Pro Subscription",
      user_id: user?.id,
    };

    // Create form and submit to PayFast
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://sandbox.payfast.co.za/eng/process";

    Object.entries(paymentData).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value as string;
      form.appendChild(input);
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
          <p className="text-sm text-gray-600">R299/month</p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1">
            <li>• Unlimited property comparisons</li>
            <li>• Break-even analysis</li>
            <li>• Price Labs API integration</li>
          </ul>
        </div>

        <Button type="submit" className="w-full bg-[#1BA3FF] hover:bg-[#114D9D]">
          Subscribe Now
        </Button>
      </form>
    </Form>
  );
}
