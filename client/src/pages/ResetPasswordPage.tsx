import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

const requestResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"request" | "reset">("request");

  // Get token from URL - check both path parameter and query parameter
  const pathToken = window.location.pathname.split('/reset-password/')[1];
  const queryToken = new URLSearchParams(window.location.search).get("token");
  const token = pathToken || queryToken;

  useEffect(() => {
    if (token) {
      setMode("reset");
    }
  }, [token]);

  const {
    register: registerRequest,
    handleSubmit: handleRequestSubmit,
    formState: { errors: requestErrors }
  } = useForm({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
    watch
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Debug: Watch password value changes
  console.log('Password value:', watch('password'));

  const onRequestSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(await response.text());

      toast({
        title: "Check your email",
        description: "If an account exists with this email, you will receive a password reset link",
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!token) {
        throw new Error("Reset token is missing");
      }

      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      toast({
        title: "Success",
        description: "Your password has been reset. Please log in with your new password.",
      });

      setLocation("/login");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[400px]">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-gray-900">
                {mode === "request" ? "Reset Password" : "Create New Password"}
              </CardTitle>
              <CardDescription className="text-center">
                {mode === "request"
                  ? "Enter your email address and we'll send you a password reset link."
                  : "Please enter your new password below."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {mode === "request" ? (
                <form onSubmit={handleRequestSubmit(onRequestSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input
                      type="email"
                      {...registerRequest('email')}
                      placeholder="Enter your email"
                    />
                    {requestErrors.email && (
                      <p className="text-sm text-red-500 mt-1">{requestErrors.email.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-black hover:bg-gray-800 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <Input
                      type="password"
                      {...registerReset('password')}
                      placeholder="Enter new password"
                    />
                    {resetErrors.password && (
                      <p className="text-sm text-red-500 mt-1">{resetErrors.password.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm Password</label>
                    <Input
                      type="password"
                      {...registerReset('confirmPassword')}
                      placeholder="Confirm new password"
                    />
                    {resetErrors.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">{resetErrors.confirmPassword.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-black hover:bg-gray-800 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="link" onClick={() => setLocation("/login")} className="text-proply-blue">
                Back to Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}