import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, Link } from "wouter";
import { MobileNotice } from "@/components/MobileNotice";
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
import { useUser } from "../hooks/use-user";
import type { InsertUser } from "@db/schema";

export default function LoginPage() {
  const { login } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const form = useForm<InsertUser>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin = async (data: InsertUser) => {
    try {
      setIsLoading(true);
      setError(null);
      await login({
        username: data.email,
        email: data.email,
        password: data.password,
        userType: 'individual'
      });
      
      // Check for redirect URL in session storage
      const redirectUrl = sessionStorage.getItem('redirectUrl');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectUrl');
        setLocation(redirectUrl);
      } else {
        setLocation('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
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
              Welcome Back
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
                onSubmit={form.handleSubmit(handleLogin)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
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
                  control={form.control}
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

                <p className="text-center text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-[#1BA3FF] hover:underline">
                    Register
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
