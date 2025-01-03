import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ToastDemo() {
  const { toast } = useToast();

  return (
    <div className="flex flex-col gap-4 p-8">
      <h2 className="text-2xl font-bold mb-4">Toast Notifications Demo</h2>
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => {
            toast({
              title: "Success",
              description: "Operation completed successfully",
              variant: "default",
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
            });
          }}
        >
          Show Info Toast
        </Button>

        <Button
          onClick={() => {
            toast({
              title: "Action Required",
              description: "Please take action",
              action: (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log("Action clicked")}
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
