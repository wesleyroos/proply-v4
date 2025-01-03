import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ToastDemo() {
  const { toast } = useToast();
  console.log('ToastDemo component rendered, toast function:', !!toast);

  const showToast = (type: string) => {
    console.log(`Attempting to show ${type} toast`);
    try {
      const toastData = {
        title: type.charAt(0).toUpperCase() + type.slice(1),
        description: `This is a ${type} message`,
        variant: type === 'error' ? 'destructive' : type,
        duration: 3000,
      };
      console.log('Creating toast with data:', toastData);
      const result = toast(toastData);
      console.log('Toast creation result:', result);
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
          onClick={() => showToast('default')}
        >
          Show Default Toast
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
      </div>
    </div>
  );
}