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
  DialogTrigger,
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
import { 
  Pencil, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  CalendarDays, 
  CreditCard, 
  Building2, 
  MapPin, 
  FileText,
  Shield,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";


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

// Company/Agency form data interface
interface CompanyFormData {
  registrationNumber: string;
  vatNumber: string;
  businessAddress: string;
}

interface SecurityFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Agency information interface
interface AgencyProfile {
  id: number;
  franchiseName: string;
  branchName: string;
  logoUrl?: string;
  companyName?: string;
  vatNumber?: string;
  registrationNumber?: string;
  businessAddress?: string;
  userRole: string;
}

function ProfileSection() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Fetch agency profile data for admin users
  const { data: agencyProfile } = useQuery<AgencyProfile>({
    queryKey: ['/api/agency-profile'],
    queryFn: async () => {
      const response = await fetch('/api/agency-profile', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch agency profile');
      }
      return response.json();
    },
    enabled: user?.role === 'branch_admin' || user?.role === 'franchise_admin'
  });

  const form = useForm<ProfileFormData>({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      companyName: (user?.role === 'branch_admin' || user?.role === 'franchise_admin') 
        ? (agencyProfile?.companyName || "") 
        : (user?.company || ""),
      vatNumber: agencyProfile?.vatNumber || user?.vatNumber || "",
      registrationNumber: agencyProfile?.registrationNumber || user?.registrationNumber || "",
      businessAddress: agencyProfile?.businessAddress || user?.businessAddress || "",
      companyLogo: agencyProfile?.logoUrl || user?.companyLogo || "",
    },
  });

  // Update form when user data or agency profile changes
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        companyName: (user.role === 'branch_admin' || user.role === 'franchise_admin') 
          ? (agencyProfile?.companyName || "") 
          : (user.company || ""),
        vatNumber: agencyProfile?.vatNumber || user.vatNumber || "",
        registrationNumber: agencyProfile?.registrationNumber || user.registrationNumber || "",
        businessAddress: agencyProfile?.businessAddress || user.businessAddress || "",
        companyLogo: agencyProfile?.logoUrl || user.companyLogo || "",
      });
    }
  }, [user, agencyProfile, form]);

  // Format SA business registration number (YYYY/NNNNNN/NN)
  const formatRegistrationNumber = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Apply SA business registration number format
    if (numbers.length <= 4) {
      return numbers;
    } else if (numbers.length <= 10) {
      return `${numbers.slice(0, 4)}/${numbers.slice(4)}`;
    } else {
      return `${numbers.slice(0, 4)}/${numbers.slice(4, 10)}/${numbers.slice(10, 12)}`;
    }
  };

  const handleRegistrationNumberChange = (event: React.ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) => {
    const formatted = formatRegistrationNumber(event.target.value);
    onChange(formatted);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (user?.role === 'branch_admin' || user?.role === 'franchise_admin')) {
      setIsUploadingLogo(true);
      try {
        // For admin users, upload directly to agency profile
        const formData = new FormData();
        formData.append('logo', file);

        const response = await fetch('/api/agency-profile/logo', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const result = await response.json();
        
        // Update the preview and form
        setPreviewLogo(result.logoUrl);
        form.setValue('companyLogo', result.logoUrl);
        
        // Refresh agency profile data
        queryClient.invalidateQueries({ queryKey: ["/api/agency-profile"] });
        
        toast({
          title: "Success",
          description: "Logo uploaded successfully",
          duration: 3000,
        });

      } catch (error) {
        console.error("Error uploading logo:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to upload logo",
          duration: 5000,
        });
      } finally {
        setIsUploadingLogo(false);
      }
    } else if (file) {
      // For regular users, handle as base64
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
    setIsProfileUpdating(true);
    try {
      // For admin users, update agency profile data
      if (user?.role === 'branch_admin' || user?.role === 'franchise_admin') {
        // Update personal information (user table)
        const userResponse = await fetch("/api/update-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            company: data.companyName,
          }),
        });

        if (!userResponse.ok) {
          throw new Error(await userResponse.text());
        }

        // Update agency information (agency_branches table)
        const agencyResponse = await fetch("/api/agency-profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            companyName: data.companyName,
            vatNumber: data.vatNumber,
            registrationNumber: data.registrationNumber,
            businessAddress: data.businessAddress,
          }),
        });

        if (!agencyResponse.ok) {
          throw new Error(await agencyResponse.text());
        }

        // Refresh queries
        queryClient.invalidateQueries({ queryKey: ["user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/agency-profile"] });
      } else {
        // For regular users, update user table only
        const response = await fetch("/api/update-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            company: data.companyName,
            vatNumber: data.vatNumber,
            registrationNumber: data.registrationNumber,
            businessAddress: data.businessAddress,
            companyLogo: data.companyLogo || previewLogo,
          }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        queryClient.invalidateQueries({ queryKey: ["user"] });
      }

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
                  <FormLabel>
                    {(user?.role === 'branch_admin' || user?.role === 'franchise_admin') ? 'Agency Logo' : 'Company Logo'}
                  </FormLabel>
                  <div className="flex items-start space-x-4">
                    <div>
                      {(previewLogo || agencyProfile?.logoUrl || user?.companyLogo) ? (
                        <img
                          src={previewLogo || agencyProfile?.logoUrl || user?.companyLogo || ''}
                          alt="Logo Preview"
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
                        disabled={isUploadingLogo}
                      />
                      {isUploadingLogo && (
                        <p className="text-sm text-blue-600">Uploading logo...</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {(user?.role === 'branch_admin' || user?.role === 'franchise_admin') 
                          ? 'Upload your agency logo. This will be shared across your branch/franchise.'
                          : 'Upload your company logo. Recommended size: 400x400px.'
                        }
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
                          <Input 
                            {...field}
                            maxLength={14}
                            onChange={(e) => handleRegistrationNumberChange(e, field.onChange)}
                          />
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
          {/* Personal Information */}
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

          {/* Agency Information for Admin Users */}
          {(user?.role === 'branch_admin' || user?.role === 'franchise_admin') && agencyProfile && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Agency Information
              </h3>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="font-medium">Franchise: </span>
                  <span>{agencyProfile.franchiseName}</span>
                </div>
                {user.role === 'branch_admin' && agencyProfile.branchName && (
                  <div>
                    <span className="font-medium">Branch: </span>
                    <span>{agencyProfile.branchName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-medium">Role: </span>
                  <Badge variant={user.role === 'franchise_admin' ? 'default' : 'secondary'}>
                    {user.role === 'franchise_admin' ? 'Franchise Administrator' : 'Branch Administrator'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Company Information */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Company Information</h3>
            <div className="mt-2 space-y-2">
              {/* Show agency logo for admin users, user logo for regular users */}
              {((user?.role === 'branch_admin' || user?.role === 'franchise_admin') ? agencyProfile?.logoUrl : user?.companyLogo) && (
                <div className="w-24 h-24 rounded overflow-hidden mb-4">
                  <img 
                    src={((user?.role === 'branch_admin' || user?.role === 'franchise_admin') ? agencyProfile?.logoUrl : user?.companyLogo) || ''} 
                    alt="Company Logo" 
                    className="w-full h-full object-contain" 
                  />
                </div>
              )}
              <div>
                <span className="font-medium">Company Name: </span>
                <span>
                  {(user?.role === 'branch_admin' || user?.role === 'franchise_admin') 
                    ? (agencyProfile?.companyName || "Not provided")
                    : (user?.company || "Not provided")
                  }
                </span>
              </div>
              <div>
                <span className="font-medium">VAT Number: </span>
                <span>
                  {(user?.role === 'branch_admin' || user?.role === 'franchise_admin') 
                    ? (agencyProfile?.vatNumber || "Not provided")
                    : (user?.vatNumber || "Not provided")
                  }
                </span>
              </div>
              <div>
                <span className="font-medium">Registration Number: </span>
                <span>
                  {(user?.role === 'branch_admin' || user?.role === 'franchise_admin') 
                    ? (agencyProfile?.registrationNumber || "Not provided")
                    : (user?.registrationNumber || "Not provided")
                  }
                </span>
              </div>
              <div>
                <span className="font-medium">Business Address: </span>
                <span>
                  {(user?.role === 'branch_admin' || user?.role === 'franchise_admin') 
                    ? (agencyProfile?.businessAddress || "Not provided")
                    : (user?.businessAddress || "Not provided")
                  }
                </span>
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

  // Billing Usage Overview Component
  const BillingUsageOverview = () => {
    const { data: billingCycles, isLoading } = useQuery({
      queryKey: ['/api/agency-billing/cycles'],
      queryFn: async () => {
        const response = await fetch('/api/agency-billing/cycles', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch billing cycles');
        }
        return response.json();
      },
      enabled: user?.role === 'branch_admin' || user?.role === 'franchise_admin'
    });

    if (isLoading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Report Usage Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">Loading billing data...</div>
          </CardContent>
        </Card>
      );
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const currentCycle = billingCycles?.billingCycles?.find((cycle: any) => cycle.billingPeriod === currentMonth);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Report Usage Overview
          </CardTitle>
          <CardDescription>
            Monthly report generation usage and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Month Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-[#007B8A]">
                {currentCycle?.reportCount || 0}
              </div>
              <div className="text-sm text-muted-foreground">Reports This Month</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                R{currentCycle?.subtotal || '0.00'}
              </div>
              <div className="text-sm text-muted-foreground">Subtotal (Excl. VAT)</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                R{currentCycle?.totalAmount || '0.00'}
              </div>
              <div className="text-sm text-muted-foreground">Total (Incl. VAT)</div>
            </div>
          </div>

          {/* Recent Billing Cycles */}
          {billingCycles?.billingCycles?.length > 0 && (
            <div>
              <h3 className="font-medium text-sm mb-3">Recent Billing Cycles</h3>
              <div className="space-y-2">
                {billingCycles.billingCycles.slice(0, 3).map((cycle: any) => (
                  <div key={cycle.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{cycle.billingPeriod}</div>
                      <div className="text-sm text-muted-foreground">
                        {cycle.reportCount} reports • R{cycle.pricePerReport} per report
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">R{cycle.totalAmount}</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        cycle.status === 'paid' ? 'bg-green-100 text-green-800' :
                        cycle.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {cycle.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!billingCycles?.billingCycles || billingCycles.billingCycles.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <div className="font-medium">No billing cycles yet</div>
              <div className="text-sm">Generate reports to start tracking usage</div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Payment Methods Section Component
  const PaymentMethodsSection = () => {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [isProcessingCard, setIsProcessingCard] = useState(false);
    const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);
    const [isTestingPayment, setIsTestingPayment] = useState(false);
    const [isProcessingTestPayment, setIsProcessingTestPayment] = useState(false);
    const [testPaymentAmount, setTestPaymentAmount] = useState('10.00');
    const [deleteConfirmModal, setDeleteConfirmModal] = useState<{open: boolean, methodId: number | null}>({ open: false, methodId: null });

    // Fetch existing payment methods
    const { data: paymentMethodsData, refetch: refetchPaymentMethods } = useQuery({
      queryKey: ['/api/payment-methods'],
      queryFn: async () => {
        const response = await fetch('/api/payment-methods', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch payment methods');
        }
        return response.json();
      },
      enabled: user?.role === 'branch_admin' || user?.role === 'franchise_admin'
    });

    // Simplified card form state - only cardholder name needed
    const [cardForm, setCardForm] = useState({
      cardholderName: ''
    });

    const handleAddCard = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsProcessingCard(true);

      try {
        // Get PayFast tokenization URL
        const tokenizeResponse = await fetch('/api/payfast/create-tokenize-url', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!tokenizeResponse.ok) {
          throw new Error('Failed to create PayFast tokenization URL');
        }
        
        const { tokenizeUrl } = await tokenizeResponse.json();

        // Validate cardholder name
        if (!cardForm.cardholderName) {
          throw new Error('Please enter the cardholder name');
        }

        console.log('Redirecting to PayFast tokenization URL:', tokenizeUrl);
        
        // Store cardholder name for when user returns from PayFast
        localStorage.setItem('pending_cardholder_name', cardForm.cardholderName);
        
        // Redirect to PayFast tokenization page
        window.location.href = tokenizeUrl;

      } catch (error) {
        console.error('Error creating PayFast tokenization URL:', error);
        toast({
          variant: "destructive",
          title: "Failed to initialize payment",
          description: error instanceof Error ? error.message : "Please try again"
        });
        setIsProcessingCard(false);
      }
    };





    const confirmDeletePaymentMethod = (methodId: number) => {
      setDeleteConfirmModal({ open: true, methodId });
    };

    const removePaymentMethod = async () => {
      if (!deleteConfirmModal.methodId) return;
      
      try {
        const response = await fetch(`/api/payment-methods/${deleteConfirmModal.methodId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to remove payment method');
        }

        toast({
          title: "Payment method removed",
          description: "Card has been removed from your account."
        });

        setDeleteConfirmModal({ open: false, methodId: null });
        refetchPaymentMethods();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to remove payment method",
          description: error instanceof Error ? error.message : "Please try again"
        });
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>
              Manage payment methods for agency billing. Reports will be charged to your active payment method.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Existing Payment Methods */}
            {paymentMethodsData?.paymentMethods?.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm">Saved Payment Methods</h3>
                {paymentMethodsData.paymentMethods.map((method: any) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {method.cardType} •••• {method.lastFour}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Expires {method.expiryMonth}/{method.expiryYear}
                          {method.isPrimary && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              Primary
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmModal({ open: true, methodId: method.id })}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}



            {/* Add New Payment Method */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-sm">Add New Payment Method</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingCard(!isAddingCard)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Card
                </Button>
              </div>

              {isAddingCard && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="text-sm text-gray-600 mb-4">
                    Click "Add Payment Method" to securely add your card via PayFast's secure payment form. 
                    A R5.00 authorization will be processed for tokenization.
                  </div>

                  {/* Test Card Information */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Test Mode Active - Use These Test Cards:</h4>
                    <div className="text-xs text-blue-700 space-y-1">
                      <div><strong>Successful Payment:</strong> 4111 1111 1111 1111 (Visa)</div>
                      <div><strong>Successful Payment:</strong> 5555 5555 5555 4444 (Mastercard)</div>
                      <div><strong>Expiry:</strong> Any future date (e.g., 12/25)</div>
                      <div><strong>CVV:</strong> Any 3-digit number (e.g., 123)</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Cardholder Name</label>
                      <Input
                        value={cardForm.cardholderName}
                        onChange={(e) => setCardForm(prev => ({ ...prev, cardholderName: e.target.value }))}
                        placeholder="John Doe"
                        required
                        className="mt-1"
                      />
                    </div>



                    <p className="text-xs text-muted-foreground mt-2">
                      Card details will be entered securely in PayFast's payment form
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAddCard} disabled={isProcessingCard}>
                      {isProcessingCard ? "Processing..." : "Add Payment Method"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setIsAddingCard(false)}
                    >
                      Cancel
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground mt-2">
                    Your payment information is securely processed by PayFast. Card details are tokenized and never stored on our servers.
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteConfirmModal.open} onOpenChange={(open) => setDeleteConfirmModal({ open, methodId: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Payment Method</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this payment method? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmModal({ open: false, methodId: null })}>
                Cancel
              </Button>
              <Button onClick={removePaymentMethod} className="bg-red-600 hover:bg-red-700">
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
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
              {(user?.role === 'branch_admin' || user?.role === 'franchise_admin') && (
                <TabsTrigger value="payment-methods">Agency Billing</TabsTrigger>
              )}
              {(user?.role !== 'branch_admin' && user?.role !== 'franchise_admin') && (
                <>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                  <TabsTrigger value="invoices">Invoices</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="profile">
              <ProfileSection />
            </TabsContent>

            {(user?.role === 'branch_admin' || user?.role === 'franchise_admin') && (
              <TabsContent value="payment-methods">
                <div className="space-y-6">
                  <BillingUsageOverview />
                  <PaymentMethodsSection />
                </div>
              </TabsContent>
            )}

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
                  {/* Show different content based on user type */}
                  {user?.role === 'branch_admin' || user?.role === 'franchise_admin' ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">Agency Invoice History</p>
                      <p className="text-sm text-muted-foreground">
                        Agency invoices will appear here once billing cycle is activated
                      </p>
                    </div>
                  ) : user?.subscriptionStatus === "pro" ? (
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
                                  0}
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

// Agency Billing Components for Admin Users
function AgencyBillingCycleStatus({ user }: { user: SelectUser | null }) {
  const isActivated = false; // Mock data - will be replaced with real API
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Billing Cycle Status
        </CardTitle>
        <CardDescription>
          Your agency's billing activation status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          {isActivated ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-600">Active</p>
                <p className="text-sm text-muted-foreground">
                  Billing cycle started on March 1, 2024
                </p>
              </div>
            </>
          ) : (
            <>
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-600">Pending Activation</p>
                <p className="text-sm text-muted-foreground">
                  Contact support to activate your billing cycle
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AgencyPaymentMethod({ user }: { user: SelectUser | null }) {
  const [showAddCard, setShowAddCard] = useState(false);
  const hasPaymentMethod = false; // Mock data - will be replaced with real API
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Method
        </CardTitle>
        <CardDescription>
          Manage your agency's payment method for billing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasPaymentMethod ? (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium">Visa ending in 1234</p>
                <p className="text-sm text-muted-foreground">Expires 12/25</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Edit
              </Button>
              <Button variant="outline" size="sm">
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No payment method on file</p>
            <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
              <DialogTrigger asChild>
                <Button>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Payment Method</DialogTitle>
                  <DialogDescription>
                    Enter your credit card details for agency billing
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Card Number</label>
                      <Input placeholder="1234 5678 9012 3456" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Cardholder Name</label>
                      <Input placeholder="John Doe" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Expiry Date</label>
                      <Input placeholder="MM/YY" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">CVV</label>
                      <Input placeholder="123" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      Card details are securely encrypted and processed by our payment provider
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddCard(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-[#1BA3FF] hover:bg-[#114D9D]">
                    Add Card
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BillingDetails({ user, onUpgrade }: { user: SelectUser | null; onUpgrade: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [downgradePauseReason, setDowngradePauseReason] = useState("");
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);

  // Show different content for admin users
  if (user?.role === 'branch_admin' || user?.role === 'franchise_admin') {
    return (
      <div>
        <AgencyBillingCycleStatus user={user} />
        <AgencyPaymentMethod user={user} />
      </div>
    );
  }

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


  const handleDowngrade = async () => {
    if (!downgradePauseReason.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a reason for downgrading",
        duration: 3000,
      });
      return;
    }

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ reason: downgradePauseReason })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      queryClient.invalidateQueries({ queryKey: ['user'] });
      setShowDowngradeDialog(false);
      setDowngradePauseReason("");

      toast({
        title: "Success",
        description: "Your subscription downgrade has been scheduled",
        duration: 5000,
      });

    } catch (error) {
      console.error('Error downgrading subscription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to downgrade subscription",
        duration: 5000,
      });
    }
  };

  const handlePause = async () => {
    if (!downgradePauseReason.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a reason for pausing",
        duration: 3000,
      });
      return;
    }

    try {
      const response = await fetch('/api/subscription/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          cycles: 1,
          reason: downgradePauseReason
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      queryClient.invalidateQueries({ queryKey: ['user'] });
      setShowPauseDialog(false);
      setDowngradePauseReason("");

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

        {user?.subscriptionStatus === 'pro' && (
          <div className="mt-6 space-y-4">
            {user?.payfastSubscriptionStatus !== "paused" ? (
              <>
                <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Pause Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Pause Subscription</DialogTitle>
                      <DialogDescription>
                        Your subscription will be paused for one billing cycle. Please let us know why you're pausing:
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Textarea
                        value={downgradePauseReason}
                        onChange={(e) => setDowngradePauseReason(e.target.value)}
                        placeholder="Please tell us why you're pausing your subscription..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowPauseDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handlePause}>
                        Confirm Pause
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {user.pendingDowngrade ? (
                  <Button
                    variant="outline"
                    className="w-full"
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
                ) : (
                  <Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full text-red-500 hover:text-red-600">
                        Cancel Subscription
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel Subscription</DialogTitle>
                        <DialogDescription>
                          Your subscription will be downgraded to the free plan at the end of your current billing period. Please let us know why you're cancelling:
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Textarea
                          value={downgradePauseReason}
                          onChange={(e) => setDowngradePauseReason(e.target.value)}
                          placeholder="Please tell us why you're cancelling your subscription..."
                          className="min-h-[100px]"
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDowngradeDialog(false)}>
                          Keep Subscription
                        </Button>
                        <Button variant="destructive" onClick={handleDowngrade}>
                          Confirm Cancellation
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
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
      </div>
    </div>
  );
}