import { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Wallet,
  Loader2,
  Download,
  Clock,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AreaRateProgressDialog } from "@/components/AreaRateProgressDialog";

interface DealResult {
  score: number;
  rating: string;
  color: string;
  percentageDifference: number;
  askingPrice: number;
  estimatedValue: number;
  propertyRate: number;
  areaRate: number;
  propertyCondition: string;
  shortTermYield: number | null;
  longTermYield: number | null;
  bestStrategy: string;
}

export default function DealScorePublicPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Property Details (Step 1)
    address: "",
    purchasePrice: "",
    size: "",
    areaRate: "",
    bedrooms: "",
    propertyCondition: "excellent",

    // Rental Details (Step 2)
    nightlyRate: "",
    occupancy: "",
    longTermRental: "",

    // Financing Details (Step 3)
    depositAmount: "",
    depositPercentage: "",
    interestRate: "11.75",
    loanTerm: "20",
  });

  const [result, setResult] = useState<DealResult | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [demoClicks, setDemoClicks] = useState(0);
  const [areaRateStatus, setAreaRateStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [showAreaRateDialog, setShowAreaRateDialog] = useState(false);
  const [areaRateError, setAreaRateError] = useState<string | undefined>();
  const [reportUnlocked, setReportUnlocked] = useState(false);

  const handleNewCalculation = () => {
    setShowResult(false);
    setFormData({
      // Property Details (Step 1)
      address: "",
      purchasePrice: "",
      size: "",
      areaRate: "",
      bedrooms: "",
      propertyCondition: "excellent",

      // Rental Details (Step 2)
      nightlyRate: "",
      occupancy: "",
      longTermRental: "",

      // Financing Details (Step 3)
      depositAmount: "",
      depositPercentage: "",
      interestRate: "11.75",
      loanTerm: "20",
    });
    setReportUnlocked(false);
  };

  const handleDownloadReport = () => {
      // Add your download logic here
      console.log("Download Full Report clicked");
  };

  const handlePayment = async () => {
    setProcessingPayment(true);
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setReportUnlocked(true);
      setShowPaymentModal(false);
      toast({
        title: "Payment Successful!",
        description: "Your full report is now unlocked.",
      });
    } catch (error) {
      toast({
        title: "Payment Failed!",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden bg-background">
      <main className="flex-1 overflow-y-auto">
        <div className="container px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <Card>
              <div className="p-6">
                {showResult ? (
                  <div>
                    <div className="space-y-8">
                      <div className="mt-8">
                        <h3 className="text-2xl font-bold mb-4">Deal Score: {result?.score}</h3>
                        <p className="text-lg text-muted-foreground">
                          {result?.rating} - {result?.percentageDifference.toFixed(0)}%
                        </p>
                        <div className="rounded-lg p-4 bg-primary/10 border border-primary/20">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-lg font-medium">Asking Price:</span>
                            <span className="text-lg font-medium">R{result?.askingPrice.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-lg font-medium">Estimated Value:</span>
                            <span className="text-lg font-medium">R{result?.estimatedValue.toLocaleString()}</span>
                          </div>
                          {result?.percentageDifference > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-medium">Value Difference:</span>
                              <span className="text-lg font-medium text-green-600">
                                +R{(result?.estimatedValue - result?.askingPrice).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Results Section */}
                      <div className={`space-y-8 ${!reportUnlocked ? 'blur-sm select-none pointer-events-none' : ''}`}>
                        <div className="mt-8">
                          <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                            defaultValue={reportUnlocked ? "deal-factors" : undefined}
                          >
                            <AccordionItem value="deal-factors">
                              <AccordionTrigger className="text-xl font-semibold">
                                Key Deal Factors
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4 pt-2">
                                  <div className="flex justify-between">
                                    <span>Price per m²:</span>
                                    <span className="font-medium">
                                      R{result ? Math.round(result.propertyRate).toLocaleString() : 0}/m²
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Area average:</span>
                                    <span className="font-medium">
                                      R{result ? Math.round(result.areaRate).toLocaleString() : 0}/m²
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Property condition:</span>
                                    <span className="font-medium capitalize">
                                      {result?.propertyCondition}
                                    </span>
                                  </div>
                                  {result?.shortTermYield && (
                                    <div className="flex justify-between">
                                      <span>Short-Term Yield:</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                          {result.shortTermYield.toFixed(1)}%
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 text-xs rounded ${
                                            result.shortTermYield >= 12
                                              ? "bg-green-100 text-green-800"
                                              : result.shortTermYield >= 8
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-red-100 text-red-800"
                                          }`}
                                        >
                                          {result.shortTermYield >= 12
                                            ? "EXCELLENT"
                                            : result.shortTermYield >= 8
                                            ? "GOOD"
                                            : "POOR"}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {result?.longTermYield && (
                                    <div className="flex justify-between">
                                      <span>Long-Term Yield:</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                          {result.longTermYield.toFixed(1)}%
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 text-xs rounded ${
                                            result.longTermYield >= 8
                                              ? "bg-green-100 text-green-800"
                                              : result.longTermYield >= 6
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-red-100 text-red-800"
                                          }`}
                                        >
                                          {result.longTermYield >= 8
                                            ? "EXCELLENT"
                                            : result.longTermYield >= 6
                                            ? "GOOD"
                                            : "POOR"}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span>Best Investment Strategy:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {result?.bestStrategy}
                                      </span>
                                      <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-800">
                                        RECOMMENDED
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>

                        <div className="mt-8 flex justify-center">
                          {reportUnlocked && (
                            <Button size="lg" onClick={() => handleDownloadReport()}>
                              <Download className="mr-2 h-4 w-4" />
                              Download Full Report
                            </Button>
                          )}
                        </div>
                      </div>

                      {!reportUnlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-background/80 to-background/95 backdrop-blur-sm rounded-lg">
                          <Lock className="w-12 h-12 text-primary mb-4" />
                          <h3 className="text-xl font-semibold mb-2">Unlock Full Report</h3>
                          <p className="text-muted-foreground mb-4 text-center max-w-sm">
                            Get access to the complete property analysis and investment insights
                          </p>
                          <Button onClick={() => setShowPaymentModal(true)} size="lg">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay R49
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between mt-8">
                      <Button
                        variant="outline"
                        onClick={handleNewCalculation}
                      >
                        New Calculation
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* ... Rest of the form component ... */}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
        <div className="py-16 space-y-24">
          <section className="container px-4">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Stop Guessing If That Property Is Worth Your Investment
              </h2>
              <p className="text-xl text-muted-foreground">
                Property investors like you face these challenges every day. We've built the solution you've been looking
                for.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <div className="bg-card rounded-lg p-6 shadow-sm border border-border/50 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Hours Wasted on Research</h3>
                <p className="text-muted-foreground">
                  You spend countless hours researching properties, comparing prices, and trying to determine if a deal is
                  worth pursuing.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm border border-border/50 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Uncertain ROI Calculations</h3>
                <p className="text-muted-foreground">
                  Without accurate data, you're left guessing about potential returns, rental yields, and whether the asking
                  price is fair.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm border border-border/50 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Missing Great Opportunities</h3>
                <p className="text-muted-foreground">
                  Analysis paralysis means you might miss out on properties with excellent potential while others snap them
                  up.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-muted/30 py-16">
            <div className="container px-4">
              <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Make Confident Investment Decisions in Minutes
                </h2>
                <p className="text-xl text-muted-foreground">
                  Our Deal Score™ gives you the clarity you need to act quickly and confidently.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold mb-1">Instant Property Analysis</h3>
                      <p className="text-muted-foreground">
                        Get a comprehensive deal score in seconds, not days. Know immediately if a property is worth
                        pursuing.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold mb-1">Data-Driven Insights</h3>
                      <p className="text-muted-foreground">
                        Make decisions based on real market data, not hunches. Compare properties against area averages and
                        historical trends.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold mb-1">Financing Clarity</h3>
                      <p className="text-muted-foreground">
                        Understand exactly what a property will cost you monthly and what returns you can expect, both short
                        and long term.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative rounded-lg overflow-hidden shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-lg blur opacity-75"></div>
                  <div className="relative bg-card rounded-lg overflow-hidden">
                    <img
                      src="/screenshot.png"
                      alt="Property analysis form"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-primary/5 py-16 border-y">
            <div className="container px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">R2.8B+</div>
                  <p className="text-muted-foreground">Property Value Analyzed</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">12,500+</div>
                  <p className="text-muted-foreground">Investors Helped</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">18.5%</div>
                  <p className="text-muted-foreground">Average ROI Improvement</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">9.2/10</div>
                  <p className="text-muted-foreground">Investor Satisfaction</p>
                </div>
              </div>
            </div>
          </section>

          <section className="container px-4">
            <div className="max-w-4xl mx-auto bg-card rounded-lg p-8 md:p-12 shadow-lg border border-border/50 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Ready to Make Smarter Property Investments?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of successful investors who are finding better deals, maximizing returns, and building wealth
                through property.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8">
                  Get Started Free
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8">
                  See How It Works
                </Button>
              </div>
            </div>
          </section>
        </div>

      </main>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Unlock Full Report</DialogTitle>
            <DialogDescription>
              Access the complete property analysis including market insights,
              investment potential, and detailed recommendations.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-16px font-medium">Report Price:</span>
              <span className="text-xl font-bold">R49</span>
            </div>

            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="card" id="card" className="peer sr-only" />
                <Label
                  htmlFor="card"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <CreditCard className="mb-3 h-6 w-6" />
                  Card
                </Label>
              </div>
              <div>
                <RadioGroupItem value="instant-eft" id="instant-eft" className="peer sr-only" />
                <Label
                  htmlFor="instant-eft"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Wallet className="mb-3 h-6 w-6" />
                  Instant EFT
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button
              onClick={handlePayment}
              disabled={processingPayment}
              className="w-full"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Pay R49"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AreaRateProgressDialog
        open={showAreaRateDialog}
        onOpenChange={setShowAreaRateDialog}
        status={areaRateStatus}
        error={areaRateError}
      />
    </div>
  );
}