import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScrapingProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: string;
  progress: number;
  data: any;
  onConfirm?: (data: any) => void;
}

export function ScrapingProgressModal({
  open,
  onOpenChange,
  status,
  progress,
  data,
  onConfirm
}: ScrapingProgressModalProps) {
  const handleConfirm = () => {
    if (onConfirm && data) {
      onConfirm(data);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Fetching Property Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{status}</p>
            <Progress value={progress} />
          </div>

          {data && progress === 100 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Found Data:</h3>
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(data).map(([key, value]) => {
                    if (value && typeof value !== 'object') {
                      return (
                        <div key={key} className="space-y-1">
                          <p className="text-sm font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {value.toString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {data && progress === 100 && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Use This Data
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}