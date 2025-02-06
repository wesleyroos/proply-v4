import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useProAccess } from "@/hooks/use-pro-access";
//import { useQueryClient } from "@tanstack/react-query"; // Removed unused import
//import { useToast } from "@/hooks/use-toast"; // Removed unused import

interface BrandingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGeneratePDF: (includeBranding: boolean) => void;
  onShowUpgrade: () => void;
}

export function BrandingDialog({
  open,
  onOpenChange,
  onGeneratePDF,
  onShowUpgrade,
}: BrandingDialogProps) {
  const { user } = useUser();
  const { hasAccess: hasProAccess } = useProAccess();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Include Company Branding?</DialogTitle>
            <span className="bg-gradient-to-r from-primary to-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
              PRO
            </span>
            <Sparkles className="h-4 w-4 text-[#1BA3FF]" />
          </div>
          <DialogDescription>
            Would you like to include your company branding in the PDF?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {user?.companyLogo && (
            <div className="flex items-center gap-4 mb-4">
              <img
                src={user.companyLogo}
                alt="Company Logo"
                className="w-32 h-32 object-contain border rounded-lg"
              />
              <div>
                <p className="text-sm text-muted-foreground">
                  Your current company logo
                </p>
              </div>
            </div>
          )}

          {hasProAccess ? (
            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onGeneratePDF(false);
                }}
              >
                Generate Without Branding
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onGeneratePDF(true);
                }}
              >
                Include Branding
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground text-center">
                Company branding requires a Pro subscription
              </p>
              <div className="flex gap-4">
                <Button onClick={onShowUpgrade}>
                  Upgrade to Pro
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    onGeneratePDF(false);
                  }}
                >
                  Continue without branding
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}