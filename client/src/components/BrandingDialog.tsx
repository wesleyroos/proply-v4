
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
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
  const { hasProAccess } = useProAccess();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyLogo: reader.result,
          }),
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to upload logo");
        }

        queryClient.invalidateQueries(["user"]);
        toast({
          title: "Success",
          description: "Company logo uploaded successfully",
          duration: 3000,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to upload company logo",
          duration: 5000,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const renderLogoSection = () => (
    <div className="flex items-center gap-4 mb-4">
      <img
        src={user?.companyLogo}
        alt="Company Logo"
        className="w-32 h-32 object-contain border rounded-lg"
      />
      <div>
        <p className="text-sm text-muted-foreground">
          Your current company logo
        </p>
        {!hasProAccess && (
          <p className="text-sm text-yellow-600 mt-2">
            Upgrade to Pro to include your branding in PDF exports
          </p>
        )}
      </div>
    </div>
  );

  const renderProContent = () => (
    <div className="flex flex-col gap-4">
      {user?.companyLogo ? (
        renderLogoSection()
      ) : (
        <div>
          <Input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
          />
        </div>
      )}
      <div className="flex justify-end gap-4 mt-4">
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
    </div>
  );

  const renderFreeContent = () => (
    <div className="flex flex-col gap-4">
      {user?.companyLogo && renderLogoSection()}
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
    </div>
  );

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
        {hasProAccess ? renderProContent() : renderFreeContent()}
      </DialogContent>
    </Dialog>
  );
}
