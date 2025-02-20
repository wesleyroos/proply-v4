import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, Link } from "wouter";
import { MobileNotice } from "@/components/MobileNotice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  password: string;
  email: string;
  userType: string;
  company?: string;
  accessCode?: string;
  plan?: string;
}

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const [selectedPlan, setSelectedPlan] = useState(searchParams.get('plan') || 'free');
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      userType: "individual",
      company: "",
      accessCode: "",
      plan: selectedPlan
    },
  });

  const initiatePaymentFlow = async (formData: ProfileFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Create payment session with registration data
      const response = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          userType: formData.userType,
          subscriptionType: selectedPlan
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to initialize payment');
      }

      const { paymentData, signature } = await response.json();

      const isDevelopment = import.meta.env.DEV;
      const form = document.createElement("form");
      form.method = "POST";
      form.action = isDevelopment
        ? "https://sandbox.payfast.co.za/eng/process"
        : "https://www.payfast.co.za/eng/process";

      // Add payment data fields in alphabetical order
      Object.entries(paymentData)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value.toString();
          form.appendChild(input);
        });

      // Add signature as the last field
      const signatureInput = document.createElement("input");
      signatureInput.type = "hidden";
      signatureInput.name = "signature";
      signatureInput.value = signature;
      form.appendChild(signatureInput);

      // For debugging
      console.log('Submitting payment form with data:', {
        ...paymentData,
        signature
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error('Payment initialization error:', error);
      setError(error instanceof Error ? error.message : "Failed to initialize payment");
      setIsLoading(false);

      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        duration: 5000
      });
    }
  };

  const handleRegister = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      if (selectedPlan === 'pro' && !data.accessCode) {
        await initiatePaymentFlow(data);
        return;
      }

      // Handle free plan registration
      const registerResponse = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: data.email,
          email: data.email,
          password: data.password,
          userType: data.userType,
          company: data.company,
          firstName: data.firstName,
          lastName: data.lastName,
          accessCode: data.accessCode,
          subscriptionStatus: selectedPlan
        })
      });

      if (!registerResponse.ok) {
        const errorText = await registerResponse.text();
        throw new Error(errorText || 'Registration failed');
      }

      setLocation('/login');
      toast({
        title: "Success",
        description: "Registration successful! Please log in.",
      });
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center px-4 py-8 sm:p-4">
      <MobileNotice />
      <div className="w-full max-w-[min(100%,24rem)] mb-8">
        <Link href="/">
          <img
            src="/proply-logo-1.png"
            alt="Proply"
            className="h-12 mx-auto mb-8 cursor-pointer"
          />
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-[#262626]">
              {selectedPlan === 'pro' ? 'Get Started with Pro' : 'Get Started with Proply'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleRegister)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan</FormLabel>
                      <Select
                        value={selectedPlan}
                        onValueChange={(value) => {
                          setSelectedPlan(value);
                          field.onChange(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free Plan</SelectItem>
                          <SelectItem value="pro">Pro Plan</SelectItem>
                        </SelectContent>
                      </Select>
                      {selectedPlan === 'pro' && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Pro plan includes advanced features and unlimited analyses
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                {selectedPlan === 'pro' && (
                  <FormField
                    control={form.control}
                    name="accessCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Access Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your access code (optional)"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          autoComplete="email"
                          disabled={isLoading}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                          <SelectItem value="agent">Real Estate Agent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            autoComplete="given-name"
                            disabled={isLoading}
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            autoComplete="family-name"
                            disabled={isLoading}
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="new-password"
                          disabled={isLoading}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-[#1BA3FF] hover:bg-[#114D9D]"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : (
                    selectedPlan === 'pro' && !form.getValues('accessCode')
                      ? "Continue to Payment"
                      : "Create Account"
                  )}
                </Button>

                <p className="text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#1BA3FF] hover:underline">
                    Login
                  </Link>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}