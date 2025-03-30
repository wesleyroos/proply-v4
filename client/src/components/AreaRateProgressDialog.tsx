import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface AreaRateProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: "loading" | "success" | "error";
  error?: string;
  propertyType?: string;
  address?: string;
}

export function AreaRateProgressDialog({
  open,
  onOpenChange,
  status,
  error,
  propertyType = 'apartment',
  address = ''
}: AreaRateProgressDialogProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Different steps for different property types
  const apartmentSteps = [
    "Analyzing property location...",
    "Processing market data...",
    "Comparing recent sales...",
    "Calculating area rate..."
  ];
  
  const houseSteps = [
    "Analyzing property location...",
    "Characterizing neighborhood market...",
    "Processing multiple valuation approaches...",
    "Analyzing comparable land values...",
    "Cross-referencing with recent sales...",
    "Validating rate accuracy...",
    "Finalizing erf rate calculation..."
  ];

  const steps = propertyType === 'house' ? houseSteps : apartmentSteps;

  useEffect(() => {
    if (status === "loading") {
      // Use different timing based on property type
      const stepTime = propertyType === 'house' ? 1700 : 1000; // Slower for houses
      const stepInterval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            clearInterval(stepInterval);
            return prev;
          }
          return prev + 1;
        });
      }, stepTime);

      // Progress timer also adjusted for property type
      const progressIncrement = propertyType === 'house' ? 1 : 2; // Slower for houses
      const progressTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + progressIncrement;
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
          <DialogTitle>
            {propertyType === 'house' 
              ? "Enhanced Erf Rate Analysis" 
              : "AI Area Rate Analysis"}
          </DialogTitle>
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
                    {propertyType === 'house' 
                      ? "Our enhanced AI system is applying multiple valuation approaches to calculate accurate erf rates..." 
                      : "Our AI is analyzing recent market data and property values in your area..."}
                  </p>
                  {propertyType === 'house' && (
                    <p className="text-xs text-muted-foreground text-center mt-1 italic">
                      Using triangulation and self-correction for improved accuracy
                    </p>
                  )}
                </>
              )}

              {status === "success" && (
                <div className="text-center space-y-2">
                  <div className="text-green-500 font-semibold">
                    Area rate calculation complete!
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {propertyType === 'house'
                      ? "Our enhanced AI system has successfully analyzed your location and calculated the erf rate using multiple valuation approaches."
                      : "Our AI has successfully analyzed your location and calculated the market rate."}
                  </p>
                  {propertyType === 'house' && (
                    <p className="text-xs text-muted-foreground">
                      Rate based on land (erf) value, not building value
                    </p>
                  )}
                </div>
              )}

              {status === "error" && (
                <div className="text-center space-y-2">
                  <div className="text-red-500 font-semibold">
                    Error calculating area rate
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