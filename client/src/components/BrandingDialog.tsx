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
  const { hasAccess } = useProAccess();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const response = await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              companyLogo: base64Data,
            }),
            credentials: "include",
          });
          if (!response.ok) throw new Error(await response.text());
          await queryClient.invalidateQueries({ queryKey: ["user"] });
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
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <DialogTitle>
            {hasAccess ? "Include Branding" : "Company Branding"}
          </DialogTitle>
          {!hasAccess && (
            <>
              <span className="bg-gradient-to-r from-primary to-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                PRO
              </span>
              <Sparkles className="h-4 w-4 text-[#1BA3FF]" />
            </>
          )}
        </div>
        <DialogDescription>
          {hasAccess
            ? "Would you like to include your company branding in this report?"
            : "Upload your company logo and upgrade to Pro to include it in your reports"}
        </DialogDescription>
      </DialogHeader>

      {/* Logo upload/preview section - available for all users */}
      <div className="flex flex-col gap-4">
        {user?.companyLogo ? (
          <div className="flex items-center gap-4 mb-4">
            <img
              src={user.companyLogo}
              alt="Company Logo"
              className="w-32 h-32 object-contain border rounded-lg"
            />
          </div>
        ) : (
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Upload your company logo to use in reports
            </p>
          </div>
        )}
      </div>

      {/* Different action buttons based on subscription status */}
      <div className="flex justify-end gap-4 mt-4">
        {hasAccess ? (
          <>
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
              disabled={!user?.companyLogo}
            >
              Include Branding
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onGeneratePDF(false);
              }}
            >
              Continue without branding
            </Button>
            <Button
              onClick={onShowUpgrade}
              className="bg-[#1BA3FF] hover:bg-[#114D9D]"
            >
              Upgrade to Pro
            </Button>
          </>
        )}
      </div>
    </DialogContent>
  );
}