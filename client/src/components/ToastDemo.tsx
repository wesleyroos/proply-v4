import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ToastDemo() {
  const { toast } = useToast();

  const showToast = (type: string) => {
    console.log(`Attempting to show ${type} toast`);
    try {
      switch (type) {
        case 'success':
          toast({
            title: "Success",
            description: "Operation completed successfully",
            variant: "success",
            duration: 3000,
          });
          break;
        case 'error':
          toast({
            title: "Error",
            description: "Something went wrong!",
            variant: "destructive",
            duration: 3000,
          });
          break;
        case 'info':
          toast({
            title: "Information",
            description: "Here's some useful information.",
            variant: "info",
            duration: 3000,
          });
          break;
        case 'warning':
          toast({
            title: "Warning",
            description: "Please be careful!",
            variant: "warning",
            duration: 3000,
          });
          break;
        default:
          toast({
            title: "Default",
            description: "Default toast message",
            variant: "default",
            duration: 3000,
          });
      }
      console.log(`Toast of type ${type} triggered successfully`);
    } catch (error) {
      console.error('Error showing toast:', error);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-8">
      <h2 className="text-2xl font-bold mb-4">Toast Notifications Demo</h2>
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="default"
          onClick={() => showToast('success')}
        >
          Show Success Toast
        </Button>

        <Button
          variant="destructive"
          onClick={() => showToast('error')}
        >
          Show Error Toast
        </Button>

        <Button
          variant="outline"
          onClick={() => showToast('info')}
        >
          Show Info Toast
        </Button>

        <Button
          variant="secondary"
          onClick={() => showToast('warning')}
        >
          Show Warning Toast
        </Button>

        <Button
          onClick={() => {
            console.log('Attempting to show toast with action');
            try {
              toast({
                title: "Action Required",
                description: "Please take action",
                variant: "default",
                action: (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Action button clicked');
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
              console.log('Toast with action triggered successfully');
            } catch (error) {
              console.error('Error showing toast with action:', error);
            }
          }}
        >
          Toast with Action
        </Button>
      </div>
    </div>
  );
}