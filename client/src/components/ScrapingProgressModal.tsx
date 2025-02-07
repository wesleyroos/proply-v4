import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface ScrapingProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: string;
  progress: number;
  data: any;
}

export function ScrapingProgressModal({
  open,
  onOpenChange,
  status,
  progress,
  data
}: ScrapingProgressModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fetching Property Data</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{status}</p>
            <Progress value={progress} />
          </div>
          
          {data && progress === 100 && (
            <div className="space-y-4 mt-4">
              <h3 className="font-semibold">Found Data:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {Object.entries(data).map(([key, value]) => (
                  value && (
                    <div key={key} className="space-y-1">
                      <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-muted-foreground">
                        {Array.isArray(value) ? value.join(', ') : value.toString()}
                      </p>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
