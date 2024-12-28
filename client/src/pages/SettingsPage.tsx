import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import type { SelectUser } from "@db/schema";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  companyLogo?: FileList;
}

export default function SettingsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const form = useForm<ProfileFormData>({
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (data: ProfileFormData) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          companyLogo: previewLogo
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const updatedUser = await response.json();
      queryClient.setQueryData(['user'], updatedUser);

      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully saved.",
        variant: "default",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (data: ProfileFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
        variant: "default",
        duration: 3000,
      });

      // Reset password fields
      form.reset({
        ...form.getValues(),
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const initiateProUpgrade = () => {
    const isDevelopment = import.meta.env.DEV;
    console.log('Initiating Pro upgrade payment flow');

    const merchantId = isDevelopment
      ? import.meta.env.VITE_PAYFAST_SANDBOX_MERCHANT_ID
      : import.meta.env.VITE_PAYFAST_MERCHANT_ID;

    const merchantKey = isDevelopment
      ? import.meta.env.VITE_PAYFAST_SANDBOX_MERCHANT_KEY
      : import.meta.env.VITE_PAYFAST_MERCHANT_KEY;

    if (!merchantId || !merchantKey) {
      toast({
        title: "Error",
        description: "Payment configuration is missing. Please try again later.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to upgrade your account.",
        variant: "destructive"
      });
      return;
    }

    // Prepare minimal upgrade data
    const upgradeData = {
      uid: user.id,
      e: user.email,
      f: user.firstName || '',
      l: user.lastName || '',
      t: user.userType || 'individual',
      s: 'pro'
    };

    console.log('Processing upgrade for user:', {
      ...upgradeData,
      email: user.email,
      currentPlan: user.subscriptionStatus
    });

    const encodedData = encodeURIComponent(JSON.stringify(upgradeData));

    const paymentData = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${window.location.origin}/payment/success?upgrade_data=${encodedData}`,
      cancel_url: `${window.location.origin}/settings`,
      notify_url: `${window.location.origin}/api/payment-webhook`,
      name_first: user.firstName || user.email,
      email_address: user.email,
      amount: "2000.00",
      item_name: "Proply Pro Subscription Upgrade",
      subscription_type: "1",
      billing_date: new Date().toISOString().split('T')[0],
      recurring_amount: "2000.00",
      frequency: "3",
      cycles: "0"
    };

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
    console.log('Submitting upgrade payment form to PayFast...');
    form.submit();
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[#262626] mb-6">Settings</h1>

        <div className="max-w-4xl">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleProfileUpdate)} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="John" />
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
                                <Input {...field} placeholder="Doe" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Company Logo Upload */}
                      <FormItem>
                        <FormLabel>Company Logo</FormLabel>
                        <div className="flex items-start space-x-4">
                          <div>
                            {previewLogo || user?.companyLogo ? (
                              <img
                                src={previewLogo || user?.companyLogo}
                                alt="Company Logo Preview"
                                className="w-32 h-32 object-contain border rounded-lg"
                              />
                            ) : (
                              <div className="w-32 h-32 border rounded-lg flex items-center justify-center bg-gray-50">
                                <p className="text-sm text-gray-500">No logo uploaded</p>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoChange}
                              className="mb-2"
                            />
                            <p className="text-sm text-gray-500">
                              Upload your company logo. Recommended size: 400x400px.
                            </p>
                          </div>
                        </div>
                      </FormItem>

                      <Button
                        type="submit"
                        className="w-full bg-[#1BA3FF] hover:bg-[#114D9D]"
                        disabled={isUpdating}
                      >
                        {isUpdating ? "Updating..." : "Update Profile"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handlePasswordChange)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        className="w-full"
                        disabled={isUpdating}
                      >
                        {isUpdating ? "Updating..." : "Change Password"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription</CardTitle>
                  <CardDescription>Your current subscription details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Current Plan</label>
                      <p className="text-muted-foreground capitalize">{user?.subscriptionStatus || 'Free'}</p>
                    </div>
                    {/* Only show expiry date for non-pro subscriptions */}
                    {user?.subscriptionStatus !== 'pro' && user?.subscriptionExpiryDate && (
                      <div>
                        <label className="text-sm font-medium">Access Until</label>
                        <p className="text-muted-foreground">
                          {new Date(user.subscriptionExpiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {/* Plan switching section */}
                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-medium mb-2">Change Plan</h3>
                      {user?.subscriptionStatus === "free" ? (
                        <div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Upgrade to Pro to unlock all features including unlimited property analyses,
                            advanced metrics, and priority support.
                          </p>
                          <Button
                            onClick={initiateProUpgrade}
                            className="w-full bg-[#1BA3FF] hover:bg-[#114D9D]"
                          >
                            Upgrade to Pro
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Warning: Downgrading to the Free plan will limit your access to basic features.
                            You will maintain Pro access until the end of your current billing cycle.
                          </p>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full text-destructive hover:text-destructive"
                              >
                                Downgrade to Free
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action will schedule your account to downgrade to the Free plan at the end of your current billing cycle.
                                  You'll maintain Pro access until then, but your subscription won't renew automatically.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={async () => {
                                    try {
                                      console.log('Initiating subscription downgrade...');
                                      const response = await fetch('/api/subscription/downgrade', {
                                        method: 'POST',
                                        credentials: 'include'
                                      });

                                      if (!response.ok) {
                                        throw new Error(await response.text());
                                      }

                                      const result = await response.json();
                                      console.log('Downgrade scheduled:', result);

                                      queryClient.invalidateQueries({ queryKey: ['user'] });
                                      toast({
                                        title: "Plan Update Scheduled",
                                        description: `Your account will be downgraded to Free at the end of your current billing cycle (${new Date(result.expiryDate).toLocaleDateString()}).`,
                                      });
                                    } catch (error) {
                                      console.error('Error scheduling downgrade:', error);
                                      toast({
                                        title: "Error",
                                        description: error instanceof Error ? error.message : "Failed to schedule plan downgrade",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Confirm Downgrade
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}