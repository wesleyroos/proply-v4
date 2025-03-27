import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface RentalAmountProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: "loading" | "success" | "error";
  error?: string;
}

export function RentalAmountProgressDialog({
  open,
  onOpenChange,
  status,
  error
}: RentalAmountProgressDialogProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Analyzing property details...",
    "Processing location data...",
    "Analyzing rental market...",
    "Calculating optimal rental amount..."
  ];

  useEffect(() => {
    if (status === "loading") {
      const stepInterval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            clearInterval(stepInterval);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      const progressTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + 2;
        });
      }, 200);

      return () => {
        clearInterval(stepInterval);
        clearInterval(progressTimer);
      };
    } else if (status === "success") {
      setProgress(100);
      setCurrentStep(steps.length - 1);
    }
  }, [status]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Rental Analysis</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              {status === "loading" && (
                <>
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center space-x-2 transition-opacity duration-200 ${
                          index <= currentStep ? 'opacity-100' : 'opacity-30'
                        }`}
                      >
                        {index === currentStep ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : index < currentStep ? (
                          <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center text-white text-xs">✓</div>
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-gray-300" />
                        )}
                        <p className="text-sm">{step}</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Our AI is analyzing rental market data for your location...
                  </p>
                </>
              )}

              {status === "success" && (
                <div className="text-center space-y-2">
                  <div className="text-green-500 font-semibold">
                    Rental amount calculation complete!
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Our AI has successfully analyzed your property and calculated the optimal rental amount.
                  </p>
                </div>
              )}

              {status === "error" && (
                <div className="text-center space-y-2">
                  <div className="text-red-500 font-semibold">
                    Error calculating rental amount
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {error || "Please try again later"}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}