import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function ToastDemo() {
  const { toast } = useToast();
  console.log('ToastDemo component rendered, toast function available:', !!toast);

  const showToast = (variant: 'default' | 'destructive' | 'success' | 'warning' | 'info') => {
    console.log(`Showing ${variant} toast`);

    toast({
      variant,
      title: variant.charAt(0).toUpperCase() + variant.slice(1),
      description: `This is a ${variant} message`,
      duration: 5000,
    });
  };

  // Test toast on component mount
  useEffect(() => {
    console.log("ToastDemo mounted");
    // Delay the initial toast to ensure everything is mounted
    setTimeout(() => {
      console.log("Triggering initial test toast");
      showToast('default');
    }, 1000);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-8">
      <h2 className="text-2xl font-bold mb-4">Toast Notifications Demo</h2>
      <div className="grid grid-cols-2 gap-4">
        <Button 
          onClick={() => showToast('default')}
        >
          Default Toast
        </Button>
        <Button 
          variant="destructive" 
          onClick={() => showToast('destructive')}
        >
          Error Toast
        </Button>
        <Button 
          variant="outline" 
          onClick={() => showToast('info')}
        >
          Info Toast
        </Button>
        <Button 
          variant="secondary" 
          onClick={() => showToast('warning')}
        >
          Warning Toast
        </Button>
        <Button 
          className="bg-green-500 hover:bg-green-600 text-white" 
          onClick={() => showToast('success')}
        >
          Success Toast
        </Button>
      </div>
    </div>
  );
}