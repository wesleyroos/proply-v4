
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { Laptop } from "lucide-react";

export function MobileNotice() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setOpen(true);
    }
  }, [isMobile]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[320px] text-center mx-auto">
        <div className="flex flex-col items-center gap-8 py-8 px-4 max-w-[280px] mx-auto">
          <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
            <Laptop className="h-10 w-10 text-blue-600" />
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-xl">Hey there! 👋</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              While we're working on our mobile experience, Proply works best on desktop. 
              Feel free to create an account now, and dive into the full experience on your computer later!
            </p>
          </div>
          <Button 
            onClick={() => setOpen(false)} 
            className="bg-[#1BA3FF] hover:bg-[#114D9D] w-full py-6"
          >
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
