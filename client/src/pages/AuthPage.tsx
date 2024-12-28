import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "../hooks/use-user";
import type { InsertUser } from "@db/schema";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  password: string;
  email: string;
  userType: string;
  company?: string;
  accessCode?: string;
}

export default function AuthPage() {
  const { login, register } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const [selectedPlan, setSelectedPlan] = useState(searchParams.get('plan') || 'free');

  const loginForm = useForm<InsertUser>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<ProfileFormData>({
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      userType: "individual",
      company: "",
      accessCode: "",
    },
  });

  const handleLogin = async (data: InsertUser) => {
    try {
      setIsLoading(true);
      setError(null);
      await login(data);
      setLocation('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const initiatePayFastPayment = (formData: ProfileFormData) => {
    const isDevelopment = import.meta.env.DEV;

    // Get sandbox credentials
    const merchantId = isDevelopment 
      ? import.meta.env.VITE_PAYFAST_SANDBOX_MERCHANT_ID
      : import.meta.env.VITE_PAYFAST_MERCHANT_ID;

    const merchantKey = isDevelopment
      ? import.meta.env.VITE_PAYFAST_SANDBOX_MERCHANT_KEY
      : import.meta.env.VITE_PAYFAST_MERCHANT_KEY;

    if (!merchantId || !merchantKey) {
      setError("Payment configuration is missing. Please try again later.");
      return;
    }

    const paymentData = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${window.location.origin}/settings?payment=success`,
      cancel_url: `${window.location.origin}/settings?payment=cancelled`,
      notify_url: `${window.location.origin}/api/payment-webhook`,
      name_first: formData.firstName,
      email_address: formData.email,
      amount: "2000.00", // R2,000 as shown in pricing
      item_name: "Proply Pro Subscription",
      subscription_type: "1", // Monthly subscription
      billing_date: new Date().toISOString().split('T')[0], // Today
      recurring_amount: "2000.00",
      frequency: "3", // Monthly
      cycles: "0", // Unlimited cycles
      custom_str1: JSON.stringify({
        ...formData,
        subscriptionStatus: 'pro'
      }),
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

  const handleRegister = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if pro plan and no access code, initiate PayFast payment
      if (selectedPlan === 'pro' && !data.accessCode) {
        initiatePayFastPayment(data);
        return;
      }

      // Prepare registration data
      const registrationData = {
        username: data.email,
        email: data.email,
        password: data.password,
        userType: data.userType,
        company: data.company,
        firstName: data.firstName,
        lastName: data.lastName,
        accessCode: data.accessCode,
        subscriptionStatus: selectedPlan
      };

      await register(registrationData);
      await login({
        email: data.email,
        password: data.password
      });

      setLocation('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mb-8">
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
            <Tabs defaultValue="register">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(handleLogin)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
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
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              autoComplete="current-password"
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
                      {isLoading ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(handleRegister)}
                    className="space-y-4"
                  >
                    {/* Plan Selection */}
                    <FormField
                      control={registerForm.control}
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
                        control={registerForm.control}
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
                      control={registerForm.control}
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
                      control={registerForm.control}
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
                        control={registerForm.control}
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
                        control={registerForm.control}
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
                      control={registerForm.control}
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
                        selectedPlan === 'pro' && !registerForm.getValues('accessCode')
                          ? "Continue to Payment"
                          : "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}