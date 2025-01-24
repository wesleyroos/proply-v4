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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarDays, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  companyLogo?: string; 
}

interface BillingDetailsProps {
  user: SelectUser;
  onUpgrade: () => void;
}

function BillingDetails({ user, onUpgrade }: BillingDetailsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'Not available';
    try {
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      return new Date(date).toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  // Determine subscription dates display
  const subscriptionDates = user ? {
    nextBilling: user.subscriptionNextBillingDate ? formatDate(new Date(user.subscriptionNextBillingDate)) : 'Not available',
    activationDate: user.subscriptionStartDate ? formatDate(new Date(user.subscriptionStartDate)) : 'Not available'
  } : {
    nextBilling: 'Not available',
    activationDate: 'Not available'
  };

  // For debugging
  console.log('User subscription data:', {
    startDate: user?.subscriptionStartDate,
    nextBilling: user?.subscriptionNextBillingDate,
    formatted: subscriptionDates,
    rawUser: user
  });

  const planFeatures = {
    free: [
      'Basic property analysis',
      '3 analyses per month',
      'Standard support',
    ],
    pro: [
      'Advanced property analysis',
      'Unlimited analyses',
      'Priority support',
      'Custom reports',
      'Market insights',
    ]
  };

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="font-semibold mb-4">Current Plan Details</h3>
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium">Plan</label>
            <p className="text-muted-foreground capitalize">
              {user?.subscriptionStatus || 'Free'}
              {user?.pendingDowngrade && user?.subscriptionExpiryDate && ` (Downgrade Scheduled - ${new Date(user.subscriptionExpiryDate).toLocaleDateString()})`}
            </p>
          </div>
          {user?.subscriptionStatus === 'pro' && (
            <>
              <div>
                <label className="text-sm font-medium">Plan Activation Date</label>
                <p className="text-muted-foreground">{subscriptionDates.activationDate}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Next Billing Date</label>
                <p className="text-muted-foreground">
                  {user?.pendingDowngrade ? 'No next billing date' : subscriptionDates.nextBilling}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Monthly Cost</label>
                <p className="text-muted-foreground">R2,000/month</p>
              </div>
            </>
          )}
          <div>
            <label className="text-sm font-medium">Current Features</label>
            <ul className="mt-2 space-y-1">
              {planFeatures[user?.subscriptionStatus === 'pro' ? 'pro' : 'free'].map((feature, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {user?.subscriptionStatus === 'pro' && (
        <div className="space-y-4">
          {user?.payfastSubscriptionStatus !== "paused" ? (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Pause Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Pause Subscription</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>
                        Your subscription will be paused for one billing cycle. During this time:
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>You'll maintain access to Pro features until the end of your current billing period</li>
                        <li>No charges will be made for the next month</li>
                        <li>Your subscription will automatically resume after the pause period</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/subscription/pause', {
                            method: 'POST',
                            credentials: 'include'
                          });

                          if (!response.ok) {
                            throw new Error(await response.text());
                          }

                          queryClient.invalidateQueries({ queryKey: ['user'] });

                          toast({
                            title: "Success",
                            description: "Your subscription has been paused",
                            duration: 5000,
                          });

                        } catch (error) {
                          console.error('Error pausing subscription:', error);
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: error instanceof Error ? error.message : "Failed to pause subscription",
                            duration: 5000,
                          });
                        }
                      }}
                    >
                      Confirm Pause
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Add Downgrade Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
                    disabled={user?.pendingDowngrade}
                  >
                    {user?.pendingDowngrade ? 'Downgrade Scheduled' : 'Downgrade to Free'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Downgrade Confirmation</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>Before you downgrade, please note:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Your Pro features will remain active until the end of your current billing cycle</li>
                        <li>After downgrade, you'll be limited to 3 analyses per month</li>
                        <li>Custom reports and market insights will no longer be available</li>
                        <li>You can upgrade back to Pro at any time</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/subscription/cancel', {
                            method: 'POST',
                            credentials: 'include'
                          });

                          if (!response.ok) {
                            throw new Error(await response.text());
                          }

                          queryClient.invalidateQueries({ queryKey: ['user'] });

                          toast({
                            title: "Downgrade Scheduled",
                            description: "Your subscription will be downgraded at the end of your current billing cycle",
                            duration: 5000,
                          });

                        } catch (error) {
                          console.error('Error cancelling subscription:', error);
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: error instanceof Error ? error.message : "Failed to schedule downgrade",
                            duration: 5000,
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

              {user?.pendingDowngrade && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/subscription/cancel-downgrade', {
                        method: 'POST',
                        credentials: 'include'
                      });

                      if (!response.ok) {
                        throw new Error(await response.text());
                      }

                      queryClient.invalidateQueries({ queryKey: ['user'] });

                      toast({
                        title: "Success",
                        description: "Your Pro subscription will continue without interruption.",
                        duration: 5000,
                      });

                    } catch (error) {
                      console.error('Error cancelling downgrade:', error);
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: error instanceof Error ? error.message : "Failed to cancel plan downgrade",
                        duration: 5000,
                      });
                    }
                  }}
                >
                  Cancel Downgrade
                </Button>
              )}
            </>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full bg-[#1BA3FF] hover:bg-[#114D9D] text-white"
                >
                  Resume Subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Resume Subscription</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your subscription will be resumed immediately. Billing will continue according to your regular schedule.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/subscription/resume', {
                          method: 'POST',
                          credentials: 'include'
                        });

                        if (!response.ok) {
                          throw new Error(await response.text());
                        }

                        queryClient.invalidateQueries({ queryKey: ['user'] });

                        toast({
                          title: "Success",
                          description: "Your subscription has been resumed",
                          duration: 5000,
                        });

                      } catch (error) {
                        console.error('Error resuming subscription:', error);
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: error instanceof Error ? error.message : "Failed to resume subscription",
                          duration: 5000,
                        });
                      }
                    }}
                  >
                    Confirm Resume
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
      {user?.pendingDowngrade && user?.subscriptionExpiryDate && (
        <>
          <div className="space-y-4">
            <Alert variant="warning">
              <div>
                <AlertTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Subscription Change Scheduled
                </AlertTitle>
                <AlertDescription className="mt-2 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Your account will downgrade to Free on {new Date(user.subscriptionExpiryDate).toLocaleDateString()}
                </AlertDescription>
              </div>
              {/*This button is removed.  The new button is above*/}
            </Alert>
          </div>
        </>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Subscription Management</h3>
        {user?.subscriptionStatus === "free" ? (
          <div className="space-y-4">
            <div className="bg-primary/5 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Upgrade to Pro</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Get unlimited property analyses, advanced metrics, and priority support
              </p>
              <Button
                onClick={onUpgrade}
                className="w-full bg-[#1BA3FF] hover:bg-[#114D9D]"
              >
                Upgrade Now - R2,000/month
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">

          </div>
        )}
      </div>
    </div>
  );
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

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        setPreviewLogo(base64Data);
        form.setValue("companyLogo", base64Data);
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
          companyLogo: data.companyLogo || previewLogo 
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const updatedUser = await response.json();
      queryClient.setQueryData(['user'], updatedUser);

      toast({
        title: "Success",
        description: "Profile updated successfully",
        duration: 3000,
      });

    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        duration: 5000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (data: ProfileFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      console.error("New passwords do not match");
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

      console.log("Password Changed Successfully");

      form.reset({
        ...form.getValues(),
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      console.error("Error changing password:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const initiateProUpgrade = () => {
    console.log('Initiating Pro upgrade payment flow (Sandbox Mode)');

    // Use sandbox merchant credentials
    const merchantId = "10000100";  // Sandbox merchant ID
    const merchantKey = "46f0cd694581a";  // Sandbox merchant key

    if (!merchantId || !merchantKey) {
      console.error('PayFast merchant credentials missing:', { hasMerchantId: !!merchantId, hasMerchantKey: !!merchantKey });
      toast({
        variant: "destructive",
        title: "Payment Setup Error",
        description: "Unable to process payment at this time. Please try again later or contact support.",
        duration: 5000,
      });
      return;
    }

    if (!user) {
      console.error("User session not found");
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to upgrade your account.",
        duration: 5000,
      });
      return;
    }

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

    try {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://sandbox.payfast.co.za/eng/process";

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
      console.log('Submitting upgrade payment form to PayFast sandbox...');
      form.submit();
    } catch (error) {
      console.error('Error submitting payment form:', error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
        duration: 5000,
      });
    }
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
                              onChange={handleLogoUpload} 
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
                  <CardTitle>Subscription Management</CardTitle>
                  <CardDescription>Manage your subscription and billing preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <BillingDetails user={user} onUpgrade={initiateProUpgrade} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}