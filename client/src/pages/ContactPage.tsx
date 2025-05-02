import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, MapPin, MessageSquare, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { BackgroundPattern } from "@/components/background-pattern";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Here we would typically send the form data to a backend API
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      
      {/* Hero Section with Background Gradient */}
      <div className="relative pt-24 pb-16 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-50 -z-10"></div>
        <BackgroundPattern />
        <div className="absolute top-20 right-20 w-72 h-72 bg-proply-blue/5 rounded-full blur-3xl -z-5"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl -z-5"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-proply-blue/10 text-proply-blue text-sm font-medium mb-6">
              <MessageSquare className="h-4 w-4 mr-2" /> Get in Touch
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Contact Our Team</h1>
            <p className="text-xl text-gray-600">
              Have questions about our property intelligence solutions? We're here to help.
            </p>
          </div>

          {/* Cards Container */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Form Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-proply-blue text-white h-12 w-12 rounded-full flex items-center justify-center shadow-md">
                <Mail className="h-5 w-5" />
              </div>
              
              <div className="pt-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Send Us a Message
                </h2>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your name" 
                              className="border-gray-300 focus:border-proply-blue focus:ring-proply-blue/20" 
                              {...field} 
                            />
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
                          <FormLabel className="text-gray-700">Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your email address" 
                              className="border-gray-300 focus:border-proply-blue focus:ring-proply-blue/20" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Subject</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="What's this about?" 
                              className="border-gray-300 focus:border-proply-blue focus:ring-proply-blue/20" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Your message details" 
                              className="min-h-[150px] border-gray-300 focus:border-proply-blue focus:ring-proply-blue/20" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-proply-blue hover:bg-proply-blue/90 text-white mt-4 py-6"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send Message"} 
                      {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>

            {/* Contact Information Card & Support Features */}
            <div className="space-y-8">
              {/* Contact Information */}
              <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10"></div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  Our Contact Information
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-5">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-proply-blue/10 text-proply-blue">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Address</h3>
                      <p className="text-gray-600">
                        Innovation City
                        <br />
                        Darter Studios, Darter Road, Longkloof, Gardens
                        <br />
                        Cape Town, 8001
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-5">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-proply-blue/10 text-proply-blue">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Email Us</h3>
                      <p className="text-gray-600">
                        <a href="mailto:hello@proply.co.za" className="text-proply-blue hover:underline">
                          hello@proply.co.za
                        </a>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">We aim to respond within 24 hours</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Support & Response Features */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 text-white">
                <h2 className="text-xl font-bold mb-6">Why Contact Us</h2>
                
                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <Clock className="h-6 w-6 text-proply-blue" />
                    </div>
                    <div>
                      <h3 className="font-medium">Fast Response</h3>
                      <p className="text-gray-300 text-sm">We respond to all inquiries within 24 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <MessageSquare className="h-6 w-6 text-proply-blue" />
                    </div>
                    <div>
                      <h3 className="font-medium">Expert Support</h3>
                      <p className="text-gray-300 text-sm">Get assistance from our property intelligence experts</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-proply-blue" />
                    </div>
                    <div>
                      <h3 className="font-medium">Tailored Solutions</h3>
                      <p className="text-gray-300 text-sm">We provide customized solutions to meet your needs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
