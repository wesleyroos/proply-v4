import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { downloadInvoice } from "@/services/invoiceService";
import { useQuery } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import type { SelectUser, SelectInvoice } from "@db/schema";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, AlertTriangle, CheckCircle2, Download, CalendarDays } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


// Profile form data interface
interface ProfileFormData {
  firstName: string;
  lastName: string;
  companyName: string;
  vatNumber: string;
  registrationNumber: string;
  businessAddress: string;
  companyLogo?: string;
}

function ProfileSection() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      companyName: user?.company || "",
      vatNumber: user?.vatNumber || "",
      registrationNumber: user?.registrationNumber || "",
      businessAddress: user?.businessAddress || "",
      companyLogo: user?.companyLogo || "",
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        companyName: user.company || "",
        vatNumber: user.vatNumber || "",
        registrationNumber: user.registrationNumber || "",
        businessAddress: user.businessAddress || "",
        companyLogo: user.companyLogo || "",
      });
    }
  }, [user, form]);

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
    console.log("Starting profile update with data:", data);
    setIsProfileUpdating(true);
    try {
      const profileData = {
        firstName: data.firstName,
        lastName: data.lastName,
        companyLogo: data.companyLogo || previewLogo,
        company: data.companyName,
        vatNumber: data.vatNumber,
        registrationNumber: data.registrationNumber,
        businessAddress: data.businessAddress,
      };

      console.log("Sending profile update request with:", profileData);

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Profile update failed:", await response.text());
        throw new Error(await response.text());
      }

      const updatedUser = await response.json();
      console.log("Profile update successful:", updatedUser);

      queryClient.setQueryData(["user"], updatedUser);
      setShowEditModal(false);
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
      setIsProfileUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your personal and company information</CardDescription>
        </div>
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile information here
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleProfileUpdate)} className="space-y-4">
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
                      {(previewLogo || user?.companyLogo) ? (
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

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your Company Ltd" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vatNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VAT Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="4XXXXXXXXX" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Registration Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="XXXX/XXXXXX/XX" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123 Business Street, City" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#1BA3FF] hover:bg-[#114D9D]"
                    disabled={isProfileUpdating}
                  >
                    {isProfileUpdating ? "Updating..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Personal Information</h3>
            <div className="mt-2 space-y-2">
              <div>
                <span className="font-medium">Email: </span>
                <span>{user?.email}</span>
              </div>
              <div>
                <span className="font-medium">Name: </span>
                <span>{user?.firstName} {user?.lastName}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Company Information</h3>
            <div className="mt-2 space-y-2">
              {user?.companyLogo && (
                <div className="w-24 h-24 rounded overflow-hidden mb-4">
                  <img src={user.companyLogo} alt="Company Logo" className="w-full h-full object-contain" />
                </div>
              )}
              <div>
                <span className="font-medium">Company Name: </span>
                <span>{user?.company || "Not provided"}</span>
              </div>
              <div>
                <span className="font-medium">VAT Number: </span>
                <span>{user?.profile?.vatNumber || user?.vatNumber || "Not provided"}</span>
              </div>
              <div>
                <span className="font-medium">Registration Number: </span>
                <span>{user?.profile?.registrationNumber || user?.registrationNumber || "Not provided"}</span>
              </div>
              <div>
                <span className="font-medium">Business Address: </span>
                <span>{user?.profile?.businessAddress || user?.businessAddress || "Not provided"}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SecurityFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isSecurityUpdating, setIsSecurityUpdating] = useState(false);

  const securityForm = useForm<SecurityFormData>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handlePasswordChange = async (data: SecurityFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      console.error("New passwords do not match");
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
        duration: 3000
      })
      return;
    }

    setIsSecurityUpdating(true);
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

      securityForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      toast({
        title: "Success",
        description: "Password updated successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password",
        duration: 5000,
      });
    } finally {
      setIsSecurityUpdating(false);
    }
  };

  const initiateProUpgrade = () => {
    console.log('Initiating Pro upgrade payment flow (Sandbox Mode)');

    const merchantId = import.meta.env.DEV
      ? import.meta.env.VITE_PAYFAST_SANDBOX_MERCHANT_ID
      : import.meta.env.VITE_PAYFAST_MERCHANT_ID;
    const merchantKey = import.meta.env.DEV
      ? import.meta.env.VITE_PAYFAST_SANDBOX_MERCHANT_KEY
      : import.meta.env.VITE_PAYFAST_MERCHANT_KEY;

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
      form.action = import.meta.env.DEV
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

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['/api/invoices'],
    queryFn: async () => {
      const response = await fetch('/api/invoices', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      return response.json();
    },
    enabled: user?.subscriptionStatus === "pro"
  });
  const [, setLocation] = useLocation();


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
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <ProfileSection />
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                      <FormField
                        control={securityForm.control}
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
                        control={securityForm.control}
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
                        control={securityForm.control}
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
                        disabled={isSecurityUpdating}
                      >
                        {isSecurityUpdating ? (
                          <>
                            <span className="loading loading-spinner loading-sm mr-2"></span>
                            Updating...
                          </>
                        ) : (
                          "Change Password"
                        )}
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

            <TabsContent value="invoices">
              <Card>
                <CardHeader>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>View and download your billing history</CardDescription>
                </CardHeader>
                <CardContent>
                  {user?.subscriptionStatus === "pro" ? (
                    invoicesLoading ? (
                      <div className="text-center py-4">
                        <span className="loading loading-spinner loading-md"></span>
                        <p className="text-sm text-muted-foreground mt-2">Loading invoices...</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice Number</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices?.map((invoice: SelectInvoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                              <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>{invoice.description}</TableCell>
                              <TableCell className="text-right">
                                R{typeof invoice.amount === 'string' ?
                                  parseFloat(invoice.amount).toFixed(2) :
                                  invoice.amount.toFixed(2)}
                              </TableCell>
                              <TableCell className="capitalize">{invoice.status}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => downloadInvoice(invoice)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!invoices || invoices.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground">
                                No invoices found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-500">
                        Upgrade to Pro to view your invoice history
                      </p>
                      <Button
                        onClick={() => setShowUpgradeModal(true)}
                        className="mt-4 bg-[#1BA3FF] hover:bg-[#114D9D]"
                      >
                        Upgrade to Pro
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}

function BillingDetails({ user, onUpgrade }: { user: SelectUser | null; onUpgrade: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

  const subscriptionDates = user ? {
    nextBilling: user.subscriptionNextBillingDate ? formatDate(new Date(user.subscriptionNextBillingDate)) : 'Not available',
    activationDate: user.subscriptionStartDate ? formatDate(new Date(user.subscriptionStartDate)) : 'Not available'
  } : {
    nextBilling: 'Not available',
    activationDate: 'Not available'
  };

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
      {user?.pendingDowngrade && user?.subscriptionExpiryDate && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm font-medium text-red-800">
              Your account will downgrade to Free on {new Date(user.subscriptionExpiryDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="font-semibold mb-4">Current Plan Details</h3>
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium">Plan</label>
            <p className="text-muted-foreground capitalize">
              {user?.subscriptionStatus || 'Free'}
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

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
                    disabled={user?.pendingDowngrade ?? false}
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
                    Your subscription will be resumed immediately. Billing will continue according to yourregular schedule.
                  </AlertDialogDescription>
                </AlertDialogHeader><AlertDialogFooter>
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
                onClick={() => setShowUpgradeModal(true)}
                className="w-full bg-[#1BA3FF] hover:bg-[#114D9D]"
              >
                Upgrade to Pro
              </Button>
              <UpgradeModal
                open={showUpgradeModal}
                onOpenChange={setShowUpgradeModal}
              />
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