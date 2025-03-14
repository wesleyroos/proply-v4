import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface AreaRateProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: "loading" | "success" | "error";
  error?: string;
}

export function AreaRateProgressDialog({
  open,
  onOpenChange,
  status,
  error
}: AreaRateProgressDialogProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (status === "loading") {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(timer);
            return 90;
          }
          return prev + 10;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else if (status === "success") {
      setProgress(100);
    }
  }, [status]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Calculating Area Rate</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card className="p-4">
            <div className="space-y-2">
              {status === "loading" && (
                <>
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <p className="text-sm">Analyzing property location...</p>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Our AI is analyzing recent market data for your area...
                  </p>
                </>
              )}
              
              {status === "success" && (
                <div className="text-center space-y-2">
                  <div className="text-green-500 font-semibold">
                    Area rate calculation complete!
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The rate has been automatically updated in the form.
                  </p>
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
