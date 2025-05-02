'use client'

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, Loader2 } from 'lucide-react';

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'Please enter your full name' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  company: z.string().min(1, { message: 'Please enter your company name' }),
  phoneNumber: z.string().min(10, { message: 'Please enter a valid phone number' }),
  product: z.string({ required_error: 'Please select a product' }),
  message: z.string().min(1, { message: 'Please let us know how we can help you' }),
});

type FormValues = z.infer<typeof formSchema>;

interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoRequestModal({ isOpen, onClose }: DemoRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      company: '',
      phoneNumber: '',
      product: '',
      message: '',
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    
    try {
      // Send the data to the backend API
      const response = await fetch('/api/demo-request', { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data) 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit demo request');
      }
      
      // Show success state and toast notification
      setIsSuccess(true);
      
      toast({
        title: "Demo request submitted",
        description: "We'll be in touch with you soon to schedule your personalized demo.",
        variant: "default",
      });
      
      // Reset form after success
      setTimeout(() => {
        setIsSuccess(false);
        form.reset();
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Failed to submit demo request', error);
      // Display error message to user
      toast({
        title: "Failed to submit request",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      // Keep the form open so user can try again
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] overflow-hidden border-slate-200 bg-white/95 backdrop-blur-sm shadow-lg">
        {!isSuccess ? (
          <>
            <DialogHeader className="pb-4 relative">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full opacity-70 -z-10"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-50 to-green-100 rounded-full opacity-50 -z-10"></div>
              <DialogTitle className="text-2xl font-bold text-gray-800">Book a Personalized Demo</DialogTitle>
              <DialogDescription className="text-base text-gray-600 mt-2">
                Let us show you how Proply can help your business make smarter property investment decisions.
              </DialogDescription>
              <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mt-3"></div>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-gray-700">Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" className="border-slate-300 focus:border-blue-400 transition-colors" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-gray-700">Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@company.com" className="border-slate-300 focus:border-blue-400 transition-colors" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-gray-700">Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your company" className="border-slate-300 focus:border-blue-400 transition-colors" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-gray-700">Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Your phone number" className="border-slate-300 focus:border-blue-400 transition-colors" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="product"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">Product of Interest</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-slate-300 focus:border-blue-400 transition-colors">
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="property-analyzer">Property Analyzer</SelectItem>
                          <SelectItem value="risk-index">Risk Index</SelectItem>
                          <SelectItem value="deal-score">Deal Score</SelectItem>
                          <SelectItem value="rent-compare">Rent Compare</SelectItem>
                          <SelectItem value="enterprise">Enterprise Solutions</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium text-gray-700">How can we help you?</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about your specific needs or questions..."
                          className="min-h-[100px] border-slate-300 focus:border-blue-400 transition-colors"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm transition-all" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Request Demo"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 relative">
            {/* Background decorative elements */}
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-green-50 to-blue-50 rounded-full opacity-70 -z-10"></div>
            <div className="absolute bottom-6 right-6 w-24 h-24 bg-gradient-to-tl from-blue-50 to-green-50 rounded-full opacity-50 -z-10"></div>
            <div className="absolute top-1/3 right-12 w-6 h-6 bg-green-50 rounded-full opacity-60 -z-10"></div>
            <div className="absolute top-2/3 left-10 w-8 h-8 bg-blue-50 rounded-full opacity-60 -z-10"></div>
            
            {/* Success animation */}
            <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mb-8 shadow-sm">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-center mb-3 text-gray-800">Request Submitted</h3>
            <div className="h-1 w-16 bg-gradient-to-r from-green-400 to-green-500 rounded-full mb-4"></div>
            <p className="text-center text-gray-600 max-w-md leading-relaxed">
              Thank you for your interest! Our team will contact you within the next 24 hours to schedule your personalized demo.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}