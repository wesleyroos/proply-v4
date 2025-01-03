import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ToastDemo() {
  const { toast } = useToast();

  return (
    <div className="flex flex-col gap-4 p-8">
      <h2 className="text-2xl font-bold mb-4">Toast Notifications Demo</h2>
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="default"
          onClick={() => {
            toast({
              title: "Success",
              description: "Operation completed successfully",
              variant: "success",
              duration: 3000,
            });
          }}
        >
          Show Success Toast
        </Button>

        <Button
          variant="destructive"
          onClick={() => {
            toast({
              title: "Error",
              description: "Something went wrong!",
              variant: "destructive",
              duration: 3000,
            });
          }}
        >
          Show Error Toast
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            toast({
              title: "Information",
              description: "Here's some useful information.",
              variant: "info",
              duration: 3000,
            });
          }}
        >
          Show Info Toast
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            toast({
              title: "Warning",
              description: "Please be careful!",
              variant: "warning",
              duration: 3000,
            });
          }}
        >
          Show Warning Toast
        </Button>

        <Button
          onClick={() => {
            toast({
              title: "Action Required",
              description: "Please take action",
              variant: "default",
              action: (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Action taken",
                      description: "You clicked the action button",
                      variant: "success",
                      duration: 2000,
                    });
                  }}
                >
                  Undo
                </Button>
              ),
            });
          }}
        >
          Toast with Action
        </Button>
      </div>
    </div>
  );
}